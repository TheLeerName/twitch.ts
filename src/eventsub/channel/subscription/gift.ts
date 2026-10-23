import * as Main from "../../..";

/**
 * ## [channel.subscription.gift](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift)
 * Sends a notification when a user gives one or more gifted subscriptions in a channel.

 * ### Authorization
 * Must have `channel:read:subscriptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.subscription.gift";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.subscription.gift", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get subscription gift notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.subscription.gift](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift)
 * Sends a notification when a user gives one or more gifted subscriptions in a channel.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.subscription.gift" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventAnonymous | PayloadEventNotAnonymous;
export interface _PayloadEvent {
	/** The user ID of the user who sent the subscription gift. Set to `null` if it was an anonymous subscription gift. */
	user_id: string | null;
	/** The user login of the user who sent the gift. Set to `null` if it was an anonymous subscription gift. */
	user_login: string | null;
	/** The user display name of the user who sent the gift. Set to `null` if it was an anonymous subscription gift. */
	user_name: string | null;
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** **Integer**. The number of subscriptions in the subscription gift. */
	total: number;
	/** The tier of subscriptions in the subscription gift. Valid values are `1000`, `2000`, and `3000`. */
	tier: "1000" | "2000" | "3000";
	/** **Integer**. The number of subscriptions gifted by this user in the channel. This value is `null` for anonymous gifts or if the gifter has opted out of sharing this information. */
	cumulative_total: number | null;
	/** Whether the subscription gift was anonymous. */
	is_anonymous: boolean;
}

export interface PayloadEventAnonymous extends _PayloadEvent {
	is_anonymous: true;
	user_id: null;
	user_login: null;
	user_name: null;
}
export interface PayloadEventNotAnonymous extends _PayloadEvent {
	is_anonymous: false;
	user_id: string;
	user_login: string;
	user_name: string;
}