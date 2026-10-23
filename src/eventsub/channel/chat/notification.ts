import * as Main from "../../..";
import { Badge, MessageFragmentText, MessageFragmentCheermote, MessageFragmentEmote, MessageFragmentMention } from "./message";

/**
 * ## [channel.chat.notification](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification)
 * Sends a notification when an event that appears in chat occurs, such as someone subscribing to the channel or a subscription is gifted.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.chat.notification";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.chat.notification", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the channel to receive chat notification events for. */
	broadcaster_user_id: string;
	/** The user ID to read chat as. */
	user_id: string;
}

/**
 * ## [channel.chat.notification](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification)
 * Sends a notification when an event that appears in chat occurs, such as someone subscribing to the channel or a subscription is gifted.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.chat.notification" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent =
(
	| PayloadEventSub
	| PayloadEventResub
	| PayloadEventSubGift
	| PayloadEventCommunitySubGift
	| PayloadEventGiftPaidUpgrade
	| PayloadEventPrimePaidUpgrade
	| PayloadEventPayItForward
	| PayloadEventRaid
	| PayloadEventUnraid
	| PayloadEventAnnouncement
	| PayloadEventBitsBadgeTier
	| PayloadEventCharityDonation
	| PayloadEventWatchStreak
	| PayloadEventModiversary
	| PayloadEventGiftedDropsSummary
	| PayloadEventSharedChatSub
	| PayloadEventSharedChatResub
	| PayloadEventSharedChatSubGift
	| PayloadEventSharedChatCommunitySubGift
	| PayloadEventSharedChatGiftPaidUpgrade
	| PayloadEventSharedChatPrimePaidUpgrade
	| PayloadEventSharedChatPayItForward
	| PayloadEventSharedChatRaid
	| PayloadEventSharedChatAnnouncement
	| PayloadEventSharedChatModiversary
	| PayloadEventSharedChatGiftedDropsSummary
) & PayloadEventSource;
export interface _PayloadEvent {
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** The user ID of the user that sent the message. */
	chatter_user_id: string;
	/** The user login of the user that sent the message. */
	chatter_user_name: string;
	/** Whether or not the chatter is anonymous. */
	chatter_is_anonymous: boolean;
	/** The color of the user’s name in the chat room. */
	color: string;
	/** The color of the user’s name in the chat room. */
	badges: Badge[];
	/** The message Twitch shows in the chat room for this notice. */
	system_message: string;
	/** A UUID that identifies the message. */
	message_id: string;
	/** The structured chat message. */
	message: {
		/** The chat message in plain text. */
		text: string;
		/** Ordered list of chat message fragments. */
		fragments: (MessageFragmentText | MessageFragmentCheermote | MessageFragmentEmote | MessageFragmentMention)[];
	};
	/** The type of notice. Some notices can have own metadata's. */
	notice_type: string;
}

export interface PayloadEventSub extends _PayloadEvent {
	/** The type of notice. Currently it is user is being subscribed to channel, metadata is in `sub` field. */
	notice_type: "sub";
	/** Information about the sub event. */
	sub: {
		/** 
		 * The type of subscription plan being used. Possible values are:
		 * Value|Meaning
		 * -|-
		 * `1000`|First level of paid or Prime subscription.
		 * `2000`|Second level of paid subscription.
		 * `3000`|Third level of paid subscription.
		 */
		sub_tier: "1000" | "2000" | "3000";
		/** Indicates if the subscription was obtained through Amazon Prime. */
		is_prime: boolean;
		/** **Integer**. The number of months the subscription is for. */
		duration_months: number;
	};
}

export interface PayloadEventResub extends _PayloadEvent {
	/** The type of notice. Currently it is user is being resubscribed to channel, metadata is in `resub` field. */
	notice_type: "resub";
	/** Information about the resub event. */
	resub: PayloadEventResubInfo;
}
export type PayloadEventResubInfo = PayloadEventResubInfoAnonymous | PayloadEventResubInfoNonAnonymous;
export interface _PayloadEventResubInfo {
	/** **Integer**. The total number of months the user has subscribed. */
	cumulative_months: number;
	/** **Integer**. The number of months the subscription is for. */
	duration_months: number;
	/** **Integer**. The total number of months the user has subscribed. */
	streak_months: number;
	/** 
	 * The type of subscription plan being used. Possible values are:
	 * Value|Meaning
	 * -|-
	 * `1000`|First level of paid or Prime subscription.
	 * `2000`|Second level of paid subscription.
	 * `3000`|Third level of paid subscription.
	 */
	sub_tier: "1000" | "2000" | "3000";
	/** Optional. Whether or not this subscription is a Prime subscription. */
	is_prime: boolean;
	/** Whether or not the resub was a result of a gift. */
	is_gift: boolean;
	/** Whether or not the gift was anonymous. */
	gifter_is_anonymous: boolean;
	/** The user ID of the subscription gifter. Is `null` if anonymous. */
	gifter_user_id: string | null;
	/** The user name of the subscription gifter. Is `null` if anonymous. */
	gifter_user_name: string | null;
	/** Optional. The user login of the subscription gifter. Is `null` if anonymous. */
	gifter_user_login: string | null;
}
export interface PayloadEventResubInfoAnonymous extends _PayloadEventResubInfo {
	gifter_is_anonymous: true;
	gifter_user_id: null;
	gifter_user_name: null;
	gifter_user_login: null;
}
export interface PayloadEventResubInfoNonAnonymous extends _PayloadEventResubInfo {
	gifter_is_anonymous: false;
	gifter_user_id: string;
	gifter_user_name: string;
	gifter_user_login: string;
}

export interface PayloadEventSubGift extends _PayloadEvent {
	/** The type of notice. Currently it is user is gaining gift subscription to channel, metadata is in `sub_gift` field. */
	notice_type: "sub_gift";
	/** Information about the gift sub event. */
	sub_gift: {
		/** **Integer**. The number of months the subscription is for. */
		duration_months: number;
		/** **Integer**. The amount of gifts the gifter has given in this channel. Is `null` if anonymous. */
		cumulative_total: number | null;
		/** The user ID of the subscription gift recipient. */
		recipient_user_id: string;
		/** The user name of the subscription gift recipient. */
		recipient_user_name: string;
		/** The user login of the subscription gift recipient. */
		recipient_user_login: string;
		/** 
		 * The type of subscription plan being used. Possible values are:
		 * Value|Meaning
		 * -|-
		 * `1000`|First level of paid or Prime subscription.
		 * `2000`|Second level of paid subscription.
		 * `3000`|Third level of paid subscription.
		 */
		sub_tier: "1000" | "2000" | "3000";
		/** The ID of the associated community gift. Is `null` if not associated with a community gift. */
		community_gift_id: string | null;
	};
}

export interface PayloadEventCommunitySubGift extends _PayloadEvent {
	/** The type of notice. Currently it is community are gaining gift subscriptions to channel, metadata is in `community_sub_gift` field. */
	notice_type: "community_sub_gift";
	/** Information about the community gift sub event. */
	community_sub_gift: {
		/** The ID of the associated community gift. */
		id: string;
		/** **Integer**. Number of subscriptions being gifted. */
		total: number;
		/** 
		 * The type of subscription plan being used. Possible values are:
		 * Value|Meaning
		 * -|-
		 * `1000`|First level of paid or Prime subscription.
		 * `2000`|Second level of paid subscription.
		 * `3000`|Third level of paid subscription.
		 */
		sub_tier: "1000" | "2000" | "3000";
		/** **Integer**. The amount of gifts the gifter has given in this channel. Is `null` if anonymous. */
		cumulative_total: number | null;
	};
}

export interface PayloadEventGiftPaidUpgrade extends _PayloadEvent {
	/** The type of notice. Currently it is user is being subscribed to channel after getting subscription by gift, metadata is in `gift_paid_upgrade` field. */
	notice_type: "gift_paid_upgrade";
	/** Information about the community gift paid upgrade event. */
	gift_paid_upgrade: PayloadEventGiftPaidUpgradeInfo;
}
export type PayloadEventGiftPaidUpgradeInfo = PayloadEventGiftPaidUpgradeInfoAnonymous | PayloadEventGiftPaidUpgradeInfoNonAnonymous;
export interface _PayloadEventGiftPaidUpgradeInfo {
	/** Whether the gift was given anonymously. */
	gifter_is_anonymous: boolean;
	/** Optional. The user ID of the user who gifted the subscription. Is `null` if anonymous. */
	gifter_user_id: string | null;
	/** Optional. The user name of the user who gifted the subscription. Is `null` if anonymous. */
	gifter_user_name: string | null;
}
export interface PayloadEventGiftPaidUpgradeInfoAnonymous extends _PayloadEventGiftPaidUpgradeInfo {
	gifter_is_anonymous: true;
	gifter_user_id: null;
	gifter_user_name: null;
}
export interface PayloadEventGiftPaidUpgradeInfoNonAnonymous extends _PayloadEventGiftPaidUpgradeInfo {
	gifter_is_anonymous: false;
	gifter_user_id: string;
	gifter_user_name: string;
}

export interface PayloadEventPrimePaidUpgrade extends _PayloadEvent {
	/** The type of notice. Currently it is user is being subscribed to channel after getting Prime subscription, metadata is in `prime_paid_upgrade` field. */
	notice_type: "prime_paid_upgrade";
	/** Information about the Prime gift paid upgrade event. */
	prime_paid_upgrade: {
		/** 
		 * The type of subscription plan being used. Possible values are:
		 * Value|Meaning
		 * -|-
		 * `1000`|First level of paid or Prime subscription.
		 * `2000`|Second level of paid subscription.
		 * `3000`|Third level of paid subscription.
		 */
		sub_tier: "1000" | "2000" | "3000";
	};
}

export interface PayloadEventPayItForward extends _PayloadEvent {
	/** The type of notice. Currently it is user is gifting subscription to their gifter, metadata is in `pay_it_forward` field. */
	notice_type: "pay_it_forward";
	/** Information about the pay it forward event. */
	pay_it_forward: PayloadEventPayItForwardInfo;
}
export type PayloadEventPayItForwardInfo = PayloadEventPayItForwardInfoAnonymous | PayloadEventPayItForwardInfoNonAnonymous;
export interface _PayloadEventPayItForwardInfo {
	/** Whether the gift was given anonymously. */
	gifter_is_anonymous: boolean;
	/** The user ID of the user who gifted the subscription. Is `null` if anonymous. */
	gifter_user_id: string | null;
	/** The user name of the user who gifted the subscription. Is `null` if anonymous. */
	gifter_user_name: string | null;
	/** The user login of the user who gifted the subscription. Is `null` if anonymous. */
	gifter_user_login: string | null;
}
export interface PayloadEventPayItForwardInfoAnonymous extends _PayloadEventPayItForwardInfo {
	gifter_is_anonymous: true;
	gifter_user_id: null;
	gifter_user_name: null;
	gifter_user_login: null;
}
export interface PayloadEventPayItForwardInfoNonAnonymous extends _PayloadEventPayItForwardInfo {
	gifter_is_anonymous: false;
	gifter_user_id: string;
	gifter_user_name: string;
	gifter_user_login: string;
}

export interface PayloadEventRaid extends _PayloadEvent {
	/** The type of notice. Currently it is user is being raided, metadata is in `raid` field. */
	notice_type: "raid";
	/** Information about the raid event. */
	raid: {
		/** The user ID of the broadcaster raiding this channel. */
		user_id: string;
		/** The user name of the broadcaster raiding this channel. */
		user_name: string;
		/** The login name of the broadcaster raiding this channel. */
		user_login: string;
		/** **Integer**. The number of viewers raiding this channel from the broadcaster’s channel. */
		viewer_count: number;
		/** Profile image URL of the broadcaster raiding this channel. */
		profile_image_url: string;
	};
}

export interface PayloadEventUnraid extends _PayloadEvent {
	/** The type of notice. Currently it is user is no longer being raided. */
	notice_type: "unraid";
	/** Information about the unraid event. Is empty. */
	unraid: {};
}

export interface PayloadEventAnnouncement extends _PayloadEvent {
	/** The type of notice. Currently it is chat is getting announcement message, metadata is in `announcement` field. */
	notice_type: "announcement";
	/** Information about the announcement event. */
	announcement: {
		/** Color of the announcement. */
		color: string;
	};
}

export interface PayloadEventBitsBadgeTier extends _PayloadEvent {
	/** The type of notice. Currently it is user's bits badge tier is being updated, metadata is in `bits_badge_tier` field. */
	notice_type: "bits_badge_tier";
	/** Information about the Bits badge tier event. */
	bits_badge_tier: {
		/** **Integer**. The tier of the Bits badge the user just earned. For example, 100, 1000, or 10000. */
		tier: number;
	};
}

export interface PayloadEventCharityDonation extends _PayloadEvent {
	/** The type of notice. Currently it is charity donation message, metadata is in `charity_donation` field. */
	notice_type: "charity_donation";
	/** Information about the charity donation event. */
	charity_donation: {
		/** Name of the charity. */
		charity_name: string;
		/** An object that contains the amount of money that the user paid. */
		amount: {
			/** **Integer**. The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
			value: number;
			/** **Integer**. The number of decimal places used by the currency. For example, USD uses two decimal places. */
			decimal_place: number;
			/** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
			currency: string;
		};
	};
}

export interface PayloadEventWatchStreak extends _PayloadEvent {
	/** The type of notice. Currently it is user is posting their watch streak message, metadata is in `watch_streak` field. */
	notice_type: "watch_streak";
	/** Information about the Watch Streak event. */
	watch_streak: {
		/** **Integer**. The number of consecutive broadcasts for which the user has been watching. */
		streak_count: number;
		/** **Integer**. The number of channel points awarded for the Watch Streak milestone. */
		channel_points_awarded: number;
	};
}

export interface PayloadEventModiversary extends _PayloadEvent {
	/** The type of notice. Currently it is user is posting their modiversary message, metadata is in `watch_streak` field. */
	notice_type: "modiversary";
	/** Information about the modiversary event. */
	modiversary: {
		/** **Integer**. The number of months the user has been a moderator in this channel. */
		months: number;
	};
}

export interface PayloadEventGiftedDropsSummary extends _PayloadEvent {
	/** The type of notice. Metadata is in `gifted_drops_summary` field. */
	notice_type: "gifted_drops_summary";
	/** Information about the gifted Drops summary event. */
	gifted_drops_summary: {
		/** **Integer**. The number of users who received a gifted Drop. */
		recipient_count: number;
	};
}

export type PayloadEventSource = PayloadEventSourceWith | PayloadEventSourceWithout;
export interface _PayloadEventSource {
	/** The broadcaster user ID of the channel the message was sent from. Is `null` when the message notification happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_id: string | null;
	/** The user name of the broadcaster of the channel the message was sent from. Is `null` when the message notification happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_name: string | null;
	/** The login of the broadcaster of the channel the message was sent from. Is `null` when the message notification happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_login: string | null;
	/** The UUID that identifies the source message from the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_message_id: string | null;
	/** The list of chat badges for the chatter in the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_badges: Badge[] | null;
	/** Whether the notification is only sent to the source channel. Is `null` if the notification is not in a shared chat session. */
	is_source_only: boolean | null;
}
export interface PayloadEventSourceWith extends _PayloadEventSource {
	source_broadcaster_user_id: string;
	source_broadcaster_user_name: string;
	source_broadcaster_user_login: string;
	source_message_id: string;
	source_badges: Badge[];
}
export interface PayloadEventSourceWithout extends _PayloadEventSource {
	source_broadcaster_user_id: null;
	source_broadcaster_user_name: null;
	source_broadcaster_user_login: null;
	source_message_id: null;
	source_badges: null;
}

export interface PayloadEventSharedChatSub extends _PayloadEvent {
	notice_type: "shared_chat_sub";
	/** This field has the same information as the `sub` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_sub: PayloadEventSub[PayloadEventSub["notice_type"]];
}

export interface PayloadEventSharedChatResub extends _PayloadEvent {
	notice_type: "shared_chat_resub";
	/** This field has the same information as the `resub` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_resub: PayloadEventResub[PayloadEventResub["notice_type"]];
}

export interface PayloadEventSharedChatSubGift extends _PayloadEvent {
	notice_type: "shared_chat_sub_gift";
	/** This field has the same information as the `sub_gift` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_sub_gift: PayloadEventSubGift[PayloadEventSubGift["notice_type"]];
}

export interface PayloadEventSharedChatCommunitySubGift extends _PayloadEvent {
	notice_type: "shared_chat_community_sub_gift";
	/** This field has the same information as the `community_sub_gift` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_community_sub_gift: PayloadEventCommunitySubGift[PayloadEventCommunitySubGift["notice_type"]];
}

export interface PayloadEventSharedChatGiftPaidUpgrade extends _PayloadEvent {
	notice_type: "shared_chat_gift_paid_upgrade";
	/** This field has the same information as the `gift_paid_upgrade` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_gift_paid_upgrade: PayloadEventGiftPaidUpgrade[PayloadEventGiftPaidUpgrade["notice_type"]];
}

export interface PayloadEventSharedChatPrimePaidUpgrade extends _PayloadEvent {
	notice_type: "shared_chat_prime_paid_upgrade";
	/** This field has the same information as the `prime_paid_upgrade` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_prime_paid_upgrade: PayloadEventPrimePaidUpgrade[PayloadEventPrimePaidUpgrade["notice_type"]];
}

export interface PayloadEventSharedChatPayItForward extends _PayloadEvent {
	notice_type: "shared_chat_pay_it_forward";
	/** This field has the same information as the `pay_it_forward` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_pay_it_forward: PayloadEventPayItForward[PayloadEventPayItForward["notice_type"]];
}

export interface PayloadEventSharedChatRaid extends _PayloadEvent {
	notice_type: "shared_chat_raid";
	/** This field has the same information as the `raid` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_raid: PayloadEventRaid[PayloadEventRaid["notice_type"]];
}

export interface PayloadEventSharedChatAnnouncement extends _PayloadEvent {
	notice_type: "shared_chat_announcement";
	/** This field has the same information as the `announcement` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_announcement: PayloadEventAnnouncement[PayloadEventAnnouncement["notice_type"]];
}

export interface PayloadEventSharedChatModiversary extends _PayloadEvent {
	notice_type: "shared_chat_modiversary";
	/** This field has the same information as the `modiversary` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_modiversary: PayloadEventModiversary[PayloadEventModiversary["notice_type"]];
}

export interface PayloadEventSharedChatGiftedDropsSummary extends _PayloadEvent {
	notice_type: "shared_chat_gifted_drops_summary";
	/** This field has the same information as the `gifted_drops_summary` field but for a notice that happened for a channel in a shared chat session other than the broadcaster in the subscription condition. */
	shared_chat_gifted_drops_summary: PayloadEventGiftedDropsSummary[PayloadEventGiftedDropsSummary["notice_type"]];
}