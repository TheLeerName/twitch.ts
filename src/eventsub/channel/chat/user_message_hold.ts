import * as Main from "../../..";
import { MessageFragment } from "./message";

/**
 * ## [channel.chat.user_message_hold](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold)
 * Notifies a user if their message is caught by automod.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.chat.user_message_hold";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.chat.user_message_hold", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the channel to receive chat message events for. */
	broadcaster_user_id: string;
	/** The user ID to read chat as. */
	user_id: string;
}

/**
 * ## [channel.chat.user_message_hold](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold)
 * Notifies a user if their message is caught by automod.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.chat.user_message_hold" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the broadcaster specified in the request. */
	broadcaster_user_id: string;
	/** The login of the broadcaster specified in the request. */
	broadcaster_user_login: string;
	/** The user name of the broadcaster specified in the request. */
	broadcaster_user_name: string;
	/** The User ID of the message sender. */
	user_id: string;
	/** The message sender’s login. */
	user_login: string;
	/** The message sender’s display name. */
	user_name: string;
	/** The ID of the message that was flagged by automod. */
	message_id: string;
	/** The body of the message. */
	message: {
		/** The contents of the message caught by automod. */
		text: string;
		/** Ordered list of chat message fragments. */
		fragments: MessageFragment[];
	};
}