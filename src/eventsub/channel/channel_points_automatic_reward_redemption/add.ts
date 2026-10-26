import * as Main from "../../..";
import { MessageFragment } from "../chat/message";

/**
 * ## [channel.channel_points_automatic_reward_redemption.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd)
 * Sends a notification when a viewer has redeemed an automatic channel points reward on the specified channel.

 * ### Authorization
 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.channel_points_automatic_reward_redemption.add";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.channel_points_automatic_reward_redemption.add", version: "2", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to receive channel points reward add notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.channel_points_automatic_reward_redemption.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd)
 * Sends a notification when a viewer has redeemed an automatic channel points reward on the specified channel.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.channel_points_automatic_reward_redemption.add" && message.metadata.subscription_version === "2";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the channel where the reward was redeemed. */
	broadcaster_user_id: string;
	/** The login of the channel where the reward was redeemed. */
	broadcaster_user_login: string;
	/** The display name of the channel where the reward was redeemed. */
	broadcaster_user_name: string;
	/** The ID of the redeeming user. */
	user_id: string;
	/** The login of the redeeming user. */
	user_login: string;
	/** The display name of the redeeming user. */
	user_name: string;
	/** The ID of the Redemption. */
	id: string;
	/** An object that contains the reward information. */
	reward: {
		/** The type of reward. */
		type: "single_message_bypass_sub_mode" | "send_highlighted_message" | "random_sub_emote_unlock" | "chosen_sub_emote_unlock" | "chosen_modified_sub_emote_unlock";
		/** **Integer**. Number of channel points used. */
		channel_points: number;
		/** Optional. Emote associated with the reward. */
		emote: {
			/** The emote ID. */
			id: string;
			/** The human readable emote token. */
			name: string;
		} | null;
	};
	/** Optional. An object that contains the user message and emote information needed to recreate the message. */
	message: {
		/** The chat message in plain text. */
		text: string;
		/** The ordered list of chat message fragments. */
		fragments: MessageFragment[];
	} | null;
	/** The UTC date and time (in RFC3339 format) of when the reward was redeemed. */
	redeemed_at: string;
}