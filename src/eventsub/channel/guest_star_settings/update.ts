import * as Main from "../../..";

/**
 * ## [channel.guest_star_settings.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_settingsupdate)
 * Sends a notification when the host preferences for Guest Star have been updated.

 * ### Authorization
 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.guest_star_settings.update";
	version: "beta";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.guest_star_settings.update", version: "beta", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel hosting the Guest Star Session */
	broadcaster_user_id: string;
	/** The user ID of the moderator or broadcaster of the specified channel. */
	moderator_user_id: string;
}

/**
 * ## [channel.guest_star_settings.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate)
 * Sends a notification when a guest or a slot is updated in an active Guest Star session.

 * ### Authorization
 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.guest_star_settings.update" && message.metadata.subscription_version === "beta";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** User ID of the host channel. */
	broadcaster_user_id: string;
	/** The broadcaster display name */
	broadcaster_user_name: string;
	/** he broadcaster login. */
	broadcaster_user_login: string;
	/** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
	is_moderator_send_live_enabled: boolean;
	/** **Integer**. Number of slots the Guest Star call interface will allow the host to add to a call. */
	slot_count: number;
	/** Flag determining if browser sources subscribed to sessions on this channel should output audio. */
	is_browser_source_audio_enabled: boolean;
	/** 
	 * This setting determines how the guests within a session should be laid out within a group browser source. Can be one of the following values:
	 * Value|Meaning
	 * -|-
	 * `tiled`|All live guests are tiled within the browser source with the same size.
	 * `screenshare`|All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests.
	 * `horizontal_top`|Indicates the group layout will contain all participants in a top-aligned horizontal stack.
	 * `horizontal_bottom`|Indicates the group layout will contain all participants in a bottom-aligned horizontal stack.
	 * `vertical_left`|Indicates the group layout will contain all participants in a left-aligned vertical stack.
	 * `vertical_right`|Indicates the group layout will contain all participants in a right-aligned vertical stack.
	 */
	group_layout: "tiled" | "screenshare" | "horizontal_top" | "horizontal_bottom" | "vertical_left" | "vertical_right";
}