import * as Main from "../..";

/**
 * ## [channel.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate)
 * Sends a notification when any user sends a message to a channel’s chat room.

 * ### Authorization
 * No authorization required.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.update";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.update", version: "2", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get updates for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate)
 * Sends a notification when any user sends a message to a channel’s chat room.

 * ### Authorization
 * No authorization required.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.update" && message.metadata.subscription_version === "2";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The broadcaster’s user ID. */
	broadcaster_user_id: string;
	/** The broadcaster’s user login. */
	broadcaster_user_login: string;
	/** The broadcaster’s user display name. */
	broadcaster_user_name: string;
	/** The channel’s stream title. */
	title: string;
	/** The channel’s broadcast language. */
	language: string;
	/** The channel’s category ID. */
	category_id: string;
	/** The category name. */
	category_name: string;
	/** Array of content classification label IDs currently applied on the Channel. To retrieve a list of all possible IDs, use the {@link Main.Helix.GetContentClassificationLabels | Get Content Classification Labels} API endpoint. */
	content_classification_labels: string[];
}