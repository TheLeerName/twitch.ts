import * as Main from "../../..";

/**
 * ## [channel.chat.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage)
 * Sends a notification when any user sends a message to a channel’s chat room.

 * ### Authorization
 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface RequestBody extends Main.EventSub.RequestBody.Subscription {
	type: "channel.chat.message";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.chat.message", version: "1", condition, transport};
}

export interface Condition {
	/** The User ID of the channel to receive chat message events for. */
	broadcaster_user_id: string;
	/** The User ID to read chat as. */
	user_id: string;
}

/**
 * ## [channel.chat.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage)
 * Sends a notification when any user sends a message to a channel’s chat room.

 * ### Authorization
 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface ResponseBody {
	subscription: ResponseBodySubscription;
	event: ResponseBodyEvent;
}
export function isResponseBody(obj: unknown): obj is ResponseBody {
	// @ts-ignore
	return obj != null && obj.subscription != null && obj.subscription.type === "channel.chat.message" && obj.subscription.version === "1";
}
export type ResponseBodySubscription = Main.EventSub.ResponseBody.Subscription<RequestBody>;
export interface ResponseBodyEvent {
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** The user ID of the user that sent the message. */
	chatter_user_id: string;
	/** The user name of the user that sent the message. */
	chatter_user_name: string;
	/** The user login of the user that sent the message. */
	chatter_user_login: string;
	/** A UUID that identifies the message. */
	message_id: string;
	/** The structured chat message. */
	message: {
		/** The chat message in plain text. */
		text: string;
		/** Ordered list of chat message fragments. */
		fragments: MessageFragment[];
	};
	/** The type of message. */
	message_type: "text" | "channel_points_highlighted" | "channel_points_sub_only" | "user_intro" | "power_ups_message_effect" | "power_ups_gigantified_emote";
	/** List of chat badges. */
	badges: Badge[];
	/** Metadata if this message is a cheer. */
	cheer: {
		/** **Integer**. The amount of Bits the user cheered. */
		bits: number;
	} | null;
	/** The color of the user’s name in the chat room. This is a hexadecimal RGB color code in the form, `#&lt;RGB&gt;`. This tag may be empty if it is never set. */
	color: string | null;
	/** Metadata if this message is a reply. */
	reply: {
		/** An ID that uniquely identifies the parent message that this message is replying to. */
		parent_message_id: string;
		/** The message body of the parent message. */
		parent_message_body: string;
		/** User ID of the sender of the parent message. */
		parent_user_id: string;
		/** User name of the sender of the parent message. */
		parent_user_name: string;
		/** User login of the sender of the parent message. */
		parent_user_login: string;
		/** An ID that identifies the parent message of the reply thread. */
		thread_message_id: string;
		/** User ID of the sender of the thread’s parent message. */
		thread_user_id: string;
		/** User name of the sender of the thread’s parent message. */
		thread_user_name: string;
		/** User login of the sender of the thread’s parent message. */
		thread_user_login: string;
	} | null;
	/** The ID of a channel points custom reward that was redeemed. */
	channel_points_custom_reward_id: string | null;
	/** The broadcaster user ID of the channel the message was sent from. Is null when the message happens in the same channel as the broadcaster. Is not null when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_id: string | null;
	/** The user name of the broadcaster of the channel the message was sent from. Is null when the message happens in the same channel as the broadcaster. Is not null when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_name: string | null;
	/** The login of the broadcaster of the channel the message was sent from. Is null when the message happens in the same channel as the broadcaster. Is not null when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_broadcaster_user_login: string | null;
	/** The UUID that identifies the source message from the channel the message was sent from. Is null when the message happens in the same channel as the broadcaster. Is not null when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_message_id: string | null;
	/** The list of chat badges for the chatter in the channel the message was sent from. Is null when the message happens in the same channel as the broadcaster. Is not null when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
	source_badges: Badge[] | null;
	/** Determines if a message delivered during a shared chat session is only sent to the source channel. Has no effect if the message is not sent during a shared chat session. */
	is_source_only: boolean | null;
}

export interface Badge {
	/** An ID that identifies this set of chat badges. For example, Bits or Subscriber. */
	set_id: string;
	/** An ID that identifies this version of the badge. The ID can be any value. For example, for Bits, the ID is the Bits tier level, but for World of Warcraft, it could be Alliance or Horde. */
	id: string;
	/** Contains metadata related to the chat badges in the badges tag. Currently, this tag contains metadata only for subscriber badges, to indicate the number of months the user has been a subscriber. */
	info: string;
}

export type EmoteFormats = ("animated" | "static")[];

export type MessageFragment = MessageFragmentText | MessageFragmentCheermote | MessageFragmentEmote | MessageFragmentMention | MessageFragmentGif;
export interface _MessageFragment {
	/** The type of message fragment. */
	type: string;
	/** Message text in fragment. */
	text: string;
}
export interface MessageFragmentText extends _MessageFragment {
	type: "text";
}
export interface MessageFragmentCheermote extends _MessageFragment {
	type: "cheermote";
	/** Metadata pertaining to the cheermote. */
	cheermote: {
		/**
		 * The name portion of the Cheermote string that you use in chat to cheer Bits, converted to lowercase. The full Cheermote string is the concatenation of {prefix} + {number of Bits}.

		* **For example**, if the prefix is “cheer” and you want to cheer 100 Bits, the full Cheermote string is cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered.
		*/
		prefix: string;
		/** **Integer**. The amount of Bits cheered. */
		bits: number;
		/** **Integer**. The tier level of the cheermote. */
		tier: number;
	};
}
export interface MessageFragmentEmote extends _MessageFragment {
	type: "emote";
	/** Metadata pertaining to the emote. */
	emote: {
		/** An ID that uniquely identifies this emote. */
		id: string;
		/** An ID that identifies the emote set that the emote belongs to. */
		emote_set_id: string;
		/** The ID of the broadcaster who owns the emote. */
		owner_id: string;
		/**
		 * The formats that the emote is available in. For example, if the emote is available only as a static PNG, the array contains only static. But if the emote is available as a static PNG and an animated GIF, the array contains static and animated. The possible formats are: 
		 * - animated - An animated GIF is available for this emote.
		 * - static - A static PNG file is available for this emote.
		 */
		format: EmoteFormats;
	};
}
export interface MessageFragmentMention extends _MessageFragment {
	type: "mention";
	/** Metadata pertaining to the mention. */
	mention: {
		/** The user ID of the mentioned user. */
		user_id: string;
		/** The user name of the mentioned user. */
		user_name: string;
		/** The user login of the mentioned user. */
		user_login: string;
	};
}
export interface MessageFragmentGif extends _MessageFragment {
	type: "gif";
	/** Metadata pertaining to the GIF. */
	gif: {
		/** An ID that uniquely identifies this GIF. */
		id: string;
		/** The URL of the GIF asset. Applications rendering the GIF must use the full URL provided; it must not be modified. */
		url: string;
	};
}