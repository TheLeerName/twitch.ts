import * as Main from "../../..";
import { Participant } from "./begin";

/**
 * ## [channel.shared_chat.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend)
 * Sends a notification when a channel leaves a shared chat session or the session ends.

 * ### Authorization
 * No authorization required.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.shared_chat.end";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.shared_chat.end", version: "1", condition, transport};
}

export interface Condition {
	/** The User ID of the channel to receive shared chat session end events for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.shared_chat.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend)
 * Sends a notification when a channel leaves a shared chat session or the session ends.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.shared_chat.end" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The unique identifier for the shared chat session. */
	session_id: string;
	/** The User ID of the channel in the subscription condition which is no longer active in the shared chat session. */
	broadcaster_user_id: string;
	/** The display name of the channel in the subscription condition which is no longer active in the shared chat session. */
	broadcaster_user_name: string;
	/** The user login of the channel in the subscription condition which is no longer active in the shared chat session. */
	broadcaster_user_login: string;
	/** The User ID of the host channel. */
	host_broadcaster_user_id: string;
	/** The display name of the host channel. */
	host_broadcaster_user_name: string;
	/** The user login of the host channel. */
	host_broadcaster_user_login: string;
}