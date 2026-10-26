import * as Main from "../../..";

/**
 * ## [channel.channel_points_custom_reward_redemption.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd)
 * Sends a notification when a viewer has redeemed a custom channel points reward on the specified channel.

 * ### Authorization
 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.channel_points_custom_reward_redemption.add";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to receive channel points custom reward redemption add notifications for. */
	broadcaster_user_id: string;
	/** Optional. Specify a reward id to only receive notifications for a specific reward. */
	reward_id?: string;
}

/**
 * ## [channel.channel_points_custom_reward_redemption.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd)
 * Sends a notification when a viewer has redeemed a custom channel points reward on the specified channel.

 * ### Authorization
 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.add" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The redemption identifier. */
	id: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** User ID of the user that redeemed the reward. */
	user_id: string;
	/** Login of the user that redeemed the reward. */
	user_login: string;
	/** Display name of the user that redeemed the reward. */
	user_name: string;
	/** The user input provided. Empty string if not provided. */
	user_input: string;
	/** Defaults to `unfulfilled`. Possible values are `unknown`, `unfulfilled`, `fulfilled`, and `canceled`. */
	status: "unknown" | "unfulfilled" | "fulfilled" | "canceled";
	/** RFC3339 timestamp of when the reward was redeemed. */
	redeemed_at: string;
	/** Basic information about the reward that was redeemed, at the time it was redeemed. */
	reward: Reward;
}

export interface Reward {
	/** The reward identifier. */
	id: string;
	/** The reward name. */
	title: string;
	/** **Integer**. The reward cost. */
	cost: number;
	/** The reward description. */
	prompt: string;
}