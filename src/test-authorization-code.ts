import { Request, Authorization } from './index';

// To run:
// node dist/test-authorization-code.js
// 
// Getting user access token via authorization code grant flow
// Must be used by most functions of Twitch API, and also for EventSub WebSockets
// Using this flow is more complex than just implicit grant flow
// Because implicit grant flow gives you just access token which has expiration date (usually 2 months), and you cant do anything about it, only ask user to authorize app again :/
// 
// Prints to terminal URL to where you need to authorize app to get authorization code
// You need to paste parameter code to third argument (node dist/test-authorization-code.js <code>)
// After successful getting authorization code gets user access token from it and prints to terminal information about it
// Waits for expiring access token and then gets new access token with refresh token gotten from Request.OAuth2Token.AuthorizationCode (if you dont want to wait, just comment out line with setTimeout and ending line of this function)
// And after revokes access token (cuz its just a example)
// 
// With this you can refresh access token without needing to reauthorizing app by user every 2 months
// If token owner will change their password or disconnects this app, or refresh token will become invalid in 30 days (only if this app is Public, usually its Confidential), access token will be invalid though
// 
// Also dont forget to fill consts with your app information below for running test!!!

const client_id = "";
const client_secret = "";
const redirect_uri = "";

async function main() {
	const authorization_code = process.argv[2];
	if (!authorization_code) {
		console.log(`\n${Authorization.URL.Code(client_id, redirect_uri)}\nAuthorize the app with link above and paste parameter to third argument (node dist/test-authorization-code.js <code>) from /?code= to &scope= in gotten link\n`);
		process.exit();
	}

	console.log("\nGetting user access token with authorization code...");
	const token_data = await Request.OAuth2Token.AuthorizationCode(client_id, client_secret, redirect_uri, authorization_code);
	console.log(`\tresponse: ${JSON.stringify(token_data)}`);
	if (token_data.ok) {
		console.log(`\taccess_token: ${token_data.access_token}`);
		const expires_in = token_data.expires_in * 1000;
		console.log(`\texpires_in: ${new Date(Date.now() + expires_in)}\n\nWaiting for token to expire...`);
		setTimeout(async() => {
			const refresh = await Request.OAuth2Token.RefreshToken(client_id, client_secret, token_data.refresh_token);
			console.log(`\trefresh: ${JSON.stringify(refresh)}`);
			if (refresh.ok) {
				token_data.access_token = refresh.access_token;
				token_data.refresh_token = refresh.refresh_token;
				console.log(`\tnew_access_token: ${token_data.access_token}\n\tnew_refresh_token: ${token_data.refresh_token}`);

				const revoke = await Request.OAuth2Revoke({ type: "app", token: token_data.access_token, client_id, scopes: token_data.scope, expires_in: 0 });
				console.log(`\trevoke: ${JSON.stringify(revoke)}`);
			}
			else {
				throw `\nRequest.OAuth2Token.Refresh failed!\n\tcode: ${refresh.status}\n\terror: ${refresh.message}`;
			}
		}, expires_in);
	}
	else {
		throw `\nRequest.OAuth2Token.AuthorizationCode failed!\n\tcode: ${token_data.status}\n\terror: ${token_data.message}`;
	}
}
main().catch(console.error);