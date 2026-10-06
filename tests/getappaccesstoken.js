// @ts-check
// Getting app access token via Client credentials grant flow
// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");

async function main() {
	process.stdout.write("Getting .env variables... ");
	const counter = new Counter();
	const env = getEnvVariables();
	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);

	process.stdout.write("Requesting app access token... ");
	counter.reset();

	/** @type {Twitch.Response<Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.ResponseBody, Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.ResponseBodyError>} */
	let request;
	/** @type {Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.ResponseBody} */
	let response;
	try {
		request = await Twitch.OAuth2.GetAppAccessTokenWithClientCredentials.fetch({client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET});
		if (!request.ok) throw new Error(`${request.status} ${request.statusText} - ${(await request.json()).message}`);
		response = await request.json();
	} catch(e) {
		console.error(e);
		process.exit(1);
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`APP_ACCESS_TOKEN: ${response.access_token}`);
	console.log(`EXPIRES_IN: ${response.expires_in}ms - ${new Date(Date.now() + response.expires_in).toString()}`);
	console.log(`TOKEN_TYPE: ${response.token_type}`);
}

if (process.argv[1] === __filename)
	main().catch(console.error);