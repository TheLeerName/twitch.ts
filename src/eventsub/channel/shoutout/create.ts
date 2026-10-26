import * as Main from "../../..";

/**
 * ## [channel.shoutout.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate)
 * Sends a notification when the specified broadcaster sends a Shoutout.

 * ### Authorization
 * Requires the `moderator:read:shoutouts` or `moderator:manage:shoutouts` scope.

 * If you use [webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type.

 * If you use [WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the ID in `moderator_user_id` must match the user ID in the user access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.shoutout.create";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.shoutout.create", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster that you want to receive notifications about when they send a Shoutout. */
	broadcaster_user_id: string;
	/** The ID of the broadcaster that gave the Shoutout or one of the broadcaster’s moderators. */
	moderator_user_id: string;
}

/**
 * ## [channel.shoutout.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate)
 * Sends a notification when the specified broadcaster sends a Shoutout.

 * ### Authorization
 * Requires the `moderator:read:shoutouts` or `moderator:manage:shoutouts` scope.

 * If you use [webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type.

 * If you use [WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the ID in `moderator_user_id` must match the user ID in the user access token.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.shoutout.create" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** An ID that identifies the broadcaster that sent the Shoutout. */
	broadcaster_user_id: string;
	/** The broadcaster’s login name. */
	broadcaster_user_login: string;
	/** The broadcaster’s display name. */
	broadcaster_user_name: string;
	/** An ID that identifies the broadcaster that received the Shoutout. */
	to_broadcaster_user_id: string;
	/** The broadcaster’s login name. */
	to_broadcaster_user_login: string;
	/** The broadcaster’s display name. */
	to_broadcaster_user_name: string;
	/** An ID that identifies the moderator that sent the Shoutout. If the broadcaster sent the Shoutout, this ID is the same as the ID in `broadcaster_user_id`. */
	moderator_user_id: string;
	/** The moderator’s login name. */
	moderator_user_login: string;
	/** The moderator’s display name. */
	moderator_user_name: string;
	/** **Integer**. The number of users that were watching the broadcaster’s stream at the time of the Shoutout. */
	viewer_count: number;
	/** The UTC timestamp (in RFC3339 format) of when the moderator sent the Shoutout. */
	started_at: string;
	/** The UTC timestamp (in RFC3339 format) of when the broadcaster may send a Shoutout to a different broadcaster. */
	cooldown_ends_at: string;
	/** The UTC timestamp (in RFC3339 format) of when the broadcaster may send another Shoutout to the broadcaster in `to_broadcaster_user_id`. */
	target_cooldown_ends_at: string;
}