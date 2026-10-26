import * as Main from "../../..";
import { MessageFragment } from "../chat/message";

/**
 * ## [channel.bits.use](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse)
 * Sends a notification whenever Bits are used on a channel.

 * ### Triggers
 * This event is designed to be an all-purpose event for when Bits are used in a channel and might be updated in the future as more Twitch features use Bits.

 * Currently, this event will be sent when a user:
 * 1. Cheers
 * 2. Uses a Power-up - Will not emit when a streamer uses a Power-up for free in their own channel
 * 3. Uses a custom Power-up - Will not emit when a streamer uses a Power-up for free in their own channel

 * Bits transactions via Twitch Extensions are not included in this subscription type.

 * ### Authorization
 * Requires a user access token that includes the `bits:read` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.bits.use";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.bits.use", version: "1", condition, transport};
}

export interface Condition {
	/** The user ID of the channel broadcaster. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.bits.use](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse)
 * Sends a notification whenever Bits are used on a channel.

 * ### Triggers
 * This event is designed to be an all-purpose event for when Bits are used in a channel and might be updated in the future as more Twitch features use Bits.

 * Currently, this event will be sent when a user:
 * 1. Cheers
 * 2. Uses a Power-up - Will not emit when a streamer uses a Power-up for free in their own channel
 * 3. Uses a custom Power-up - Will not emit when a streamer uses a Power-up for free in their own channel

 * Bits transactions via Twitch Extensions are not included in this subscription type.

 * ### Authorization
 * Requires a user access token that includes the `bits:read` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.bits.use" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventCheer | PayloadEventPowerUp | PayloadEventCustomPowerUp;
/** Used only for extending by interfaces. */
export interface _PayloadEvent {
	/** The User ID of the channel where the Bits were redeemed. */
	broadcaster_user_id: string;
	/** The login of the channel where the Bits were used. */
	broadcaster_user_login: string;
	/** The display name of the channel where the Bits were used. */
	broadcaster_user_name: string;
	/** The User ID of the redeeming user. */
	user_id: string;
	/** The login name of the redeeming user. */
	user_login: string;
	/** The display name of the redeeming user. */
	user_name: string;
	/** **Integer**. The number of Bits used. */
	bits: number;
	type: string;
}
export interface PayloadEventCheer extends _PayloadEvent {
	type: "cheer";
	/** An object that contains the user message and emote information needed to recreate the message. */
	message: {
		/** The chat message in plain text. */
		text: string;
		/** The ordered list of chat message fragments. */
		fragments: MessageFragment[];
	};
}

export interface PayloadEventPowerUp extends _PayloadEvent {
	type: "power_up";
	/** Data about a default (i.e. built-in) Power-up. */
	power_up: PayloadEventPowerUpData;
}
export type PayloadEventPowerUpData = PayloadEventPowerUpDataMessageEffect | PayloadEventPowerUpDataCelebration | PayloadEventPowerUpDataGigantifyAnEmote;
/** Used only for extending by interfaces. */
export interface _PayloadEventPowerUpData {
	type: string;
}
export interface PayloadEventPowerUpDataMessageEffect extends _PayloadEventPowerUpData {
	type: "message_effect";
	/** The ID of the message effect. */
	message_effect_id: string;
}
export interface PayloadEventPowerUpDataCelebration extends _PayloadEventPowerUpData {
	type: "celebration";
}
export interface PayloadEventPowerUpDataGigantifyAnEmote extends _PayloadEventPowerUpData {
	type: "gigantify_an_emote";
	/** Emote associated with the reward. */
	emote: {
		/** The ID that uniquely identifies this emote. */
		id: string;
		/** The human readable emote token. */
		name: string;
	};
}

export interface PayloadEventCustomPowerUp extends _PayloadEvent {
	type: "custom_power_up";
	/** Data about a custom Power-up. */
	custom_power_up: {
		/** The title of the custom Power-up. */
		title: string;
		/** The ID of the custom Power-up. */
		reward_id: string;
	};
}