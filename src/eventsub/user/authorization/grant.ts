import * as Main from "../../..";

/**
 * ## [user.authorization.grant](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant)
 * Sends a notification when a user’s authorization has been granted to your client id.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * ### Authorization
 * Provided `client_id` must match the client id in the application access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "user.authorization.grant";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "user.authorization.grant", version: "1", condition, transport};
}

export interface Condition {
	/** Your application’s client id. The provided `client_id` must match the client id in the application access token. */
	client_id: string;
}

/**
 * ## [user.authorization.grant](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant)
 * Sends a notification when a user’s authorization has been granted to your client id.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "user.authorization.grant" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The client id of the application that was granted user access. */
	client_id: string;
	/** The user id for the user who has granted authorization for your client id. */
	user_id: string;
	/** The user login for the user who has granted authorization for your client id. */
	user_login: string;
	/** The user display name for the user who has granted authorization for your client id. */
	user_name: string;
}