import * as Main from "../../..";

/**
 * ## [channel.charity_campaign.stop](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop)
 * Sends a notification when the broadcaster stops a charity campaign.

 * ### Authorization
 * Requires the `channel:read:charity` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.charity_campaign.stop";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.charity_campaign.stop", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster that you want to receive notifications about when they stop a charity campaign. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.charity_campaign.stop](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop)
 * Sends a notification when the broadcaster stops a charity campaign.

 * ### Authorization
 * Requires the `channel:read:charity` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.charity_campaign.stop" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** An ID that identifies the charity campaign. */
	id: string;
	/** An ID that identifies the broadcaster that ran the campaign. */
	broadcaster_id: string;
	/** The broadcaster’s login name. */
	broadcaster_login: string;
	/** The broadcaster’s display name. */
	broadcaster_name: string;
	/** The charity’s name. */
	charity_name: string;
	/** A description of the charity. */
	charity_description: string;
	/** A URL to an image of the charity’s logo. The image’s type is PNG and its size is 100px X 100px. */
	charity_logo: string;
	/** A URL to the charity’s website. */
	charity_website: string;
	/** An object that contains the final amount of donations that the campaign received. */
	current_amount: {
		/** **Integer**. The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
		value: number;
		/** **Integer**. The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
		decimal_places: number;
		/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
		currency: string;
	};
	/** An object that contains the campaign’s target fundraising goal. */
	target_amount: {
		/** **Integer**. The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
		value: number;
		/** **Integer**. The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
		decimal_places: number;
		/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
		currency: string;
	};
	/** The UTC timestamp (in RFC3339 format) of when the broadcaster stopped the campaign. */
	stopped_at: string;
}