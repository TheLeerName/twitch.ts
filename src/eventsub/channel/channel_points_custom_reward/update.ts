import * as Main from "../../..";
import { MaxPerStream, MaxPerUserPerStream, Image, GlobalCooldown } from "./add";

/**
 * ## [channel.channel_points_custom_reward.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate)
 * Sends a notification when a custom channel points reward has been updated for the specified channel.

 * ### Authorization
 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.channel_points_custom_reward.update";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.channel_points_custom_reward.update", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to receive channel points custom reward update notifications for. */
	broadcaster_user_id: string;
	/** Optional. Specify a reward id to only receive notifications for a specific reward. */
	reward_id?: string;
}

/**
 * ## [channel.channel_points_custom_reward.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate)
 * Sends a notification when a custom channel points reward has been updated for the specified channel.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.channel_points_custom_reward.update" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The reward identifier. */
	id: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** Is the reward currently enabled. If `false`, the reward won’t show up to viewers. */
	is_enabled: boolean;
	/** Is the reward currently paused. If `true`, viewers can’t redeem. */
	is_paused: boolean;
	/** Is the reward currently in stock. If `false`, viewers can’t redeem. */
	is_in_stock: boolean;
	/** The reward title. */
	title: string;
	/** **Integer**. The reward cost. */
	cost: number;
	/** The reward description. */
	prompt: string;
	/** Does the viewer need to enter information when redeeming the reward. */
	is_user_input_required: boolean;
	/** Should redemptions be set to fulfilled status immediately when redeemed and skip the request queue instead of the normal unfulfilled status. */
	should_redemptions_skip_request_queue: boolean;
	/** Whether a maximum per stream is enabled and what the maximum is. */
	max_per_stream: MaxPerStream;
	/** Whether a maximum per user per stream is enabled and what the maximum is. */
	max_per_user_per_stream: MaxPerUserPerStream;
	/** Custom background color for the reward. Format: Hex with # prefix. Example: #FA1ED2. */
	background_color: string;
	/** Set of custom images of 1x, 2x and 4x sizes for the reward. Can be `null` if no images have been uploaded. */
	image: Image | null;
	/** Set of default images of 1x, 2x and 4x sizes for the reward. */
	default_image: Image;
	/** Whether a cooldown is enabled and what the cooldown is in seconds. */
	global_cooldown: GlobalCooldown;
	/** Timestamp of the cooldown expiration. Is `null` if the reward isn’t on cooldown. */
	cooldown_expires_at: string;
	/** **Integer**. The number of redemptions redeemed during the current live stream. Counts against the {@link max_per_stream} limit. Is `null` if the broadcasters stream isn’t live or {@link max_per_stream} isn’t enabled. */
	redemptions_redeemed_current_stream: number;
}