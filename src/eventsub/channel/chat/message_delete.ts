import * as Main from "../../..";

/**
 * ## [channel.chat.message_delete](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete)
 * Sends a notification when a moderator removes a specific message.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.chat.message_delete";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.chat.message_delete", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the channel to receive chat message delete events for. */
	broadcaster_user_id: string;
	/** The user ID to read chat as. */
	user_id: string;
}

/**
 * ## [channel.chat.message_delete](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete)
 * Sends a notification when a moderator removes a specific message.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.chat.message_delete" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** The ID of the user whose message was deleted. */
	target_user_id: string;
	/** The user name of the user whose message was deleted. */
	target_user_name: string;
	/** The user login of the user whose message was deleted. */
	target_user_login: string;
	/** A UUID that identifies the message that was removed. */
	message_id: string;
}