import * as Main from "../../..";

/**
 * ## [channel.unban_request.resolve](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve)
 * Sends a notification when an unban request has been resolved.

 * ### Authorization
 * Must have `moderator:read:unban_requests` or `moderator:manage:unban_requests` scope.

 * If you use webhooks, the user in `moderator_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the [Authentication section](https://dev.twitch.tv/docs/authentication/) of Create EventSub Subscription.

 * If you use WebSockets, the ID in `moderator_id` must match the user ID in the user access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.unban_request.resolve";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.unban_request.resolve", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
	moderator_user_id: string;
	/** The ID of the broadcaster you want to get unban request resolution notifications for. Maximum: 1. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.unban_request.resolve](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve)
 * Sends a notification when an unban request has been resolved.

 * ### Authorization
 * Must have `moderator:read:unban_requests` or `moderator:manage:unban_requests` scope.

 * If you use webhooks, the user in `moderator_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the [Authentication section](https://dev.twitch.tv/docs/authentication/) of Create EventSub Subscription.

 * If you use WebSockets, the ID in `moderator_id` must match the user ID in the user access token.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.unban_request.resolve" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventApproved | PayloadEventCanceled | PayloadEventDenied;
export interface _PayloadEvent {
	/** The ID of the unban request. */
	id: string;
	/** The broadcaster’s user ID for the channel the unban request was updated for. */
	broadcaster_user_id: string;
	/** The broadcaster’s login name. */
	broadcaster_user_login: string;
	/** The broadcaster’s display name. */
	broadcaster_user_name: string;
	/** User ID of moderator who approved/denied the request. */
	moderator_id: string | null;
	/** The moderator’s login name */
	moderator_login: string | null;
	/** The moderator’s display name */
	moderator_name: string | null;
	/** User ID of user that requested to be unbanned. */
	user_id: string;
	/** The user’s login name. */
	user_login: string;
	/** The user’s display name. */
	user_name: string;
	/** Resolution text supplied by the mod/broadcaster upon approval/denial of the request. */
	resolution_text: string | null;
	/** Dictates whether the unban request was approved or denied. */
	status: string;
}
export interface PayloadEventApproved extends _PayloadEvent {
	status: "approved";
	moderator_id: string;
	moderator_login: string;
	moderator_name: string;
}
export interface PayloadEventCanceled extends _PayloadEvent {
	status: "canceled";
	moderator_id: null;
	moderator_login: null;
	moderator_name: null;
}
export interface PayloadEventDenied extends _PayloadEvent {
	status: "denied";
	moderator_id: string;
	moderator_login: string;
	moderator_name: string;
}