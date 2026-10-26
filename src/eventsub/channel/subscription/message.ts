import * as Main from "../../..";

/**
 * ## [channel.subscription.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage)
 * Sends a notification when a user sends a resubscription chat message in a specific channel.

 * ### Authorization
 * Must have `channel:read:subscriptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.subscription.message";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.subscription.message", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get resubscription chat message notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.subscription.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage)
 * Sends a notification when a user sends a resubscription chat message in a specific channel.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.subscription.message" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The user ID of the user who sent a resubscription chat message. */
	user_id: string;
	/** The user login of the user who sent a resubscription chat message. */
	user_login: string;
	/** The user display name of the user who a resubscription chat message. */
	user_name: string;
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** The tier of the user’s subscription. */
	tier: string;
	/** An object that contains the resubscription message and emote information needed to recreate the message. */
	message: {
		/** The text of the resubscription chat message. */
		text: string;
		/** An array that includes the emote ID and start and end positions for where the emote appears in the text. */
		emotes: Emote[];
	};
	/** **Integer**. The total number of months the user has been subscribed to the channel. */
	cumulative_months: number;
	/** **Integer**. The number of consecutive months the user’s current subscription has been active. This value is `null` if the user has opted out of sharing this information. */
	streak_months: number | null;
	/** **Integer**. The month duration of the subscription. */
	duration_months: number;
}

export interface Emote {
	/** **Integer**. The index of where the Emote starts in the text. */
	begin: number;
	/** **Integer**. The index of where the Emote ends in the text. */
	end: number;
	/** The emote ID. */
	id: string;
}