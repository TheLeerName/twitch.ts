import * as Main from "../..";

/**
 * ## [channel.follow](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow)
 * Sends a notification when a specified channel receives a follow.

 * ### Authorization
 * Must have `moderator:read:followers` scope.
 */
export interface RequestBody extends Main.EventSub.RequestBody.Subscription {
	type: "channel.follow";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.follow", version: "2", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get follow notifications for. */
	broadcaster_user_id: string;
	/** The ID of the moderator of the channel you want to get follow notifications for. If you have authorization from the broadcaster rather than a moderator, specify the broadcaster’s user ID here. */
	moderator_user_id: string;
}

/**
 * ## [channel.follow](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow)
 * Sends a notification when a specified channel receives a follow.

 * ### Authorization
 * Must have `moderator:read:followers` scope.
 */
export interface ResponseBody {
	subscription: ResponseBodySubscription;
	event: ResponseBodyEvent;
}
export function isResponseBody(obj: unknown): obj is ResponseBody {
	// @ts-ignore
	return obj != null && obj.subscription != null && obj.subscription.type === "channel.follow" && obj.subscription.version === "2";
}
export type ResponseBodySubscription = Main.EventSub.ResponseBody.Subscription<RequestBody>;
export interface ResponseBodyEvent {
	/** The user ID for the user now following the specified channel. */
	user_id: string;
	/** The user login for the user now following the specified channel. */
	user_login: string;
	/** The user display name for the user now following the specified channel. */
	user_name: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** RFC3339 timestamp of when the follow occurred. */
	followed_at: string;
}