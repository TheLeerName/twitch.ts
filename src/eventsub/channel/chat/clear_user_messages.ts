import * as Main from "../../..";

/**
 * ## [channel.chat.clear_user_messages](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages)
 * Sends a notification when a moderator or bot clears all messages for a specific user.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.chat.clear_user_messages";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.chat.clear_user_messages", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the channel to receive chat clear user messages events for. */
	broadcaster_user_id: string;
	/** The user ID to read chat as. */
	user_id: string;
}

/**
 * ## [channel.chat.clear_user_messages](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages)
 * Sends a notification when a moderator or bot clears all messages for a specific user.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.chat.clear_user_messages" && message.metadata.subscription_version === "1";
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
	/** The ID of the user that was banned or put in a timeout. All of their messages are deleted. */
	target_user_id: string;
	/** The user name of the user that was banned or put in a timeout. */
	target_user_name: string;
	/** The user login of the user that was banned or put in a timeout. */
	target_user_login: string;
}