import * as Main from "../..";

/**
 * ## [channel.ban](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban)
 * Sends a notification when a viewer is timed out or banned from the specified channel.

 * ### Authorization
 * Must have `channel:moderate` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.ban";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.ban", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get ban notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.ban](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban)
 * Sends a notification when a viewer is timed out or banned from the specified channel.

 * ### Authorization
 * Must have `channel:moderate` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.ban" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventPermanent | PayloadEventTimeout;
export interface _PayloadEvent {
	/** The user ID for the user who was banned on the specified channel. */
	user_id: string;
	/** The user login for the user who was banned on the specified channel. */
	user_login: string;
	/** The user display name for the user who was banned on the specified channel. */
	user_name: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** The user ID of the issuer of the ban. */
	moderator_user_id: string;
	/** The user login of the issuer of the ban. */
	moderator_user_login: string;
	/** The user name of the issuer of the ban. */
	moderator_user_name: string;
	/** The reason behind the ban. */
	reason: string;
	/** The UTC date and time (in RFC3339 format) of when the user was banned or put in a timeout. */
	banned_at: string;
	/** The UTC date and time (in RFC3339 format) of when the timeout ends. Is `null` if the user was banned instead of put in a timeout. */
	ends_at: string | null;
	/** Indicates whether the ban is permanent (`true`) or a timeout (`false`). If `true`, `ends_at` will be `null`. */
	is_permanent: boolean;
}

export interface PayloadEventPermanent extends _PayloadEvent {
	is_permanent: true;
	ends_at: null;
}
export interface PayloadEventTimeout extends _PayloadEvent {
	is_permanent: false;
	ends_at: string;
}