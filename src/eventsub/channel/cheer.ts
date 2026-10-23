import * as Main from "../..";

/**
 * ## [channel.cheer](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer)
 * Sends a notification when a user cheers on the specified channel.

 * ### Authorization
 * Must have `bits:read` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.cheer";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.cheer", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get cheer notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.cheer](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer)
 * Sends a notification when a user cheers on the specified channel.

 * ### Authorization
 * Must have `bits:read` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.cheer" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventAnonymous | PayloadEventNotAnonymous;
export interface _PayloadEvent {
	/** Whether the user cheered anonymously or not. */
	is_anonymous: boolean;
	/** The user ID for the user who cheered on the specified channel. This is `null` if `is_anonymous` is `true`. */
	user_id: string | null;
	/** The user login for the user who cheered on the specified channel. This is `null` if `is_anonymous` is `true`. */
	user_login: string | null;
	/** The user display name for the user who cheered on the specified channel. This is `null` if is_anonymous` is `true`. */
	user_name: string | null;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** The message sent with the cheer. */
	message: string;
	/** **Integer**. The number of Bits cheered. */
	bits: number;
}

export interface PayloadEventAnonymous extends _PayloadEvent {
	is_anonymous: true;
	user_id: null;
	user_login: null;
	user_name: null;
}
export interface PayloadEventNotAnonymous extends _PayloadEvent {
	is_anonymous: false;
	user_id: string;
	user_login: string;
	user_name: string;
}