// @ts-check
// Getting app access token via Client credentials grant flow
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");

/**
 * 
 * @param {string} client_id 
 * @param {string} client_secret 
 */
async function main(client_id, client_secret) {
	process.stdout.write("Requesting app access token... ");
	const counter = new Counter();

	const result = await Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.axiosRequest({client_id, client_secret});
	if (!result.ok) {
		console.error(`${result.status} - ${result.message}`);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`APP_ACCESS_TOKEN: ${result.access_token}`);
	console.log(`EXPIRES_IN: ${result.expires_in}s - ${new Date(Date.now() + result.expires_in * 1000).toString()}`);
	console.log(`TOKEN_TYPE: ${result.token_type}`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename) {
	const env = getEnvVariables();
	main(env.CLIENT_ID, env.CLIENT_SECRET).catch(console.error);
}