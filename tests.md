# Tests
> [!NOTE]
> Before doing any tests, build source and go to tests directory!
> 1. `npm i`
> 2. `npm run build`
> 3. `cd tests`

> [!NOTE]
> All tests can be runned via `node index.js`!

## Getting app access token via Client Credentials
Can be runned with `node get-app-access-token.js` or choosing it in `node index.js`. Gets app access token using Client Credentials, this token is non-refreshable, expirable (about 2 months), revokable and is meant only for server-to-server API requests that use this type of token. Works by:
1. Sending POST request to `https://id.twitch.tv/oauth2/token?grant_type=client_credentials` with additional `client_id`, `client_secret` query parameters
2. Getting body with token, their type (always `bearer`) and `expires_in` of it (in seconds, usually 2 months)

## Getting user access token via Authorization Code
Can be runned with `node get-user-access-token.js` or choosing it in `node index.js`. Gets user access token using Authorization Code, this token is refreshable, expirable (about 4 hours), revokable and is meant for apps that use a server, can securely store a client secret, and can make server-to-server requests to the Twitch API. Works by:
1. Creating URL with `client_id`, `redirect_uri` query parameters
2. Creating local HTTP server listening on `redirect_uri`
3. When user clicks this link and authorizes in it, twitch will redirect user to `redirect_uri` with some query parameters containing authorization code and scopes (or error if error occurred)
4. Local HTTP server will get authorization code from redirection
5. Sending POST request to `https://id.twitch.tv/oauth2/token?grant_type=authorization_code` with additional `client_id`, `client_secret`, `code` (authorization code from redirect) query parameters
6. Getting body from request with user access token, their type (always `bearer`), `refresh_token`, scopes, `expires_in` of it (in seconds, usually 4 hours)

## Validating access token
Can be runned with `node validate-access-token.js` or choosing it in `node index.js`. Validates access token and returns some information about it. Works by:
1. Sending GET request to `https://id.twitch.tv/oauth2/validate` with additional `token` query parameter
2. Getting body with `client_id`, scopes, `expires_in` of it (in seconds), `login` and `user_id` of user associated with this token (if token is app access token, these fields are `undefined`)

## Refreshing user access token
Can be runned with `node refresh-user-access-token.js` or choosing it in `node index.js`. Refreshes user access token, can be used if your token has expired and when API endpoints returning 401 Unauthorized. Works by sending POST request to `https://id.twitch.tv/oauth2/token` with `client_id`, `client_secret`, `refresh_token` query parameters.

## Revoking access token
Can be runned with `node revoke-access-token.js` or choosing in `node index.js`. Revokes app or user access token, can be used if this token doesnt longer needed by your app. Works by sending POST request to `https://id.twitch.tv/oauth2/revoke` with `client_id` and `token` query parameters.

## EventSub WebSocket: channel.chat.message event
Can be runned with `node eventsub-ws-channel-chat-message.js` or choosing it in `node index.js`. Subscribes to `channel.chat.message` event of version `1` for listening messages in twitch chat. Works by:
1. Connects to WebSocket server on `wss://eventsub.wss.twitch.tv/ws` via `ReconnectingWebSocket` library
2. Getting `session_welcome` message with `session_id`
3. Sending POST request to `https://api.twitch.tv/helix/eventsub/subscriptions` with body parameters containing type and version of subscription, condition (on `channel.chat.message` its id of broadcaster and id of user associated with access token), transport (on websocket connection its just `session_id`). This creates new event subscription
4. Listening for `notification` messages containing `channel.chat.message` subscription type and printing them to terminal