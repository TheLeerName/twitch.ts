import * as Main from "../../..";

/**
 * ## [channel.shield_mode.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend)
 * Sends a notification when the broadcaster deactivates Shield Mode.

 * This event informs the subscriber that the broadcaster’s moderation settings were changed back to the broadcaster’s previous moderation settings.

 * ### Authorization
 * Requires the `moderator:read:shield_mode` or `moderator:manage:shield_mode` scope.

 * If you use [webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type.

 * If you use [WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the ID in `moderator_user_id` must match the user ID in the user access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.shield_mode.end";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.shield_mode.end", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster that you want to receive notifications about when they deactivate Shield Mode. */
	broadcaster_user_id: string;
	/** The ID of the broadcaster or one of the broadcaster’s moderators. */
	moderator_user_id: string;
}

/**
 * ## [channel.shield_mode.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend)
 * Sends a notification when the broadcaster deactivates Shield Mode.

 * This event informs the subscriber that the broadcaster’s moderation settings were changed back to the broadcaster’s previous moderation settings.

 * ### Authorization
 * Requires the `moderator:read:shield_mode` or `moderator:manage:shield_mode` scope.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.shield_mode.end" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** An ID that identifies the broadcaster whose Shield Mode status was updated. */
	broadcaster_user_id: string;
	/** The broadcaster’s login name. */
	broadcaster_user_login: string;
	/** The broadcaster’s display name. */
	broadcaster_user_name: string;
	/** An ID that identifies the moderator that updated the Shield Mode’s status. If the broadcaster updated the status, this ID will be the same as `broadcaster_user_id`. */
	moderator_user_id: string;
	/** The moderator’s login name. */
	moderator_user_login: string;
	/** The moderator’s display name. */
	moderator_user_name: string;
	/** The UTC timestamp (in RFC3339 format) of when the moderator deactivated Shield Mode. */
	ended_at: string;
}