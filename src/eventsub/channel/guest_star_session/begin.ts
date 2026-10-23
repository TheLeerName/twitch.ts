import * as Main from "../../..";

/**
 * ## [channel.guest_star_session.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin)
 * Sends a notification when the host begins a new Guest Star session.

 * ### Authorization
 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.guest_star_session.begin";
	version: "beta";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.guest_star_session.begin", version: "beta", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel hosting the Guest Star Session */
	broadcaster_user_id: string;
	/** The user ID of the moderator or broadcaster of the specified channel. */
	moderator_user_id: string;
}

/**
 * ## [channel.guest_star_session.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin)
 * Sends a notification when the host begins a new Guest Star session.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.guest_star_session.begin" && message.metadata.subscription_version === "beta";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The broadcaster user ID. */
	broadcaster_user_id: string;
	/** The broadcaster display name. */
	broadcaster_user_name: string;
	/** The broadcaster login. */
	broadcaster_user_login: string;
	/** ID representing the unique session that was started. */
	session_id: string;
	/** RFC3339 timestamp indicating the time the session began. */
	started_at: string;
}