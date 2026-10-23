import * as Main from "../..";

/**
 * ## [channel.moderate](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate)
 * Sends a notification when a moderator performs a moderation action in a channel. Some of these actions affect chatters in other channels during Shared Chat.

 * ### Authorization
 * Must have all of the following scopes:
 * - `moderator:read:blocked_terms` OR `moderator:manage:blocked_terms`
 * - `moderator:read:chat_settings` OR `moderator:manage:chat_settings`
 * - `moderator:read:unban_requests` OR `moderator:manage:unban_requests`
 * - `moderator:read:banned_users` OR `moderator:manage:banned_users`
 * - `moderator:read:chat_messages` OR `moderator:manage:chat_messages`
 * - `moderator:read:moderators`
 * - `moderator:read:vips`
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.moderate";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.moderate", version: "2", condition, transport};
}

export interface Condition {
	/** The user ID of the broadcaster. */
	broadcaster_user_id: string;
	/** The user ID of the moderator. */
	moderator_user_id: string;
}

/**
 * ## [channel.moderate](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate)
 * Sends a notification when a moderator performs a moderation action in a channel. Some of these actions affect chatters in other channels during Shared Chat.

 * ### Authorization
 * Must have all of the following scopes:
 * - `moderator:read:blocked_terms` OR `moderator:manage:blocked_terms`
 * - `moderator:read:chat_settings` OR `moderator:manage:chat_settings`
 * - `moderator:read:unban_requests` OR `moderator:manage:unban_requests`
 * - `moderator:read:banned_users` OR `moderator:manage:banned_users`
 * - `moderator:read:chat_messages` OR `moderator:manage:chat_messages`
 * - `moderator:read:warnings` OR `moderator:manage:warnings`
 * - `moderator:read:moderators`
 * - `moderator:read:vips`
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.moderate" && message.metadata.subscription_version === "2";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = 
| PayloadEventBan
| PayloadEventUnban
| PayloadEventTimeout
| PayloadEventUntimeout
| PayloadEventClear
| PayloadEventEmoteOnly
| PayloadEventEmoteOnlyOff
| PayloadEventFollowers
| PayloadEventFollowersOff
| PayloadEventUniqueChat
| PayloadEventUniqueChatOff
| PayloadEventSlow
| PayloadEventSlowOff
| PayloadEventSubscribers
| PayloadEventSubscribersOff
| PayloadEventDelete
| PayloadEventVip
| PayloadEventUnvip
| PayloadEventRaid
| PayloadEventUnraid
| PayloadEventAddBlockedTerm
| PayloadEventAddPermittedTerm
| PayloadEventRemoveBlockedTerm
| PayloadEventRemovePermittedTerm
| PayloadEventMod
| PayloadEventUnmod
| PayloadEventApproveUnbanRequest
| PayloadEventDenyUnbanRequest
| PayloadEventWarn
| PayloadEventSharedChatBan
| PayloadEventSharedChatTimeout
| PayloadEventSharedChatUnban
| PayloadEventSharedChatUntimeout
| PayloadEventSharedChatDelete;
export interface _PayloadEvent {
	/** The ID of the broadcaster. */
	broadcaster_user_id: string;
	/** The login of the broadcaster. */
	broadcaster_user_login: string;
	/** The user name of the broadcaster. */
	broadcaster_user_name: string;
	/** The channel in which the action originally occurred. Is the same as the `broadcaster_user_id` if not in shared chat. */
	source_broadcaster_user_id: string;
	/** The channel in which the action originally occurred. Is the same as the `broadcaster_user_login` if not in shared chat. */
	source_broadcaster_user_login: string;
	/** The channel in which the action originally occurred. Is `null` when the moderator action happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_name: string;
	/** The ID of the moderator who performed the action. */
	moderator_user_id: string;
	/** The login of the moderator. */
	moderator_user_login: string;
	/** The user name of the moderator. */
	moderator_user_name: string;
	/** The action performed. */
	action: string;
}

export interface PayloadEventBan extends _PayloadEvent {
	action: "ban";
	/** Optional. Metadata associated with the ban command. */
	ban: {
		/** The ID of the user being banned. */
		user_id: string;
		/** The login of the user being banned. */
		user_login: string;
		/** The user name of the user being banned. */
		user_name: string;
		/** Reason given for the ban. */
		reason: string | null;
	};
}

export interface PayloadEventUnban extends _PayloadEvent {
	action: "unban";
	/** Metadata associated with the unban command. */
	unban: {
		/** The ID of the user being unbanned. */
		user_id: string;
		/** The login of the user being unbanned. */
		user_login: string;
		/** The user name of the user being unbanned. */
		user_name: string;
	};
}

export interface PayloadEventTimeout extends _PayloadEvent {
	action: "timeout";
	/** Metadata associated with the timeout command. */
	timeout: {
		/** The ID of the user being timed out. */
		user_id: string;
		/** The login of the user being timed out. */
		user_login: string;
		/** The user name of the user being timed out. */
		user_name: string;
		/** The reason given for the timeout. */
		reason: string | null;
		/** The time at which the timeout ends. */
		expires_at: string;
	};
}

export interface PayloadEventUntimeout extends _PayloadEvent {
	action: "untimeout";
	/** Metadata associated with the untimeout command. */
	untimeout: {
		/** The ID of the user being untimed out. */
		user_id: string;
		/** The login of the user being untimed out. */
		user_login: string;
		/** The user name of the user untimed out. */
		user_name: string;
	};
}

export interface PayloadEventClear extends _PayloadEvent {
	action: "clear";
}

export interface PayloadEventEmoteOnly extends _PayloadEvent {
	action: "emoteonly";
}
export interface PayloadEventEmoteOnlyOff extends _PayloadEvent {
	action: "emoteonlyoff";
}

export interface PayloadEventFollowers extends _PayloadEvent {
	action: "followers";
	/** Metadata associated with the followers command. */
	followers: {
		/** **Integer**. The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat room. */
		follow_duration_minutes: number;
	};
}
export interface PayloadEventFollowersOff extends _PayloadEvent {
	action: "followersoff";
}

export interface PayloadEventUniqueChat extends _PayloadEvent {
	action: "uniquechat";
}
export interface PayloadEventUniqueChatOff extends _PayloadEvent {
	action: "uniquechatoff";
}

export interface PayloadEventSlow extends _PayloadEvent {
	action: "slow";
	/** Metadata associated with the slow command. */
	slow: {
		/** **Integer**. The amount of time, in seconds, that users need to wait between sending messages. */
		wait_time_seconds: number;
	};
}
export interface PayloadEventSlowOff extends _PayloadEvent {
	action: "slowoff";
}

export interface PayloadEventSubscribers extends _PayloadEvent {
	action: "subscribers";
}
export interface PayloadEventSubscribersOff extends _PayloadEvent {
	action: "subscribersoff";
}

export interface PayloadEventDelete extends _PayloadEvent {
	action: "delete";
	/** Metadata associated with the delete command. */
	delete: {
		/** The ID of the user whose message is being deleted. */
		user_id: string;
		/** The login of the user. */
		user_login: string;
		/** The user name of the user. */
		user_name: string;
		/** The ID of the message being deleted. */
		message_id: string;
		/** The message body of the message being deleted. */
		message_body: string;
	};
}

export interface PayloadEventVip extends _PayloadEvent {
	action: "vip";
	/** Metadata associated with the vip command. */
	vip: {
		/** The ID of the user gaining VIP status. */
		user_id: string;
		/** The login of the user gaining VIP status. */
		user_login: string;
		/** The user name of the user gaining VIP status. */
		user_name: string;
	};
}

export interface PayloadEventUnvip extends _PayloadEvent {
	action: "unvip";
	/** Metadata associated with the unvip command. */
	unvip: {
		/** The ID of the user losing VIP status. */
		user_id: string;
		/** The login of the user losing VIP status. */
		user_login: string;
		/** The user name of the user losing VIP status. */
		user_name: string;
	};
}

export interface PayloadEventRaid extends _PayloadEvent {
	action: "raid";
	/** Metadata associated with the raid command. */
	raid: {
		/** The ID of the user being raided. */
		user_id: string;
		/** The login of the user being raided. */
		user_login: string;
		/** The user name of the user raided. */
		user_name: string;
		/** **Integer**. The viewer count. */
		viewer_count: number;
	};
}

export interface PayloadEventUnraid extends _PayloadEvent {
	action: "unraid";
	/** Metadata associated with the unraid command. */
	unraid: {
		/** The ID of the user no longer being raided. */
		user_id: string;
		/** The login of the user no longer being raided. */
		user_login: string;
		/** The user name of the no longer user raided. */
		user_name: string;
	};
}

export interface PayloadEventAddBlockedTerm extends _PayloadEvent {
	action: "add_blocked_term";
	/** Metadata associated with the automod terms changes. */
	automod_terms: {
		action: "add";
		list: "blocked";
		/** Terms being added or removed. */
		terms: string[];
		/** Whether the terms were added due to an Automod message approve/deny action. */
		from_automod: boolean;
	};
}

export interface PayloadEventAddPermittedTerm extends _PayloadEvent {
	action: "add_permitted_term";
	/** Metadata associated with the automod terms changes. */
	automod_terms: {
		action: "add";
		list: "permitted";
		/** Terms being added or removed. */
		terms: string[];
		/** Whether the terms were added due to an Automod message approve/deny action. */
		from_automod: boolean;
	};
}

export interface PayloadEventRemoveBlockedTerm extends _PayloadEvent {
	action: "remove_blocked_term";
	/** Metadata associated with the automod terms changes. */
	automod_terms: {
		action: "remove";
		list: "blocked";
		/** Terms being added or removed. */
		terms: string[];
		/** Whether the terms were added due to an Automod message approve/deny action. */
		from_automod: boolean;
	};
}

export interface PayloadEventRemovePermittedTerm extends _PayloadEvent {
	action: "remove_permitted_term";
	/** Metadata associated with the automod terms changes. */
	automod_terms: {
		action: "remove";
		list: "permitted";
		/** Terms being added or removed. */
		terms: string[];
		/** Whether the terms were added due to an Automod message approve/deny action. */
		from_automod: boolean;
	};
}

export interface PayloadEventMod extends _PayloadEvent {
	action: "mod";
	/** Metadata associated with the mod command. */
	mod: {
		/** The ID of the user gaining mod status. */
		user_id: string;
		/** The login of the user gaining mod status. */
		user_login: string;
		/** The user name of the user gaining mod status. */
		user_name: string;
	};
}

export interface PayloadEventUnmod extends _PayloadEvent {
	action: "unmod";
	/** Metadata associated with the unmod command. */
	unmod: {
		/** The ID of the user losing mod status. */
		user_id: string;
		/** The login of the user losing mod status. */
		user_login: string;
		/** The user name of the user losing mod status. */
		user_name: string;
	};
}

export interface PayloadEventApproveUnbanRequest extends _PayloadEvent {
	action: "approve_unban_request";
	/** Metadata associated with an unban request. */
	unban_request: {
		is_approved: true;
		/** The ID of the banned user. */
		user_id: string;
		/** The login of the user. */
		user_login: string;
		/** The user name of the user. */
		user_name: string;
		/** The message included by the moderator explaining their approval or denial. */
		moderator_message: string;
	};
}

export interface PayloadEventDenyUnbanRequest extends _PayloadEvent {
	action: "deny_unban_request";
	/** Metadata associated with an unban request. */
	unban_request: {
		is_approved: false;
		/** The ID of the banned user. */
		user_id: string;
		/** The login of the user. */
		user_login: string;
		/** The user name of the user. */
		user_name: string;
		/** The message included by the moderator explaining their approval or denial. */
		moderator_message: string;
	};
}

export interface PayloadEventWarn extends _PayloadEvent {
	action: "warn";
	/** Metadata associated with the warn command. */
	warn: {
		/** The ID of the user being warned. */
		user_id: string;
		/** The login of the user being warned. */
		user_login: string;
		/** The user name of the user being warned. */
		user_name: string;
		/** Reason given for the warning. */
		reason: string | null;
		/** Chat rules cited for the warning. */
		chat_rules_cited: string[] | null;
	};
}

export interface PayloadEventSharedChatBan extends _PayloadEvent {
	action: "shared_chat_ban";
	/** This field has the same information as the `ban` field but for a action that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_ban: PayloadEventBan[PayloadEventBan["action"]];
}

export interface PayloadEventSharedChatUnban extends _PayloadEvent {
	action: "shared_chat_unban";
	/** This field has the same information as the `ban` field but for a action that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_unban: PayloadEventUnban[PayloadEventUnban["action"]];
}

export interface PayloadEventSharedChatTimeout extends _PayloadEvent {
	action: "shared_chat_timeout";
	/** This field has the same information as the `ban` field but for a action that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_timeout: PayloadEventTimeout[PayloadEventTimeout["action"]];
}

export interface PayloadEventSharedChatUntimeout extends _PayloadEvent {
	action: "shared_chat_timeout";
	/** This field has the same information as the `ban` field but for a action that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_untimeout: PayloadEventUntimeout[PayloadEventUntimeout["action"]];
}

export interface PayloadEventSharedChatDelete extends _PayloadEvent {
	action: "shared_chat_delete";
	/** This field has the same information as the `delete` field but for a action that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_delete: PayloadEventDelete[PayloadEventDelete["action"]];
}