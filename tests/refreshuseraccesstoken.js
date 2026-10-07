// @ts-check

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");

/**
 * 
 * @param {string} client_id 
 * @param {string} client_secret 
 * @param {string} [refresh_token] 
 */
async function main(client_id, client_secret, refresh_token) {
	refresh_token ??= await (async() => {
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		const token = await rl.question("REFRESH_TOKEN: ");
		rl.close();
		return token;
	})();
	if (refresh_token === "")
		return console.error("Token must not be empty string!");

	process.stdout.write("Refreshing user access token... ");
	const counter = new Counter();

	/** @type {Twitch.Response<Twitch.OAuth2.RefreshUserAccessToken.ResponseBody, Twitch.OAuth2.RefreshUserAccessToken.ResponseBodyError>} */
	let request;
	/** @type {Twitch.OAuth2.RefreshUserAccessToken.ResponseBody} */
	let response;
	try {
		request = await Twitch.OAuth2.RefreshUserAccessToken.fetch({client_id, client_secret, refresh_token});
		if (!request.ok) {
			const response = await request.json();
			if (response.message === "Invalid refresh token")
				return console.error(`Token is not valid!`);

			throw new Error(`${request.status} ${request.statusText} - ${response.message}`);
		}
		response = await request.json();
	} catch(e) {
		console.error(e);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`USER_ACCESS_TOKEN: ${response.access_token}`);
	console.log(`REFRESH_TOKEN: ${response.refresh_token}`);
	if (response.scope != null)
		console.log(`SCOPES: ${response.scope.join(", ")}`);
	console.log(`EXPIRES_IN: ${response.expires_in}s - ${new Date(Date.now() + response.expires_in * 1000).toString()}`);
	console.log(`TOKEN_TYPE: ${response.token_type}`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename) {
	const env = getEnvVariables();
	main(env.CLIENT_ID, env.CLIENT_SECRET, process.argv[2]).catch(console.error);
}