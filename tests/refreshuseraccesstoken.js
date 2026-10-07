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

	const result = await Twitch.OAuth2.RefreshUserAccessToken.axiosRequest({client_id, client_secret, refresh_token});
	if (!result.ok) {
		if (result.message === "Invalid refresh token")
			console.error(`Token is not valid!`);
		else
			console.error(`${result.status} - ${result.message}`);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`USER_ACCESS_TOKEN: ${result.access_token}`);
	console.log(`REFRESH_TOKEN: ${result.refresh_token}`);
	if (result.scope != null)
		console.log(`SCOPES: ${result.scope.join(", ")}`);
	console.log(`EXPIRES_IN: ${result.expires_in}s - ${new Date(Date.now() + result.expires_in * 1000).toString()}`);
	console.log(`TOKEN_TYPE: ${result.token_type}`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename) {
	const env = getEnvVariables();
	main(env.CLIENT_ID, env.CLIENT_SECRET, process.argv[2]).catch(console.error);
}