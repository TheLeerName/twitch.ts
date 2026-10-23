import * as Main from "../../..";

/**
 * ## [channel.moderator.remove](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove)
 * Sends a notification when a user has moderator privileges removed on a specified channel.

 * ### Authorization
 * Must have `moderation:read` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.moderator.remove";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.moderator.remove", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get moderator removal notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.moderator.remove](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove)
 * Sends a notification when a user has moderator privileges removed on a specified channel.

 * ### Authorization
 * Must have `moderation:read` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.moderator.remove" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** The user ID of the removed moderator. */
	user_id: string;
	/** The user login of the removed moderator. */
	user_login: string;
	/** The display name of the removed moderator. */
	user_name: string;
}