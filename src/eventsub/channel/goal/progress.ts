import * as Main from "../../..";

/**
 * ## [channel.goal.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress)
 * Notifies the subscriber when progress is made towards the specified broadcaster’s goal. Progress could be positive (added followers) or negative (lost followers).

 * **NOTE**: It’s possible to receive these events before receiving the {@link Main.EventSub.ChannelGoalBegin | Begin} event.

 * ### Authorization
 * Requires a user OAuth access token with scope set to `channel:read:goals`.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.goal.progress";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.goal.progress", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster to get notified about. The ID must match the `user_id` in the OAuth access token. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.goal.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress)
 * Notifies the subscriber when progress is made towards the specified broadcaster’s goal. Progress could be positive (added followers) or negative (lost followers).

 * **NOTE**: It’s possible to receive these events before receiving the {@link Main.EventSub.ChannelGoalBegin | Begin} event.

 * ### Authorization
 * Requires a user OAuth access token with scope set to `channel:read:goals`.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.goal.progress" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** An ID that identifies this event. */
	id: string;
	/** An ID that uniquely identifies the broadcaster. */
	broadcaster_user_id: string;
	/** The broadcaster’s display name. */
	broadcaster_user_name: string;
	/** The broadcaster’s user handle. */
	broadcaster_user_login: string;
	/** 
	 * The type of goal. Possible values are:
	 * Value|Meaning
	 * -|-
	 * `follow`|The goal is to increase followers.
	 * `subscription`|The goal is to increase subscriptions. This type shows the net increase or decrease in tier points associated with the subscriptions.
	 * `subscription_count`|The goal is to increase subscriptions. This type shows the net increase or decrease in the number of subscriptions.
	 * `new_subscription`|The goal is to increase subscriptions. This type shows only the net increase in tier points associated with the subscriptions (it does not account for users that unsubscribed since the goal started).
	 * `new_subscription_count`|The goal is to increase subscriptions. This type shows only the net increase in the number of subscriptions (it does not account for users that unsubscribed since the goal started).
	 * `new_bit`|The goal is to increase the amount of Bits used on the channel.
	 * `new_cheerer`|The goal is to increase the number of unique Cheerers to Cheer on the channel.
	 */
	type: string;
	/** A description of the goal, if specified. The description may contain a maximum of 40 characters. */
	description: string;
	/** 
	 * **Integer**. The goal’s current value.

	 * The goal’s type determines how this value is increased or decreased.
	 * Value of `type`|Description
	 * -|-
	 * `follow`|Set to the broadcaster's current number of followers. This number increases with new followers and decreases when users unfollow the broadcaster.
	 * `subscription`|This field is increased and decreased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased or decreased by 2, not 1.
	 * `subscription_count`|This field is increased by 1 for each new subscription and decreased by 1 for each user that unsubscribes.
	 * `new_subscription`|This field is increased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased by 2, not 1.
	 * `new_subscription_count`|This field is increased by 1 for each new subscription.
	 */
	current_amount: number;
	/** **Integer**. The goal’s target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
	target_amount: number;
	/** The UTC timestamp in RFC 3339 format, which indicates when the broadcaster created the goal. */
	started_at: string;
}