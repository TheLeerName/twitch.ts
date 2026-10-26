import * as Main from "../../..";
import { MessageFragment } from "../chat/message";

/**
 * ## [channel.suspicious_user.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage)
 * Sends a notification when a chat message has been sent from a suspicious user.

 * ### Authorization
 * Requires the `moderator:read:suspicious_users` scope.

 * If you use webhooks, the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type.

 * If you use WebSockets, the ID in `moderator_user_id` must match the user ID in the user access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.suspicious_user.message";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.suspicious_user.message", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of a user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
	moderator_user_id: string;
	/** User ID of the channel to receive chat message events for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.suspicious_user.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage)
 * Sends a notification when a chat message has been sent from a suspicious user.

 * ### Authorization
 * Requires the `moderator:read:suspicious_users` scope.

 * If you use webhooks, the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type.

 * If you use WebSockets, the ID in `moderator_user_id` must match the user ID in the user access token.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.suspicious_user.message" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the channel where the treatment for a suspicious user was updated. */
	broadcaster_user_id: string;
	/** The display name of the channel where the treatment for a suspicious user was updated. */
	broadcaster_user_name: string;
	/** The login of the channel where the treatment for a suspicious user was updated. */
	broadcaster_user_login: string;
	/** The user ID of the user that sent the message. */
	user_id: string;
	/** The user name of the user that sent the message. */
	user_name: string;
	/** The user login of the user that sent the message. */
	user_login: string;
	/** The status set for the suspicious user. Can be the following: `none`, `active_monitoring`, or `restricted`. */
	low_trust_status: "none" | "active_monitoring" | "restricted";
	/** A list of channel IDs where the suspicious user is also banned. */
	shared_ban_channel_ids: string[];
	/** User types (if any) that apply to the suspicious user, can be `manually_added`, `ban_evader`, or `banned_in_shared_channel`. */
	types: ("manually_added" | "ban_evader" | "banned_in_shared_channel")[];
	/** A ban evasion likelihood value (if any) that as been applied to the user automatically by Twitch, can be `unknown`, `possible`, or `likely`. */
	ban_evasion_evaluation: "unknown" | "possible" | "likely";
	/** The structured chat message. */
	message: {
		/** The UUID that identifies the message. */
		message_id: string;
		/** The chat message in plain text. */
		text: string;
		/** Ordered list of chat message fragments. */
		fragments: MessageFragment[];
	};
}