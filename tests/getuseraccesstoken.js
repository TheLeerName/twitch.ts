// @ts-check

const { getEnvVariables, Counter } = require(".");
const Twitch = require("../dist");
const readline = require("readline/promises");
const http = require("http");

/**
 * 
 * @param {string[] | undefined} scopes 
 */
async function main(scopes) {
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

	process.stdout.write("Getting .env variables... ");
	const counter = new Counter();
	const env = getEnvVariables();
	process.stdout.write(`Finished! (${counter.stamp()}ms)\n\n`);

	const redirect_uri = new URL(env.REDIRECT_URI);
	const code = await new Promise(resolve => {
		process.stdout.write("Starting local HTTP server... ");
		const server = http.createServer();
		server.addListener("request", (req, res) => {
			res.setHeader("Content-Type", "text/plain;charset=utf-8");
			if (req.method !== "GET") {
				res.statusCode = 405;
				return res.end();
			}

			const url = new URL(req.url ?? "", redirect_uri);
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
		server.listen(parseInt(redirect_uri.port), redirect_uri.hostname, () => {
			process.stdout.write(`Started on ${env.REDIRECT_URI} (${counter.stamp()}ms)\nClick the link and authorize the app: ${Twitch.OAuth2.GetAuthorizationCode.makeURL({client_id: env.CLIENT_ID, redirect_uri: env.REDIRECT_URI, scope: scopes})}\n`);
		});
	});
	process.stdout.write(`AUTHORIZATION_CODE: ${code}\n\n`);

	process.stdout.write("Requesting user access token... ");
	counter.reset();

	/** @type {Twitch.Response<Twitch.OAuth2.GetUserAccessTokenWithAuthorizationCode.ResponseBody, Twitch.OAuth2.GetUserAccessTokenWithAuthorizationCode.ResponseBodyError>} */
	let request;
	/** @type {Twitch.OAuth2.GetUserAccessTokenWithAuthorizationCode.ResponseBody} */
	let response;
	try {
		request = await Twitch.OAuth2.GetUserAccessTokenWithAuthorizationCode.fetch({client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, redirect_uri: env.REDIRECT_URI, code});
		if (!request.ok) throw new Error(`${request.status} ${request.statusText} - ${(await request.json()).message}`);
		response = await request.json();
	} catch(e) {
		console.error(e);
		process.exit(1);
	}

	process.stdout.write(`Finished! (${counter.stamp()}ms)\n`);
	console.log(`USER_ACCESS_TOKEN: ${response.access_token}`);
	console.log(`REFRESH_TOKEN: ${response.refresh_token}`);
	console.log(`SCOPES: ${response.scope.join(", ")}`);
	console.log(`EXPIRES_IN: ${response.expires_in}s - ${new Date(Date.now() + response.expires_in * 1000).toString()}`);
	console.log(`TOKEN_TYPE: ${response.token_type}`);
}

if (process.argv[1] === __filename)
	main().catch(console.error);