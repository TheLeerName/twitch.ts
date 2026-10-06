// @ts-check

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");

/**
 * 
 * @param {string | undefined} token 
 */
async function main(token) {
	token ??= await (async() => {
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		const token = await rl.question("ACCESS_TOKEN: ");
		rl.close();
		return token;
	})();

	process.stdout.write("Getting .env variables... ");
	const counter = new Counter();
	const env = getEnvVariables();
	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);

	process.stdout.write("Revoking access token... ");
	counter.reset();

	/** @type {Twitch.Response<undefined, Twitch.OAuth2.RevokeAccessToken.ResponseBodyError>} */
	let request;
	try {
		request = await Twitch.OAuth2.RevokeAccessToken.fetch({client_id: env.CLIENT_ID, token});
		if (!request.ok) throw new Error(`${request.status} ${request.statusText} - ${(await request.json()).message}`, {});
	} catch(e) {
		console.error(e);
		process.exit(1);
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
}

if (process.argv[1] === __filename)
	main(process.argv[2]).catch(console.error);