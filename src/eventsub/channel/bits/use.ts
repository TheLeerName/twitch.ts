import * as Main from "../../..";
import { MessageFragmentText, MessageFragmentCheermote, MessageFragmentEmote } from "../chat/message";

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
export interface RequestBody extends Main.EventSub.RequestBody.Subscription {
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
export interface ResponseBody {
	subscription: ResponseBodySubscription;
	event: ResponseBodyEvent;
}
export type ResponseBodySubscription = Main.EventSub.ResponseBody.Subscription<RequestBody>;
export type ResponseBodyEvent = ResponseBodyEventCheer | ResponseBodyEventPowerUp | ResponseBodyEventCustomPowerUp;
/** Used only for extending by interfaces. */
export interface _ResponseBodyEvent {
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
export interface ResponseBodyEventCheer extends _ResponseBodyEvent {
	type: "cheer";
	/** An object that contains the user message and emote information needed to recreate the message. */
	message: {
		/** The chat message in plain text. */
		text: string;
		/** The ordered list of chat message fragments. */
		fragments: (MessageFragmentText | MessageFragmentCheermote | MessageFragmentEmote)[];
	};
}

export interface ResponseBodyEventPowerUp extends _ResponseBodyEvent {
	type: "power_up";
	/** Data about a default (i.e. built-in) Power-up. */
	power_up: ResponseBodyEventPowerUpData;
}
export type ResponseBodyEventPowerUpData = ResponseBodyEventPowerUpDataMessageEffect | ResponseBodyEventPowerUpDataCelebration | ResponseBodyEventPowerUpDataGigantifyAnEmote;
/** Used only for extending by interfaces. */
export interface _ResponseBodyEventPowerUpData {
	type: string;
}
export interface ResponseBodyEventPowerUpDataMessageEffect extends _ResponseBodyEventPowerUpData {
	type: "message_effect";
	/** The ID of the message effect. */
	message_effect_id: string;
}
export interface ResponseBodyEventPowerUpDataCelebration extends _ResponseBodyEventPowerUpData {
	type: "celebration";
}
export interface ResponseBodyEventPowerUpDataGigantifyAnEmote extends _ResponseBodyEventPowerUpData {
	type: "gigantify_an_emote";
	/** Emote associated with the reward. */
	emote: {
		/** The ID that uniquely identifies this emote. */
		id: string;
		/** The human readable emote token. */
		name: string;
	};
}

export interface ResponseBodyEventCustomPowerUp extends _ResponseBodyEvent {
	type: "custom_power_up";
	/** Data about a custom Power-up. */
	custom_power_up: {
		/** The title of the custom Power-up. */
		title: string;
		/** The ID of the custom Power-up. */
		reward_id: string;
	};
}