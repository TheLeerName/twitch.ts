import * as Main from "../..";

/**
 * ## [channel.unban](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban)
 * Sends a notification when a viewer is unbanned from the specified channel.

 * ### Authorization
 * Must have `channel:moderate` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.unban";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.unban", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get unban notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.unban](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban)
 * Sends a notification when a viewer is unbanned from the specified channel.

 * ### Authorization
 * Must have `channel:moderate` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.unban" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The user id for the user who was unbanned on the specified channel. */
	user_id: string;
	/** The user login for the user who was unbanned on the specified channel. */
	user_login: string;
	/** The user display name for the user who was unbanned on the specified channel. */
	user_name: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** The user ID of the issuer of the unban. */
	moderator_user_id: string;
	/** The user login of the issuer of the unban. */
	moderator_user_login: string;
	/** The user name of the issuer of the unban. */
	moderator_user_name: string;
}