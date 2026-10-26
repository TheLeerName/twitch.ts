import * as Main from "../..";

/**
 * ## [stream.online](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline)
 * Sends a notification when the specified broadcaster starts a stream.

 * ### Authorization
 * No authorization required.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "stream.online";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "stream.online", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID you want to get stream online notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [stream.online](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline)
 * Sends a notification when the specified broadcaster starts a stream.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "stream.online" && message.metadata.subscription_version === "1";
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
	/** The stream type. Valid values are: `live`, `playlist`, `watch_party`, `premiere`, `rerun`. */
	type: "live" | "playlist" | "watch_party" | "premiere" | "rerun";
	/** The timestamp at which the stream went online at. */
	started_at: string;
}