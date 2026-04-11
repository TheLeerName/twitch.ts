import fs from 'fs';
import { Request, EventSub, Authorization } from './index';

// To run:
// node dist/test.js <user_access_token> <broadcaster_login>
// 
// Opens WebSocket session of EventSub
// Subscribes to channel.chat.message event with connecting to specified broadcaster stream chat which prints to terminal chatter name and message text from any sended message using user access token (from authorization code or implicit grant flow)
// Also has code to handle chat commands (try to write !ping to twitch chat after connecting to chat with this script) and send answer to chat
// 
// Pro tip: You can get user access token in ./test-authorization.code.ts

const scopes = [
	// Use this array to set your needed scopes!
	"user:read:chat",
	"user:write:chat",
] as const satisfies Authorization.Scope[];

const data_save_file = "data.json";
const data: {subscriptions_id: string[] } = fs.existsSync(data_save_file) ? JSON.parse(fs.readFileSync(data_save_file).toString()) : {subscriptions_id: []};
function saveData() {
	fs.writeFileSync(data_save_file, JSON.stringify(data));
}

function fatal(message?: any, ...optionalParams: any[]) {
	console.error(message, optionalParams);
	return process.exit(1);
}

async function subscribeToEvents(connection: EventSub.Connection, events: EventSub.Subscription[]) {
	const result = {total: 0, max_total_cost: 0, total_cost: 0};

	console.log(`Subscribing to events...`);
	for (const event of events) {
		let time = Date.now();
		const create_subscription = await Request.CreateEventSubSubscription(connection.authorization, event);
		if (create_subscription.status === 202) {
			console.log(`\t${event.type} (${Date.now() - time}ms elapsed): ${JSON.stringify(create_subscription.data)}`);

			result.total++;
			result.max_total_cost = create_subscription.max_total_cost;
			result.total_cost = create_subscription.total_cost;
			data.subscriptions_id.push(create_subscription.data.id);
		} else fatal(`\nFailed to subscribe to ${event.type} event\n\tresponse: ${JSON.stringify(create_subscription)}`);
	}
	saveData();
	console.log(`\tresult: ${JSON.stringify(result)}\nCompleted!\n`);
}

async function unsubscribeFromPreviousEvents(authorization: Authorization) {
	if (data.subscriptions_id.length > 0) {
		console.log(`Deleting previous subscriptions...`);
		for (const id of data.subscriptions_id) {
			let time = Date.now();
			const delete_sub = await Request.DeleteEventSubSubscription(authorization, id);
			console.log(`\t${id} (${Date.now() - time}ms elapsed): ${JSON.stringify(delete_sub)}`);
		}
		data.subscriptions_id = [];
		console.log(`Completed!\n`);
	}
}

async function main() {
	const token: string | undefined = process.argv[2];
	if (!token) return fatal(`The user_access_token parameter is empty\n\tnode dist/test.js <user_access_token> <broadcaster_login>`);

	const broadcaster_login: string | undefined = process.argv[3];
	if (!broadcaster_login) return fatal(`The broadcaster_login parameter is empty\n\tnode dist/test.js <user_access_token> <broadcaster_login>`);

	console.log(`Validating token...`);
	let time = Date.now();
	const response = await Request.OAuth2Validate(token);
	console.log(`\tresponse (${Date.now() - time}ms elapsed): ${JSON.stringify(response)}`);
	if (!response.ok) return fatal(`Token isn't valid!`);
	console.log(`\ttoken: ${response.token}`);
	console.log(`\texpires_in: ${new Date(Date.now() + response.expires_in * 1000).toISOString()}`);
	if (response.scopes.length > 0)
		console.log(`\tscopes: ${response.scopes.join(" ")}`);
	const authorization = Authorization.fromResponseBodyOAuth2Validate(response);
	if (!Authorization.hasScopes(authorization, ...scopes)) return fatal(`Token has wrong scopes!`);
	if (authorization.type !== "user") return fatal(`Token isn't user access token!`);
	console.log(`\ttoken_owner: ${authorization.user_login} (${authorization.user_id})`);
	console.log(`Completed!\n`);

	await unsubscribeFromPreviousEvents(authorization);

	console.log(`Trying to find broadcaster id...`);
	console.log(`\trequested_login: ${broadcaster_login}`);
	time = Date.now();
	const get_users = await Request.GetUsers(authorization, {login: broadcaster_login});
	console.log(`\tresponse (${Date.now() - time}ms elapsed): ${JSON.stringify(get_users)}`);
	if (get_users.status !== 200) return fatal(`User ${broadcaster_login} not found!`);
	const { data: [broadcaster] } = get_users;
	console.log(`\tbroadcaster_id: ${broadcaster.id}\nCompleted!\n`);

	console.log(`Opening WebSocket session...`);
	time = Date.now();
	const connection = EventSub.startWebSocket(authorization);
	console.log(`\turl: ${connection.ws.url}`);
	console.log(`\telapsed: ${Date.now() - time}ms`);
	connection.on("session_welcome", async(message, isReconnected) => {
		console.log(`Received EventSub message ${message.metadata.message_type}\n\tmessage_id: ${message.metadata.message_id}\n\tsession_id: ${message.payload.session.id}\n\tkeepalive_timeout_seconds: ${message.payload.session.keepalive_timeout_seconds}\n`);
		if (!isReconnected) {
			await subscribeToEvents(connection, [
				EventSub.Subscription.ChannelChatMessage(connection, broadcaster.id),
				// put other EventSub.Subscription.<...> here
			]);
			console.log(`Now try to send message !ping in ${broadcaster.display_name} twitch channel`);
		}
		console.log(`Listening for events...\n`);
	});
	connection.on("notification", async(message) => {
		console.log(`Received EventSub message ${message.metadata.message_type} ${message.payload.subscription.type}@v${message.payload.subscription.version}\n\tmessage_id: ${message.metadata.message_id}\n\tevent: ${JSON.stringify(message.payload.event)}`);
		if (EventSub.Message.Notification.isChannelChatMessage(message)) {
			const event = message.payload.event;
			const text = event.message.text;
			console.log(`\tchatter_name: ${event.chatter_user_name}\n\ttext: ${text}`);
			if (text.startsWith("!ping")) {
				let time = Date.now();
				const send_chat_message = await Request.SendChatMessage(connection.authorization, event.broadcaster_user_id, "Pong!", event.message_id);
				console.log(`\tsend_chat_message (${Date.now() - time}ms elapsed): ${JSON.stringify(send_chat_message)}`);
			}
		}
		console.log(``);
	});
	connection.on("session_reconnect", async(message) => {
		console.log(`Received EventSub ${message.metadata.message_type}\n\tmessage_id: ${message.metadata.message_id}\n\treconnect_url: ${message.payload.session.reconnect_url}\n`);
	});
	/*connection.on("session_keepalive", message => {
		console.log(`Received EventSub ${message.metadata.message_type}\n\tmessage_id: ${message.metadata.message_id}\n`);
	});*/
	connection.on("revocation", async(message) => {
		console.log(`Received EventSub ${message.metadata.message_type} ${message.payload.subscription.type}@v${message.payload.subscription.version}\n\tmessage_id: ${message.metadata.message_id}\n`);
		if (message.payload.subscription.status === "user_removed")
			fatal(`Streamer ${broadcaster.display_name} (${broadcaster.id}) was banned!`);
		else if (message.payload.subscription.status === "authorization_revoked")
			fatal(`Access token was deauthorized by their owner - ${authorization.user_login} ${authorization.user_id}`);
		else if (message.payload.subscription.status === "version_removed")
			fatal(`This version or type of subscription is no longer supported by Twitch API`);
	});
	console.log(`Completed!\n`);
}

// printing to console the authorization link, dont forget to comment line main().catch(console.error); below and run "npm run build"!
//console.log(Authorization.URL.Token("zhurxr3saodgqkokd0gmymkdjgyyxe", "http://localhost", scopes));
main().catch(console.error);