import * as Main from "../../..";
import { OutcomeWithoutPredictions } from "./begin";

/**
 * ## [channel.prediction.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress)
 * Sends a notification when users participate in a Prediction on the specified channel.

 * ### Authorization
 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.prediction.progress";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.prediction.progress", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel for which “prediction progress” notifications will be received. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.prediction.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress)
 * Sends a notification when users participate in a Prediction on the specified channel.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.prediction.progress" && message.metadata.subscription_version === "1";
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
	outcomes: Outcome[];
	/** The time the Channel Points Prediction started. */
	started_at: string;
	/** The time the Channel Points Prediction will automatically lock. */
	locks_at: string;
}

/** An outcome object for a particular Channel Points Prediction. Each Prediction’s event payload includes an outcomes array. The outcomes array contains an object that describes each outcome and, if applicable, the number of users who selected that outcome, the number of Channel Points for that outcome, and an array of {@link TopPredictor}. */
export interface Outcome extends OutcomeWithoutPredictions {
	/** **Integer**. The number of users who used Channel Points on this outcome. */
	users: number;
	/** **Integer**. The total number of Channel Points used on this outcome. */
	channel_points: number;
	/** An array of users who used the most Channel Points on this outcome. */
	top_predictors: TopPredictor[];
}

export interface TopPredictor {
	/** The ID of the user. */
	user_id: string;
	/** The login of the user. */
	user_login: string;
	/** The display name of the user. */
	user_name: string;
	/** **Integer**. The number of Channel Points won. This value is always `null` in the event payload for Prediction progress and Prediction lock. This value is 0 if the outcome did not win or if the Prediction was canceled and Channel Points were refunded. */
	channel_points_won: number | null;
	/** **Integer**. The number of Channel Points used to participate in the Prediction. */
	channel_points_used: number;
}