import fs from 'fs';
import { Request, EventSub, Authorization } from './index';

const scopes = [
	"user:read:chat",
	"user:write:chat",
] as const satisfies Authorization.Scope[];

const data_save_file = "data.json";
const data: {subscriptions_id: string[] } = fs.existsSync(data_save_file) ? JSON.parse(fs.readFileSync(data_save_file).toString()) : {subscriptions_id: []};
function saveData() {
	fs.writeFileSync(data_save_file, JSON.stringify(data));
}

function criticalError(message?: any, ...optionalParams: any[]) {
	console.error(message, optionalParams);
	return process.exit(1);
}

async function subscribeToEvents(connection: EventSub.Connection, events: EventSub.Subscription[]) {
	const result = {total: 0, max_total_cost: 0, total_cost: 0};

	console.log(`Subscribing to events...`);
	for (const event of events) {
		const create_subscription = await Request.CreateEventSubSubscription(connection.authorization, event);
		if (create_subscription.status === 202) {
			console.log(`\t${event.type}: ${JSON.stringify(create_subscription.data)}`);

			result.total++;
			result.max_total_cost = create_subscription.max_total_cost;
			result.total_cost = create_subscription.total_cost;
			data.subscriptions_id.push(create_subscription.data.id);
		} else criticalError(`\nFailed to subscribe to ${event.type} event\n\tresponse: ${JSON.stringify(create_subscription)}\n`);
	}
	saveData();
	console.log(`\tresult: ${JSON.stringify(result)}\nCompleted!\n`);
}

async function main() {
	try {
		// printing to console the authorization link
		//console.log(Authorization.authorizeURL("<specify_here_your_client_id>", "<specify_here_your_redirect_uri>", scopes));

		const token: string | undefined = process.argv[2];
		if (!token) throw `You must specify Twitch Access Token in third argument!\n`;

		const broadcaster_login: string | undefined = process.argv[3];
		if (!broadcaster_login) throw `You must specify broadcaster login in fourth argument!\n`;

		console.log(`Validating token...`);
		console.log(`\ttoken: ${token}`);
		const response = await Request.OAuth2Validate(token);
		console.log(`\tresponse: ${JSON.stringify(response)}`);
		if (!response.ok) throw `Token isn't valid!\n`;
		const authorization = Authorization.fromResponseBodyOAuth2Validate(response);
		if (!Authorization.hasScopes(authorization, ...scopes)) throw `Token has wrong scopes!\n`;
		if (authorization.type !== "user") throw `Token isn't user access token!\n`;
		console.log(`Completed!\n`);

		if (data.subscriptions_id.length > 0) {
			console.log(`Deleting previous subscriptions...`);
			for (const id of data.subscriptions_id) {
				const delete_sub = await Request.DeleteEventSubSubscription(authorization, id);
				console.log(`\t${id}: ${JSON.stringify(delete_sub)}`);
			}
			data.subscriptions_id = [];
			console.log(`Completed!\n`);
		}

		console.log(`Trying to find broadcaster id...`);
		console.log(`\trequested_login: ${broadcaster_login}`);
		const get_users = await Request.GetUsers(authorization, {login: broadcaster_login});
		console.log(`\tresponse: ${JSON.stringify(get_users)}`);
		if (get_users.status !== 200) throw `User ${broadcaster_login} not found!\n`;
		const { data: [broadcaster] } = get_users;
		console.log(`\tbroadcaster_id: ${broadcaster.id}\nCompleted!\n`);

		console.log(`Opening WebSocket session...`);
		const connection = EventSub.startWebSocket(authorization);
		console.log(`\turl: ${connection.ws.url}`);
		connection.onSessionWelcome = async(message, is_reconnected) => {
			console.log(`Received ${message.metadata.message_type} message\n\tsession: ${JSON.stringify(message.payload.session)}\n`);
			if (!is_reconnected) await subscribeToEvents(connection, [
				EventSub.Subscription.ChannelChatMessage(connection, broadcaster.id),
				// put other EventSub.Subscription.<...> here
			]);
			console.log(`Now try to send message !ping in ${broadcaster.display_name} twitch channel`);
			console.log(`Listening for events...\n`);
		}
		connection.onNotification = async(message) => {
			console.log(`Received ${message.metadata.message_type} message with ${message.payload.subscription.type} event\n\tevent: ${JSON.stringify(message.payload.event)}`);
			if (EventSub.Message.Notification.isChannelChatMessage(message)) {
				const event = message.payload.event;
				const text = event.message.text;
				console.log(`\tchatter_name: ${event.chatter_user_name}\n\ttext: ${text}`);
				if (text.startsWith("!ping")) {
					const send_chat_message = await Request.SendChatMessage(connection.authorization, event.broadcaster_user_id, "Pong!", event.message_id);
					console.log(`\tsend_chat_message: ${JSON.stringify(send_chat_message)}`);
				}
			}
			console.log(``);
		}
		console.log(`Completed!\n`);
	} catch(e) {
		console.error(e);
	}
}
main().catch(console.error);