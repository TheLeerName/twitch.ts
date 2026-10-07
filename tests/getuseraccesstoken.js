// @ts-check

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");
const http = require("http");

/**
 * 
 * @param {string} client_id 
 * @param {string} client_secret 
 * @param {string} redirect_uri 
 * @param {string[]} [scopes] 
 */
async function main(client_id, client_secret, redirect_uri, scopes) {
	if (scopes == null) {
		scopes = [];

		process.stdout.write(`Set required authorization scopes here (leave empty to stop adding them)\n`);
		const rl = readline.createInterface({input: process.stdin, output: process.stdout});
		while(true) {
			const scope = await rl.question(`Scope ${scopes.length + 1}: `);
			if (scope.length < 1) break;
			scopes.push(scope);
		}
		rl.close();
		console.log("");
	}

	const counter = new Counter();
	const redirect_uri_URL = new URL(redirect_uri);
	const code = await new Promise(resolve => {
		process.stdout.write("Starting local HTTP server... ");
		const server = http.createServer();
		server.addListener("request", (req, res) => {
			res.setHeader("Content-Type", "text/plain;charset=utf-8");
			if (req.method !== "GET") {
				res.statusCode = 405;
				return res.end();
			}

			const url = new URL(req.url ?? "", redirect_uri_URL);
			if (url.pathname !== "/") {
				res.statusCode = 404;
				return res.end();
			}

			const response = Twitch.OAuth2.GetAuthorizationCode.parseRedirectURL(url);
			if (response.error != null) {
				res.statusCode = 500;
				res.write(`${response.error}\n${response.error_description}`);
				console.log(`500 Internal Server Error: ${response.error} - ${response.error_description}`);
				return res.end();
			}

			res.statusCode = 202;
			res.write("You can close this window now");
			res.end();
			server.closeAllConnections();
			server.closeIdleConnections();
			server.close();
			resolve(response.code);
		});
		server.listen(parseInt(redirect_uri_URL.port), redirect_uri_URL.hostname, () => {
			process.stdout.write(`Started on ${redirect_uri} (${counter.stamp()}ms)\nClick the link and authorize the app: ${Twitch.OAuth2.GetAuthorizationCode.makeURL({client_id, redirect_uri, scope: scopes})}\n`);
		});
	});
	process.stdout.write(`AUTHORIZATION_CODE: ${code}\n\n`);

	process.stdout.write("Requesting user access token... ");
	counter.reset();

	const result = await Twitch.OAuth2.GetUserAccessTokenWithAuthorizationCode.axiosRequest({client_id, client_secret, redirect_uri, code});
	if (!result.ok) {
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
	main(env.CLIENT_ID, env.CLIENT_SECRET, env.REDIRECT_URI).catch(console.error);
}