# Tests
> [!NOTE]
> Before doing any tests, build source and go to tests directory!
> 1. `npm i`
> 2. `npm run build`
> 3. `cd tests`

> [!NOTE]
> All tests can be runned via `node index.js`!

## Getting app access token via Client Credentials
Can be runned with `node getappaccesstoken.js` or choosing in `node index.js`. Gets app access token using Client Credentials, this token is non-refreshable, expirable (about 2 months), revokable and is meant only for server-to-server API requests that use this type of token. Works by:
1. Sending POST request to `https://id.twitch.tv/oauth2/token?grant_type=client_credentials` with additional `client_id`, `client_secret` query parameters
2. Getting body with token, their type (always `bearer`) and `expires_in` of it (in seconds, usually 2 months)

## Getting user access token via Authorization Code
Can be runned with `node getuseraccesstoken.js` or choosing in `node index.js`. Gets user access token using Authorization Code, this token is refreshable, expirable (about 4 hours), revokable and is meant for apps that use a server, can securely store a client secret, and can make server-to-server requests to the Twitch API. Works by:
1. Creating URL with `client_id`, `redirect_uri` query parameters
2. Creating local HTTP server listening on `redirect_uri`
3. When user clicks this link and authorizes in it, twitch will redirect user to `redirect_uri` with some query parameters containing authorization code and scopes (or error if error occurred)
4. Local HTTP server will get authorization code from redirection
5. Sending POST request to `https://id.twitch.tv/oauth2/token?grant_type=authorization_code` with additional `client_id`, `client_secret`, `code` (authorization code from redirect) query parameters
6. Getting body from request with user access token, their type (always `bearer`), `refresh_token`, scopes, `expires_in` of it (in seconds, usually 4 hours)

## Refreshing user access token
Can be runned with `node refreshuseraccesstoken.js` or choosing in `node index.js`. Refreshes user access token, can be used if your token has expired and when API endpoints returning 401 Unauthorized. Works by sending POST request to `https://id.twitch.tv/oauth2/token` with `client_id`, `client_secret`, `refresh_token` query parameters.

## Revoking access token
Can be runned with `node revokeaccesstoken.js` or choosing in `node index.js`. Revokes app or user access token, can be used if this token doesnt longer needed by your app. Works by sending POST request to `https://id.twitch.tv/oauth2/revoke` with `client_id` and `token` query parameters.