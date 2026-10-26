import * as Main from "../..";

/**
 * ## [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe)
 * Sends a notification when a specified channel receives a subscriber. This does not include resubscribes.

 * ### Authorization
 * Must have `channel:read:subscriptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.subscribe";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.subscribe", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get subscribe notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe)
 * Sends a notification when a specified channel receives a subscriber. This does not include resubscribes.

 * ### Authorization
 * Must have `channel:read:subscriptions` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.subscribe" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The user ID for the user who subscribed to the specified channel. */
	user_id: string;
	/** The user login for the user who subscribed to the specified channel. */
	user_login: string;
	/** The user display name for the user who subscribed to the specified channel. */
	user_name: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** The tier of the subscription. Valid values are `1000`, `2000`, and `3000`. */
	tier: "1000" | "2000" | "3000";
	/** Whether the subscription is a gift. */
	is_gift: boolean;
}