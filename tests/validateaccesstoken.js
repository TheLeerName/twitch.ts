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

	const result = await Twitch.OAuth2.ValidateAccessToken.axiosRequest({token});
	if (!result.ok) {
		if (result.message === "invalid access token")
			console.error(`Token is not valid!`);
		else
			console.error(`${result.status} - ${result.message}`);
		return;
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`CLIENT_ID: ${result.client_id}`);
	if (result.scopes != null)
		console.log(`SCOPES: ${result.scopes.join(", ")}`);
	console.log(`EXPIRES_IN: ${result.expires_in}s - ${new Date(Date.now() + result.expires_in * 1000).toString()}`);
	if (result.login != null) {
		console.log(`IS_USER_ACCESS_TOKEN: true`);
		console.log(`USER_ID: ${result.user_id}`);
		console.log(`LOGIN: ${result.login}`);
	}
	else
		console.log(`IS_USER_ACCESS_TOKEN: false`);
}

module.exports = {
	main,
};

if (process.argv[1] === __filename)
	main(process.argv[2]).catch(console.error);