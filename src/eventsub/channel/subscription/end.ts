import * as Main from "../../..";

/**
 * ## [channel.subscription.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend)
 * Sends a notification when a subscription to the specified channel expires.

 * ### Authorization
 * Must have `channel:read:subscriptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.subscription.end";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.subscription.end", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get subscription end notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.subscription.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend)
 * Sends a notification when a subscription to the specified channel expires.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.subscription.end" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The user ID for the user whose subscription ended. */
	user_id: string;
	/** The user login for the user whose subscription ended. */
	user_login: string;
	/** The user display name for the user whose subscription ended. */
	user_name: string;
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** The tier of the subscription that ended. Valid values are `1000`, `2000`, and `3000`. */
	tier: "1000" | "2000" | "3000";
	/** Whether the subscription was a gift. */
	is_gift: boolean;
}