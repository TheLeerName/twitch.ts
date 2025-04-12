import fs from 'fs';
import { Request, EventSub } from './index';

const data_save_file = "previous_subscriptions_id.json";
const data: {subscriptions_id: string[] } = fs.existsSync(data_save_file) ? JSON.parse(fs.readFileSync(data_save_file).toString()) : {subscriptions_id: []};
function saveData() {
	fs.writeFileSync(data_save_file, JSON.stringify(data));
}

function criticalError(message?: any, ...optionalParams: any[]) {
	console.error(message, optionalParams);
	return process.exit(1);
}

async function subscribeToEvents(connection: EventSub.Connection, events: EventSub.Subscription[]) {
	const prev_subscriptions_id_length = data.subscriptions_id.length;

	for (const event of events) {
		const create_subscription = await Request.CreateEventSubSubscription(connection.authorization, event);
		if (create_subscription.status === 202) {
			console.log(`Subscribed to ${event.type} event\n\tresponse: ${create_subscription}\n`);
			data.subscriptions_id.push(create_subscription.data.id);
		} else criticalError(`Failed to subscribe to ${event.type} event\n\tresponse: ${create_subscription}\n`);
	}

	if (data.subscriptions_id.length !== prev_subscriptions_id_length) saveData();
}

async function main() {
	try {
		const authorization = await Request.OAuth2Validate(process.argv[2]);
		if (authorization.status !== 200) throw `Token isn't valid\n\tresponse: ${authorization}\n`;
		if (authorization.type !== "user") throw `Token isn't user access token\n\tresponse: ${authorization}\n`;
		console.log(`Token is valid\n\tresponse: ${authorization}\n`);

		const broadcaster_login = process.argv[3];
		const get_users = await Request.GetUsers(authorization, {login: broadcaster_login});
		if (get_users.status !== 200) throw `User ${broadcaster_login} not found!`;
		const { data: [broadcaster] } = get_users;
		console.log(`Found ${broadcaster.display_name} channel\n\tresponse: ${broadcaster}\n\tbroadcaster_id: ${broadcaster.id}\n`);

		if (data.subscriptions_id.length > 0) {
			console.log(`Deleting previous subscriptions...`);
			for (const id of data.subscriptions_id) {
				const delete_sub = await Request.DeleteEventSubSubscription(authorization, id);
				console.log(`\t${id}: ${delete_sub}`);
			}
			data.subscriptions_id = [];
			console.log(`Completed!\n`);
		}

		const connection = EventSub.startWebSocket(authorization);
		console.log(`Opened WebSocket session\n\turl: ${connection.ws.url}\n`);
		connection.onSessionWelcome = async(message, is_reconnected) => {
			console.log(`Received ${message.metadata.message_type} message\n\tsession: ${message.payload.session}\n`);
			if (!is_reconnected) subscribeToEvents(connection, [
				EventSub.Subscription.ChannelChatMessage(connection.session.id, broadcaster.id, connection.authorization.user_id),
				// put other EventSub.Subscription.<...> here
			]);
		}
		connection.onNotification = async(message) => {
			console.log(`Received ${message.metadata.message_type}#${message.payload.subscription.type} message\n\tpayload: ${message.payload}`);
			if (EventSub.Message.Notification.isChannelChatMessage(message)) {
				const event = message.payload.event;
				const text = event.message.text;
				console.log(`\tchatter_name: ${event.chatter_user_name}\n\ttext: ${text}`);
				if (text.startsWith("!ping")) {
					const send_chat_message = await Request.SendChatMessage(connection.authorization, event.broadcaster_user_id, "Pong!", event.message_id);
					console.log(`\tsend_chat_message: ${send_chat_message}`);
				}
			}
			console.log(``);
		}
	} catch(e) {
		console.error(e);
	}
}
main().catch(console.error);