import * as Main from "../../..";

/**
 * ## [channel.guest_star_guest.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate)
 * Sends a notification when a guest or a slot is updated in an active Guest Star session.

 * ### Authorization
 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.guest_star_guest.update";
	version: "beta";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.guest_star_guest.update", version: "beta", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel hosting the Guest Star Session */
	broadcaster_user_id: string;
	/** The user ID of the moderator or broadcaster of the specified channel. */
	moderator_user_id: string;
}

/**
 * ## [channel.guest_star_guest.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate)
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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.guest_star_guest.update" && message.metadata.subscription_version === "beta";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = 
| PayloadEventSlotEmpty
| PayloadEventInvited
| PayloadEventAccepted
| PayloadEventReady
| PayloadEventBackstage
| PayloadEventLive
| PayloadEventRemoved;
export interface _PayloadEvent {
	/** The non-host broadcaster user ID. */
	broadcaster_user_id: string;
	/** The non-host broadcaster display name. */
	broadcaster_user_name: string;
	/** The non-host broadcaster login. */
	broadcaster_user_login: string;
	/** ID representing the unique session that was started. */
	session_id: string;
	/** The user ID of the moderator who updated the guest’s state (could be the host). Is `null` if the update was performed by the guest. */
	moderator_user_id: string | null;
	/** The moderator display name. Is `null` if the update was performed by the guest. */
	moderator_user_name: string | null;
	/** The moderator login. Is `null` if the update was performed by the guest. */
	moderator_user_login: string | null;
	/** The user ID of the guest who transitioned states in the session. Is `null` if the slot is now empty. */
	guest_user_id: string | null;
	/** The guest display name. Is `null` if the slot is now empty. */
	guest_user_name: string | null;
	/** The guest login. Is `null` if the slot is now empty. */
	guest_user_login: string | null;
	/** The ID of the slot assignment the guest is assigned to. Is `null` if the guest is in the `invited`, `removed`, `ready`, or `accepted` state. */
	slot_id: string | null;
	/** The current state of the user after the update has taken place. */
	state: string | null;
	/** User ID of the host channel. */
	host_user_id: string;
	/** The host display name. */
	host_user_name: string;
	/** The host login. */
	host_user_login: string;
	/** Flag that signals whether the host is allowing the slot’s video to be seen by participants within the session. Is `null` if the guest is not slotted. */
	host_video_enabled: boolean | null;
	/** Flag that signals whether the host is allowing the slot’s audio to be heard by participants within the session. Is `null` if the guest is not slotted. */
	host_audio_enabled: boolean | null;
	/** **Integer**. Value between 0-100 that represents the slot’s audio level as heard by participants within the session. Is `null` if the guest is not slotted. */
	host_volume: number | null;
}

export interface PayloadEventSlotEmpty extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `null` if the slot is now empty. */
	state: null;
	guest_user_id: null;
	guest_user_name: null;
	guest_user_login: null;
	slot_id: string;
	host_video_enabled: null;
	host_audio_enabled: null;
	host_volume: null;
}

export interface PayloadEventInvited extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `invited` if the guest has transitioned to the invite queue. This can take place when the guest was previously assigned a slot, but have been removed from the call and are sent back to the invite queue. */
	state: "invited";
	guest_user_id: string;
	guest_user_name: string;
	guest_user_login: string;
	slot_id: null;
	host_video_enabled: boolean;
	host_audio_enabled: boolean;
	host_volume: number;
}

export interface PayloadEventAccepted extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `accepted` if the guest has accepted the invite and is currently in the process of setting up to join the session. */
	state: "accepted";
	guest_user_id: string;
	guest_user_name: string;
	guest_user_login: string;
	slot_id: null;
	host_video_enabled: boolean;
	host_audio_enabled: boolean;
	host_volume: number;
}

export interface PayloadEventReady extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `ready` if the guest has signaled they are ready and can be assigned a slot. */
	state: "ready";
	guest_user_id: string;
	guest_user_name: string;
	guest_user_login: string;
	slot_id: null;
	host_video_enabled: boolean;
	host_audio_enabled: boolean;
	host_volume: number;
}

export interface PayloadEventBackstage extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `backstage` if the guest has been assigned a slot in the session, but is not currently seen live in the broadcasting software. */
	state: "backstage";
	guest_user_id: string;
	guest_user_name: string;
	guest_user_login: string;
	slot_id: string;
	host_video_enabled: boolean;
	host_audio_enabled: boolean;
	host_volume: number;
}

export interface PayloadEventLive extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `live` if the guest is now live in the host's broadcasting software. */
	state: "live";
	guest_user_id: string;
	guest_user_name: string;
	guest_user_login: string;
	slot_id: string;
	host_video_enabled: boolean;
	host_audio_enabled: boolean;
	host_volume: number;
}

export interface PayloadEventRemoved extends _PayloadEvent {
	/** The current state of the user after the update has taken place. Is `removed` if the guest was removed from the call or queue. */
	state: "removed";
	guest_user_id: string;
	guest_user_name: string;
	guest_user_login: string;
	slot_id: null;
	host_video_enabled: boolean;
	host_audio_enabled: boolean;
	host_volume: number;
}