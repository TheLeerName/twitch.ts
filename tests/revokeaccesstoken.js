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

	const result = await Twitch.OAuth2.RevokeAccessToken.axiosRequest({client_id, token});
	if (!result.ok) {
		if (result.message === "token Invalid token")
			console.error(`Token is not valid!`);
		else
			console.error(`${result.status} - ${result.message}`);
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