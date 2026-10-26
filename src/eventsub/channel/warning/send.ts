import * as Main from "../../..";

/**
 * ## [channel.warning.send](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend)
 * Sends a notification when a warning is sent to a user. Broadcasters and moderators can see the warning’s details.

 * ### Authorization
 * Must have the `moderator:read:warnings` or `moderator:manage:warnings` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.warning.send";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.warning.send", version: "1", condition, transport};
}

export interface Condition {
	/** The User ID of the broadcaster. */
	broadcaster_user_id: string;
	/** The User ID of the moderator. */
	moderator_user_id: string;
}

/**
 * ## [channel.warning.send](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend)
 * Sends a notification when a warning is sent to a user. Broadcasters and moderators can see the warning’s details.

 * ### Authorization
 * Must have the `moderator:read:warnings` or `moderator:manage:warnings` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.warning.send" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The user ID of the broadcaster. */
	broadcaster_user_id: string;
	/** The login of the broadcaster. */
	broadcaster_user_login: string;
	/** The user name of the broadcaster. */
	broadcaster_user_name: string;
	/** The user ID of the moderator who sent the warning. */
	moderator_user_id: string;
	/** The login of the moderator. */
	moderator_user_login: string;
	/** The user name of the moderator. */
	moderator_user_name: string;
	/** The ID of the user being warned. */
	user_id: string;
	/** The login of the user being warned. */
	user_login: string;
	/** The user name of the user being. */
	user_name: string;
	/** Optional. The reason given for the warning. */
	reason: string | null;
	/** Optional. The chat rules cited for the warning. */
	chat_rules_cited: string[] | null;
}