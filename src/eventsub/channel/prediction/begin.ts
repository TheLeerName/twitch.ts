import * as Main from "../../..";

/**
 * ## [channel.prediction.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin)
 * Sends a notification when a Prediction begins on the specified channel.

 * ### Authorization
 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.prediction.begin";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.prediction.begin", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel for which “prediction begin” notifications will be received. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.prediction.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin)
 * Sends a notification when a Prediction begins on the specified channel.

 * ### Authorization
 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.prediction.begin" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** Channel Points Prediction ID. */
	id: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** Title for the Channel Points Prediction. */
	title: string;
	/** An array of outcomes for the Channel Points Prediction. */
	outcomes: OutcomeWithoutPredictions[];
	/** The time the Channel Points Prediction started. */
	started_at: string;
	/** The time the Channel Points Prediction will automatically lock. */
	locks_at: string;
}

/** An outcome object for a particular Channel Points Prediction. Each Prediction’s event payload includes an outcomes array. The outcomes array contains an object that describes each outcome. */
export interface OutcomeWithoutPredictions {
	/** The outcome ID. */
	id: string;
	/** The outcome title. */
	title: string;
	/** The color for the outcome. Valid values are pink and blue. */
	color: "pink" | "blue";
}