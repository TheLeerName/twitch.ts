// @ts-check

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");

/**
 * 
 * @param {string} client_id 
 * @param {string} [token] 
 */
async function main(client_id, token) {
	token ??= await (async() => {
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		const token = await rl.question("ACCESS_TOKEN: ");
		rl.close();
		return token;
	})();
	if (token === "")
		return console.error("Token must not be empty string!");

	process.stdout.write("Revoking access token... ");
	const counter = new Counter();

	/** @type {Twitch.Response<undefined, Twitch.OAuth2.RevokeAccessToken.ResponseBodyError>} */
	let request;
	try {
		request = await Twitch.OAuth2.RevokeAccessToken.fetch({client_id, token});
		if (!request.ok) {
			const response = await request.json();
			if (response.message === "token Invalid token")
				return console.error(`Token is not valid!`);

			throw new Error(`${request.status} ${request.statusText} - ${response.message}`);
		}
	} catch(e) {
		console.error(e);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename) {
	const env = getEnvVariables();
	main(env.CLIENT_ID, process.argv[2]).catch(console.error);
}