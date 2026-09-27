import { Request, Authorization } from './index';
import { createServer } from "http";

// To run:
// node dist/test-authorization-code.js <client_id> <client_secret>
// 
// NOTE: Set redirect_uri from this file to OAuth Redirect URL of your twitch app (https://dev.twitch.tv/console/apps) before doing this test
// redirect_uri can use http, but it can be only http://localhost with any port
// 
// Getting user access token via authorization code grant flow
// Must be used by most functions of Twitch API, and also for EventSub WebSockets
// Using this flow is more complex than just implicit grant flow
// Because implicit grant flow gives you just access token which has expiration date (usually 2 months), and you cant do anything about it, only ask user to authorize app again :/
// 
// How it works:
// 1. Starts the HTTP server on redirect_uri
// 2. Prints to terminal URL to where you need to authorize app to get authorization code
// 3. After successful getting authorization code gets user access token from it and prints to terminal information about it
// 4. Waits for expiring access token and then gets new access token with refresh token gotten from Request.OAuth2Token.AuthorizationCode (if you dont want to wait, just comment out line with setTimeout and ending line of this function)
// 5. And after revokes access token (cuz its just a example)
// 
// With this you can refresh access token without needing to reauthorizing app by user about every 2 months
// If token owner will change their password or disconnects this app access token will be invalid though (or refresh token will become invalid in 30 days, but its only if this app is Public, usually its Confidential)

const redirect_uri = "http://localhost:44026";
const scopes = [
	// Use this array to set your needed scopes!
	"user:read:chat",
	"user:write:chat",
] as const satisfies Authorization.Scope[];

function fatal(message?: any, ...optionalParams: any[]) {
	console.error(message, optionalParams);
	return process.exit(1);
}

function getProtocolHostPortFromURL(url: string): [string, string, number] {
	let protocol: string | RegExpMatchArray | null = url.match(/^(.*?):\/\//);
	if (protocol) {
		url = url.substring(protocol[0].length);
		protocol = protocol[1];
	}
	else
		protocol = "";

	let host = url;
	let port = protocol === "https" ? 443 : 80;
	if (host.includes(":")) {
		const split = host.split(":", 2);
		host = split[0];
		port = parseInt(split[1]); // fun fact: parseInt and parseFloat takes only first numbers: parseInt("345345l;ksdf2kl;34234") returns 345345
	}
	else
		host = host.match(/\w+/)?.[1] ?? host;
	return [protocol, host, port];
}

async function main() {
	if (redirect_uri.startsWith("https://"))
		fatal(`Please do not use https protocol for redirect_uri (this test doesnt support creating https server, only http)`);

	if (!redirect_uri.startsWith("http://localhost"))
		fatal(`You can use only localhost for http protocol in redirect_uri`);

	const client_id: string | undefined = process.argv[2];
	if (!client_id)
		fatal(`The client_id parameter is empty\n  node dist/test-authorization-code.js <client_id> <client_secret>`);

	const client_secret: string | undefined = process.argv[3];
	if (!client_secret)
		fatal(`The client_secret parameter is empty\n  node dist/test-authorization-code.js <client_id> <client_secret>`);

	const [protocol, host, port] = getProtocolHostPortFromURL(redirect_uri);

	let time = Date.now();
	const code = await new Promise<string>(resolve => {
		console.log(`Creating HTTP server...`);
		const server = createServer((req, res) => {
			res.setHeader("Content-Type", "text/plain;charset=utf-8");
			//console.log(`${req.method ?? "IDK"} ${req.url ?? "/"}`);
			//console.log(JSON.stringify(req.headers));
			if (req.method === "GET") {
				let url = req.url ?? "/";
				if (url.startsWith("/?")) {
					url = url.substring(2);
					for (const v of url.split("&")) if (v.startsWith("code=")) {
						res.statusCode = 202;
						res.write("You can close this window now");
						res.end();
						server.closeAllConnections();
						server.closeIdleConnections();
						server.close();
						resolve(v.substring(5));
						return;
					}
				}

				res.statusCode = 400;
				res.write("URL search parameters do not have the field code");
				res.end();
			}
			else {
				res.statusCode = 405;
				res.write(`${req.method} is not supported`);
				res.end();
			}
		});
		server.on("close", () => {
			console.log("HTTP server was closed");
		});
		server.listen(port, host, () => {
			let oldTime = time;
			time = Date.now();
			console.log(`HTTP server started on ${protocol}://${host}:${port} (${time - oldTime}ms elapsed)\n`);
			console.log(`Also you need to set OAuth Redirect URL in your twitch app to ${redirect_uri}\nClick the link and authorize the app:\n${Authorization.URL.Code(client_id, redirect_uri, scopes)}\n`);
		});
	});
	console.log(`Authorization code (${Date.now() - time}ms elapsed): ${code}`);

	console.log("\nGetting user access token with authorization code...");
	time = Date.now();
	const token_data = await Request.OAuth2Token.AuthorizationCode(client_id, client_secret, redirect_uri, code);
	console.log(`\tresponse (${Date.now() - time}ms elapsed): ${JSON.stringify(token_data)}`);
	if (token_data.ok) {
		console.log(`\taccess_token: ${token_data.access_token}`);
		console.log(`\trefresh_token: ${token_data.refresh_token}`);
		if (token_data.scopes.length > 0)
			console.log(`\tscopes: ${token_data.scopes.join(" ")}`);
		const expires_in = token_data.expires_in * 1000;
		console.log(`\texpires_in: ${new Date(Date.now() + expires_in).toISOString()}\n\nPress Ctrl + C to quit app\n\nWaiting for token to expire...`);
		setTimeout(async() => {
			time = Date.now();
			const refresh = await Request.OAuth2Token.RefreshToken(client_id, client_secret, token_data.refresh_token);
			console.log(`\trefresh (${Date.now() - time}ms elapsed): ${JSON.stringify(refresh)}`);
			if (refresh.ok) {
				token_data.access_token = refresh.access_token;
				token_data.refresh_token = refresh.refresh_token;
				console.log(`\tnew_access_token: ${token_data.access_token}\n\tnew_refresh_token: ${token_data.refresh_token}`);

				time = Date.now();
				const revoke = await Request.OAuth2Revoke({ type: "app", token: token_data.access_token, client_id, scopes: token_data.scopes, expires_in: 0 });
				console.log(`\trevoke (${Date.now() - time}ms elapsed): ${JSON.stringify(revoke)}`);
			}
			else
				fatal(`\nRequest.OAuth2Token.Refresh failed!\n\tcode: ${refresh.status}\n\terror: ${refresh.message}`);
		}, expires_in);
	}
	else
		fatal(`\nRequest.OAuth2Token.AuthorizationCode failed!\n\tcode: ${token_data.status}\n\terror: ${token_data.message}`);
}
main().catch(console.error);