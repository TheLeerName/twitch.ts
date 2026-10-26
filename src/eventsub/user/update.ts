import * as Main from "../..";

/**
 * ## [user.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate)
 * Sends a notification when user updates their account.

 * ### Authorization
 * No authorization required. If you have the `user:read:email` scope, the notification will include `email` field.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "user.update";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "user.update", version: "1", condition, transport};
}

export interface Condition {
	/** The user ID for the user you want update notifications for. */
	user_id: string;
}

/**
 * ## [user.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate)
 * Sends a notification when user updates their account.

 * ### Authorization
 * No authorization required. If you have the `user:read:email` scope, the notification will include `email` field.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "user.update" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The user’s user id. */
	user_id: string;
	/** The user’s user login. */
	user_login: string;
	/** The user’s user display name. */
	user_name: string;
	/** The user’s email address. The event includes the user’s email address only if the app used to request this event type includes the `user:read:email` scope for the user; otherwise, the field is set to an empty string. */
	email: string;
	/** 
	 * A Boolean value that determines whether Twitch has verified the user’s email address. Is `true` if Twitch has verified the email address; otherwise, `false`.

	 * **NOTE**: Ignore this field if the `email` field contains an empty string.
	 */
	email_verified: boolean;
	/** The user’s description. */
	description: string;
}