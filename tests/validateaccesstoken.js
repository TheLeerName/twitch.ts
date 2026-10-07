// @ts-check

const { Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");

/**
 * 
 * @param {string} [token] 
 */
async function main(token) {
	token ??= await (async() => {
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		const token = await rl.question("ACCESS_TOKEN: ");
		rl.close();
		return token;
	})();
	if (token === "")
		return console.error("Token must not be empty string!");

	process.stdout.write("Validating access token... ");
	const counter = new Counter();

	/** @type {Twitch.Response<Twitch.OAuth2.ValidateAccessToken.ResponseBody, Twitch.OAuth2.ValidateAccessToken.ResponseBodyError>} */
	let request;
	/** @type {Twitch.OAuth2.ValidateAccessToken.ResponseBody} */
	let response;
	try {
		request = await Twitch.OAuth2.ValidateAccessToken.fetch({token});
		if (!request.ok) {
			const response = await request.json();
			if (response.message === "invalid access token")
				return console.error(`Token is not valid!`);

			throw new Error(`${request.status} ${request.statusText} - ${response.message}`);
		}
		response = await request.json();
	} catch(e) {
		console.error(e);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`CLIENT_ID: ${response.client_id}`);
	if (response.scopes != null)
		console.log(`SCOPES: ${response.scopes.join(", ")}`);
	console.log(`EXPIRES_IN: ${response.expires_in}s - ${new Date(Date.now() + response.expires_in * 1000).toString()}`);
	if (response.login != null) {
		console.log(`IS_USER_ACCESS_TOKEN: true`);
		console.log(`USER_ID: ${response.user_id}`);
		console.log(`LOGIN: ${response.login}`);
	}
	else
		console.log(`IS_USER_ACCESS_TOKEN: false`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename)
	main(process.argv[2]).catch(console.error);