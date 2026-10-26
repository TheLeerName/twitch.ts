import * as Main from "../..";

/**
 * ## [stream.offline](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline)
 * Sends a notification when the specified broadcaster stops a stream.

 * ### Authorization
 * No authorization required.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "stream.offline";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "stream.offline", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID you want to get stream offline notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [stream.offline](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline)
 * Sends a notification when the specified broadcaster stops a stream.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "stream.offline" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The id of the stream. */
	id: string;
	/** The broadcaster’s user id. */
	broadcaster_user_id: string;
	/** The broadcaster’s user login. */
	broadcaster_user_login: string;
	/** The broadcaster’s user display name. */
	broadcaster_user_name: string;
}