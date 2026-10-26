import * as Main from "../../..";

/**
 * ## [channel.warning.acknowledge](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge)
 * Sends a notification when a warning is acknowledged by a user. Broadcasters and moderators can see the warning’s details.

 * ### Authorization
 * Must have the `moderator:read:warnings` or `moderator:manage:warnings` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.warning.acknowledge";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.warning.acknowledge", version: "1", condition, transport};
}

export interface Condition {
	/** The User ID of the broadcaster. */
	broadcaster_user_id: string;
	/** The User ID of the moderator. */
	moderator_user_id: string;
}

/**
 * ## [channel.warning.acknowledge](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge)
 * Sends a notification when a warning is acknowledged by a user. Broadcasters and moderators can see the warning’s details.

 * ### Authorization
 * Must have `channel:read:vips` or `channel:manage:vips` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.warning.acknowledge" && message.metadata.subscription_version === "1";
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
	/** The ID of the user that has acknowledged their warning. */
	user_id: string;
	/** The login of the user that has acknowledged their warning. */
	user_login: string;
	/** The user name of the user that has acknowledged their warning. */
	user_name: string;
}