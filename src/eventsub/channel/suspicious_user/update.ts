import * as Main from "../../..";

/**
 * ## [channel.suspicious_user.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate)
 * Sends a notification when a suspicious user has been updated.

 * ### Authorization
 * Requires the `moderator:read:suspicious_users` scope.

 * If you use webhooks, the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type.

 * If you use WebSockets, the ID in `moderator_user_id` must match the user ID in the user access token.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.suspicious_user.update";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.suspicious_user.update", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of a user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
	moderator_user_id: string;
	/** The broadcaster you want to get chat unban request notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.suspicious_user.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate)
 * Sends a notification when a suspicious user has been updated.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.suspicious_user.update" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the channel where the treatment for a suspicious user was updated. */
	broadcaster_user_id: string;
	/** The display name of the channel where the treatment for a suspicious user was updated. */
	broadcaster_user_name: string;
	/** The Login of the channel where the treatment for a suspicious user was updated. */
	broadcaster_user_login: string;
	/** The ID of the moderator that updated the treatment for a suspicious user. */
	moderator_user_id: string;
	/** The display name of the moderator that updated the treatment for a suspicious user. */
	moderator_user_name: string;
	/** The login of the moderator that updated the treatment for a suspicious user. */
	moderator_user_login: string;
	/** The ID of the suspicious user whose treatment was updated. */
	user_id: string;
	/** The display name of the suspicious user whose treatment was updated. */
	user_name: string;
	/** The login of the suspicious user whose treatment was updated. */
	user_login: string;
	/** The status set for the suspicious user. Can be the following: `none`, `active_monitoring`, or `restricted`. */
	low_trust_status: "none" | "active_monitoring" | "restricted";
}