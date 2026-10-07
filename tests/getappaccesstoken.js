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

	/** @type {Twitch.Response<Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.ResponseBody, Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.ResponseBodyError>} */
	let request;
	/** @type {Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.ResponseBody} */
	let response;
	try {
		request = await Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.fetch({client_id, client_secret});
		if (!request.ok) throw new Error(`${request.status} ${request.statusText} - ${(await request.json()).message}`);
		response = await request.json();
	} catch(e) {
		console.error(e);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`APP_ACCESS_TOKEN: ${response.access_token}`);
	console.log(`EXPIRES_IN: ${response.expires_in}s - ${new Date(Date.now() + response.expires_in * 1000).toString()}`);
	console.log(`TOKEN_TYPE: ${response.token_type}`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename) {
	const env = getEnvVariables();
	main(env.CLIENT_ID, env.CLIENT_SECRET).catch(console.error);
}