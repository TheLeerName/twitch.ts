import * as Main from "../../..";

/**
 * ## [channel.custom_power_up_redemption.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcustom_power_up_redemptionadd)
 * Sends a notification when a viewer has redeemed a custom Power-up on the specified channel.

 * ### Authorization
 * Must have `bits:read` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.custom_power_up_redemption.add";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.custom_power_up_redemption.add", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to receive custom Power-up redemption add notifications for. */
	broadcaster_user_id: string;
	/** Optional. Specify a reward id to only receive notifications for a specific custom Power-up. */
	reward_id?: string;
}

/**
 * ## [channel.custom_power_up_redemption.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcustom_power_up_redemptionadd)
 * Sends a notification when a viewer has redeemed a custom Power-up on the specified channel.

 * ### Authorization
 * Must have `bits:read` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.custom_power_up_redemption.add" && message.metadata.subscription_version === "1";
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
	/** User ID of the user that redeemed the custom Power-up. */
	user_id: string;
	/** Login of the user that redeemed the custom Power-up. */
	user_login: string;
	/** Display name of the user that redeemed the custom Power-up. */
	user_name: string;
	/** The user input provided. Empty string if not provided. */
	user_input: string;
	/** Defaults to `unfulfilled`. Possible values are `unknown`, `unfulfilled`, `fulfilled`, and `canceled`. */
	status: "unknown" | "unfulfilled" | "fulfilled" | "canceled";
	/** Basic information about the custom Power-up that was redeemed, at the time it was redeemed. */
	custom_power_up: CustomPowerUp;
	/** RFC3339 timestamp of when the custom Power-up was redeemed. */
	redeemed_at: string;
}

export interface CustomPowerUp {
	/** The unique ID for this Custom Power-up. */
	id: string;
	/** The user-viewable name of this Custom Power-up. */
	title: string;
	/** **Integer**. The cost of the Custom Power-up to redeem. */
	bits: number;
	/** The creator-provided description for this Power-up. */
	prompt: string;
}