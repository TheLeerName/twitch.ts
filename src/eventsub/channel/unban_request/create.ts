import * as Main from "../../..";

/**
 * ## [channel.unban_request.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate)
 * Sends a notification when a user creates an unban request.

 * ### Authorization
 * Must have `moderator:read:unban_requests` or `moderator:manage:unban_requests` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.unban_request.create";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.unban_request.create", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
	moderator_user_id: string;
	/** The ID of the broadcaster you want to get chat unban request notifications for. Maximum: 1. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.unban_request.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate)
 * Sends a notification when a user creates an unban request.

 * ### Authorization
 * Must have `moderator:read:unban_requests` or `moderator:manage:unban_requests` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.unban_request.create" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the unban request. */
	id: string;
	/** The broadcaster’s user ID for the channel the unban request was created for. */
	broadcaster_user_id: string;
	/** The broadcaster’s login name. */
	broadcaster_user_login: string;
	/** The broadcaster’s display name. */
	broadcaster_user_name: string;
	/** User ID of user that is requesting to be unbanned. */
	user_id: string;
	/** The user’s login name. */
	user_login: string;
	/** The user’s display name. */
	user_name: string;
	/** Message sent in the unban request. */
	text: string;
	/** The UTC timestamp (in RFC3339 format) of when the unban request was created. */
	created_at: string;
}