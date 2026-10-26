import * as Main from "../../..";

/**
 * ## [user.whisper.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage)
 * Sends a notification when a user receives a whisper. Event Triggers - Anyone whispers the specified user.

 * ### Authorization
 * Must have oauth scope `user:read:whispers` or `user:manage:whispers`.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "user.whisper.message";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "user.whisper.message", version: "1", condition, transport};
}

export interface Condition {
	/** The user_id of the person receiving whispers. */
	user_id: string;
}

/**
 * ## [user.whisper.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage)
 * Sends a notification when a user receives a whisper. Event Triggers - Anyone whispers the specified user.

 * ### Authorization
 * Must have oauth scope `user:read:whispers` or `user:manage:whispers`.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "user.whisper.message" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the user sending the message. */
	from_user_id: string;
	/** The name of the user sending the message. */
	from_user_name: string;
	/** The login of the user sending the message. */
	from_user_login: string;
	/** The ID of the user receiving the message. */
	to_user_id: string;
	/** The name of the user receiving the message. */
	to_user_name: string;
	/** The login of the user receiving the message. */
	to_user_login: string;
	/** The whisper ID. */
	whisper_id: string;
	/** Object containing whisper information. */
	whisper: {
		/** The body of the whisper message. */
		text: string;
	};
}