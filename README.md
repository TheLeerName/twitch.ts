# twitch.ts
- contains every endpoint of Twitch Helix and EventSub API (with comments and types of response)
- using axios to do http requests, it is recommended to use axios-retry to retry connection when no internet
- using ReconnectingWebSocket to do WebSocket connections

## Install
- `npm i --allow-git=all github:TheLeerName/twitch.ts#dev-2.0`

## Examples
- Getting data of current livestream on ironmouse channel
```js
import * as Twitch from "twitch.ts";

Twitch.Helix.GetStreams.axiosRequest({
	// client id from twitch developer app
	// tip: you can get it from just access token by validating token (check tests below)
	client_id: "",

	// user or app access token, it must belong to developer app specified in client_id above, check tests below to get it
	token: "",

	// user login query, its just a display name, but lowercased
	user_login: "ironmouse",

	// enable only livestreams
	type: "live",
}).then(r => {
	if (!r.ok) throw new Error(`${r.status} - ${r.message}`);

	const data = r.data[0];
	if (data)
		console.log(`${data.user_name} - ${data.title} (${data.game_name}), ${data.viewer_count} viewers`);
	else
		throw new Error(`Requested streamer is not currently streaming or streamer is not exists`);
})
```
- Getting chat messages
```js
import * as Twitch from "../dist";

const client_id = "";
// user access token, app access token cant be used on websockets
const token = "";
// owner of access token
const user_id = "";
// will listen chat of this user
const broadcaster_user_id = "";

const ws = new Twitch.EventSub.WebSocket();
ws.on("session_welcome", async(message, isReconnectedByTwitch) => {
	if (!isReconnectedByTwitch) {
		const subscription = Twitch.EventSub.ChannelChatMessage.RequestBody({
			broadcaster_user_id, user_id,
		}, {
			method: "websocket", session_id: message.payload.session.id,
		});
		const result = await Twitch.Helix.CreateEventSubSubscription.axiosRequest({client_id, token, data: subscription});

		if (!result.ok)
			throw new Error(`Subscribing to ${subscription.type}@${subscription.version} to channel ${subscription.condition.broadcaster_user_id} by ${subscription.condition.user_id} failed with code ${result.status} - ${result.message}`);

		console.log("Listening for messages...");
	}
});
ws.on("channel.chat.message", message => {
	const event = message.payload.event;
	// here we are getting messages
	console.log(`${event.chatter_user_name}: ${event.message.text}`);
});
```

## [Tests](tests.md)