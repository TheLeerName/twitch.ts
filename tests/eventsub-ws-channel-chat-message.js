// @ts-check

const { Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");
const axios = require("axios");
const axiosRetry = require("axios-retry");

/**
 * 
 * @param {string} [token] 
 * @param {string} [broadcaster_id] 
 */
async function main(token, broadcaster_id) {
	token ??= await (async() => {
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		const token = await rl.question("ACCESS_TOKEN: ");
		rl.close();
		return token;
	})();
	if (token === "")
		return console.error("Must not be empty string!");

	process.stdout.write("Validating access token... ");
	const counter = new Counter();
	const resultValidate = await Twitch.OAuth2.ValidateAccessToken.axiosRequest({token});
	if (!resultValidate.ok) {
		if (resultValidate.message === "invalid access token")
			console.error(`Token is not valid!`);
		else
			console.error(`${resultValidate.status} - ${resultValidate.message}`);
		return;
	}
	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	if (!resultValidate.scopes || !resultValidate.scopes.includes("user:read:chat"))
		return console.error("Token must contain user:read:chat scope!");
	if (resultValidate.login == null)
		return console.error("Token must be user access token for using EventSub in WebSockets!");

	console.log(`  CLIENT_ID: ${resultValidate.client_id}`);
	if (resultValidate.scopes != null)
		console.log(`  SCOPES: ${resultValidate.scopes.join(", ")}`);
	console.log(`  EXPIRES_IN: ${resultValidate.expires_in}s - ${new Date(Date.now() + resultValidate.expires_in * 1000).toString()}`);
	console.log(`  IS_USER_ACCESS_TOKEN: true`);
	console.log(`  USER_ID: ${resultValidate.user_id}`);
	console.log(`  LOGIN: ${resultValidate.login}`);

	broadcaster_id ??= await (async() => {
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		const query = await rl.question("BROADCASTER (their name for searching): ");
		rl.close();
		if (query === "")
			return "";

		const resultSearch = await Twitch.Helix.SearchChannels.axiosRequest({client_id: resultValidate.client_id, token, query, first: 5});
		if (!resultSearch.ok)
			return `Error ${resultSearch.status}: ${resultSearch.message}`;
		console.log("");
		for (const entry of resultSearch.data)
			console.log(`${resultSearch.data.indexOf(entry)}. ${entry.display_name} (id: ${entry.id})${entry.is_live ? " LIVE" : ""} ${entry.tags.join(" ")}`);
		const index = await (async() => {
			const rl = readline.createInterface({input: process.stdin, output: process.stdout});
			const query = await rl.question(`Choose (0-${resultSearch.data.length - 1}): `);
			rl.close();
			return parseInt(query);
		})();
		if (isNaN(index))
			return "Input is NaN!";
		const broadcaster_id = resultSearch.data[index]?.id;
		if (!broadcaster_id)
			return "Input is outside bounds!";
		return broadcaster_id;
	})();
	if (broadcaster_id === "")
		return console.error("Must not be empty string!");
	if (broadcaster_id.includes(" "))
		return console.error(broadcaster_id);

	process.stdout.write("Connecting to WebSocket server... ");
	counter.reset();
	const ws = new Twitch.EventSub.WebSocket();
	ws.on("session_welcome", async(message, isReconnected) => {
		if (!isReconnected) {
			process.stdout.write("Subscribing to event channel.chat.message... ");
			counter.reset();
			const result = await Twitch.Helix.CreateEventSubSubscription.axiosRequest({
				client_id: resultValidate.client_id,
				token,
				data: Twitch.EventSub.ChannelChatMessage.RequestBody({broadcaster_user_id: broadcaster_id, user_id: resultValidate.user_id}, {method: "websocket", session_id: ws.session.id}),
			});
			if (!result.ok) {
				console.error(`Error ${result.status}: ${result.message}`);
				process.exit(1);
			}
			process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
			console.log(`  total_cost: ${result.total_cost} / ${result.max_total_cost}`);
			console.log(`Listening for events...`);
		}
	});
	ws.on("channel.chat.message", message => {
		console.log(`  ${message.payload.event.broadcaster_user_name}: ${message.payload.event.message.text}`);
	});
	ws.on("revocation", message => {
		if (message.payload.subscription.status === "authorization_revoked")
			console.error("Error: Owner of access token has revoked the authorization.");
		else if (message.payload.subscription.status === "user_removed")
			console.error("Error: Broadcaster or chatting user was banned.");
		else if (message.payload.subscription.status === "version_removed")
			console.error(`Error: ${message.payload.subscription.type} with version ${message.payload.subscription.version} is no longer supported.`);
		process.exit(1);
	});
	ws.on("close", (code, reason) => {
		console.log(`WebSocket was closed with code ${code}: ${reason}`);
	});
	await new Promise(resolve => {
		ws.prependOnceListener("session_welcome", message => {
			process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
			console.log(`  SESSION_ID: ${message.payload.session.id}`);
			//resolve(undefined);

			/*console.log("After 10 seconds WebSocket will be closed...");
			setTimeout(() => {
				ws.close();
				resolve(undefined);
			}, 10_000);*/
		});
	});
}

module.exports = {
	main,
};

if (process.argv[1] === __filename) {
	axiosRetry.default(axios, {retryDelay: axiosRetry.exponentialDelay});
	main(process.argv[2], process.argv[3]).catch(console.error);
}