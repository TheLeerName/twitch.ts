import * as Main from "../../..";

/**
 * ## [user.authorization.revoke](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke)
 * Sends a notification when a user’s authorization has been revoked for your client id. Use this webhook to meet government requirements for handling user data, such as GDPR, LGPD, or CCPA.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * ### Authorization
 * Provided `client_id` must match the client id in the application access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "user.authorization.revoke";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "user.authorization.revoke", version: "1", condition, transport};
}

export interface Condition {
	/** Your application’s client id. The provided client_id must match the client id in the application access token. */
	client_id: string;
}

/**
 * ## [user.authorization.revoke](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke)
 * Sends a notification when a user’s authorization has been revoked for your client id. Use this webhook to meet government requirements for handling user data, such as GDPR, LGPD, or CCPA.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * ### Authorization
 * Provided `client_id` must match the client id in the application access token.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "user.authorization.revoke" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventUserExists | PayloadEventUserNotExists;
export interface _PayloadEvent {
	/** The client_id of the application with revoked user access. */
	client_id: string;
	/** The user id for the user who has revoked authorization for your client id. */
	user_id: string;
	/** The user login for the user who has revoked authorization for your client id. This is `null` if the user no longer exists. */
	user_login: string | null;
	/** The user display name for the user who has revoked authorization for your client id. This is `null` if the user no longer exists. */
	user_name: string | null;
}

export interface PayloadEventUserNotExists extends _PayloadEvent {
	user_login: string;
	user_name: string;
}

export interface PayloadEventUserExists extends _PayloadEvent {
	user_login: null;
	user_name: null;
}