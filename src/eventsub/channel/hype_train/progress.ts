import * as Main from "../../..";
import { SharedTrainParticipant, TopContributor } from "./begin";

/**
 * ## [channel.hype_train.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress)
 * Sends a notification when a Hype Train makes progress on the specified channel. These notifications are sent periodically while a Hype Train is making progress. EventSub does not make strong assurances about the order of message delivery, so it is possible to receive channel {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} before you receive the corresponding {@link Main.EventSub.ChannelHypeTrainBegin | channel.hype_train.begin}.

 * When the Hype Train is over, {@link Main.EventSub.ChannelHypeTrainEnd | channel.hype_train.end} is emitted.

 * ### Authorization
 * Must have `channel:read:hype_train` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.hype_train.progress";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.hype_train.progress", version: "2", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster that you want to get Hype Train progress notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.hype_train.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress)
 * Sends a notification when a Hype Train makes progress on the specified channel. These notifications are sent periodically while a Hype Train is making progress. EventSub does not make strong assurances about the order of message delivery, so it is possible to receive channel {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} before you receive the corresponding {@link Main.EventSub.ChannelHypeTrainBegin | channel.hype_train.begin}.

 * When the Hype Train is over, {@link Main.EventSub.ChannelHypeTrainEnd | channel.hype_train.end} is emitted.

 * ### Authorization
 * Must have `channel:read:hype_train` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.hype_train.progress" && message.metadata.subscription_version === "2";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export type PayloadEvent = PayloadEventSharedTrain | PayloadEventNotSharedTrain;
export interface _PayloadEvent {
	/** The Hype Train ID. */
	id: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** **Integer**. Total points contributed to the Hype Train. */
	total: number;
	/** **Integer**. The number of points contributed to the Hype Train at the current level. */
	progress: number;
	/** **Integer**. The number of points required to reach the next level. */
	goal: number;
	/** The contributors with the most points contributed. */
	top_contributions: TopContributor[];
	/** **Integer**. The current level of the Hype Train. */
	level: number;
	/** Optional. Not `null` for a shared Hype Train. Contains the list of broadcasters in the shared Hype Train. */
	shared_train_participants: SharedTrainParticipant[] | null;
	/** The time when the Hype Train started. */
	started_at: string;
	/** The time when the Hype Train expires. The expiration is extended when the Hype Train reaches a new level. */
	expires_at: string;
	/** The type of the Hype Train. Possible values are: `treasure`, `golden_kappa`, `regular` */
	type: "treasure" | "golden_kappa" | "regular";
	/** Indicates if the Hype Train is shared. When `true`, {@link shared_train_participants} will contain the list of broadcasters the train is shared with. */
	is_shared_train: boolean;
}

export interface PayloadEventSharedTrain extends _PayloadEvent {
	is_shared_train: true;
	shared_train_participants: SharedTrainParticipant[];
}
export interface PayloadEventNotSharedTrain extends _PayloadEvent {
	is_shared_train: false;
	shared_train_participants: null;
}