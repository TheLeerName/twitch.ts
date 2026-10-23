import * as Main from "../../..";

/**
 * ## [channel.chat_settings.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate)
 * Sends a notification when a broadcaster’s chat settings are updated.

 * ### Authorization
 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.chat_settings.update";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.chat_settings.update", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the channel to receive chat settings update events for. */
	broadcaster_user_id: string;
	/** The user ID to read chat as. */
	user_id: string;
}

/**
 * ## [channel.chat_settings.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate)
 * Sends a notification when a broadcaster’s chat settings are updated.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.chat_settings.update" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = _PayloadEvent & PayloadEventFollowerMode & PayloadEventSlowMode;
export interface _PayloadEvent {
	/** The ID of the broadcaster specified in the request. */
	broadcaster_user_id: string;
	/** The login of the broadcaster specified in the request. */
	broadcaster_user_login: string;
	/** The user name of the broadcaster specified in the request. */
	broadcaster_user_name: string;
	/** A Boolean value that determines whether chat messages must contain only emotes. Is `true` if only messages that are 100% emotes are allowed; otherwise `false`. */
	emote_mode: boolean;
	/** A Boolean value that determines whether only users that subscribe to the broadcaster’s channel can talk in the chat room. Is `true` if the broadcaster restricts the chat room to subscribers only; otherwise `false`. */
	subscriber_mode: boolean;
	/** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room. Is `true` if the broadcaster requires unique messages only; otherwise `false`. */
	unique_chat_mode: boolean;
}

export type PayloadEventFollowerMode = PayloadEventFollowerModeOn | PayloadEventFollowerModeOff;
export interface _PayloadEventFollowerMode {
	/**
	 * A Boolean value that determines whether the broadcaster restricts the chat room to followers only, based on how long they’ve followed. Is `true` if the broadcaster restricts the chat room to followers only; otherwise `false`.

	 * See {@link follower_mode_duration_minutes} for how long the followers must have followed the broadcaster to participate in the chat room.
	 */
	follower_mode: boolean;
	/**
	 * **Integer**. The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat room. See {@link follower_mode}.

	 * Is `null` if `follower_mode` is `false`.
	 */
	follower_mode_duration_minutes: number | null;
}
export interface PayloadEventFollowerModeOn extends _PayloadEventFollowerMode {
	follower_mode: true;
	follower_mode_duration_minutes: number;
}
export interface PayloadEventFollowerModeOff extends _PayloadEventFollowerMode {
	follower_mode: false;
	follower_mode_duration_minutes: null;
}

export type PayloadEventSlowMode = PayloadEventSlowModeOn | PayloadEventSlowModeOff;
export interface _PayloadEventSlowMode {
	/**
	 * A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Is `true`, if the broadcaster applies a delay; otherwise, `false`.

	 * See {@link slow_mode_wait_time_seconds} for the delay.
	 */
	slow_mode: boolean;
	/**
	 * **Integer**. The amount of time, in seconds, that users need to wait between sending messages. See {@link slow_mode}.

	 * Is `null` if `slow_mode` is `false`.
	 */
	slow_mode_wait_time_seconds: number | null;
}
export interface PayloadEventSlowModeOn extends _PayloadEventSlowMode {
	slow_mode: true;
	slow_mode_wait_time_seconds: number;
}
export interface PayloadEventSlowModeOff extends _PayloadEventSlowMode {
	slow_mode: false;
	slow_mode_wait_time_seconds: null;
}