import * as Main from "../../..";

/**
 * ## [channel.hype_train.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin)
 * Sends a notification when a Hype Train begins on the specified channel. In addition to this event, one {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} event will be sent for each contribution that caused the Hype Train to begin. EventSub does not make strong assurances about the order of message delivery, so it is possible to receive {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} notifications before you receive the corresponding {@link Main.EventSub.ChannelHypeTrainBegin | channel.hype_train.begin} notification.

 * After the Hype Train begins, any additional cheers or subscriptions on the channel will cause {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} notifications to be sent. When the Hype Train is over, {@link Main.EventSub.ChannelHypeTrainEnd | channel.hype_train.end} is emitted.

 * ### Authorization
 * Must have `channel:read:hype_train` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.hype_train.begin";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.hype_train.begin", version: "2", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster that you want to get Hype Train begin notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.hype_train.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin)
 * Sends a notification when a Hype Train begins on the specified channel. In addition to this event, one {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} event will be sent for each contribution that caused the Hype Train to begin. EventSub does not make strong assurances about the order of message delivery, so it is possible to receive {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} notifications before you receive the corresponding {@link Main.EventSub.ChannelHypeTrainBegin | channel.hype_train.begin} notification.

 * After the Hype Train begins, any additional cheers or subscriptions on the channel will cause {@link Main.EventSub.ChannelHypeTrainProgress | channel.hype_train.progress} notifications to be sent. When the Hype Train is over, {@link Main.EventSub.ChannelHypeTrainEnd | channel.hype_train.end} is emitted.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.hype_train.begin" && message.metadata.subscription_version === "2";
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
	/** **Integer**. The all-time high level this type of Hype Train has reached for this broadcaster. */
	all_time_high_level: number;
	/** **Integer**. The all-time high total this type of Hype Train has reached for this broadcaster. */
	all_time_high_total: number;
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

/** The top contributor for a contribution type. For example, the top contributor using BITS (by aggregate) or the top contributor using subscriptions (by count). */
export interface TopContributor {
	/** The ID of the user that made the contribution. */
	user_id: string;
	/** The user’s login name. */
	user_login: string;
	/** The user’s display name. */
	user_name: string;
	/**
	 * The contribution method used. Possible values are:
	 * Value|Meaning
	 * -|-
	 * `bits`|Bits contributions with Cheering and Power-ups.
	 * `subscription`|Subscription activity like subscribing or gifting subscriptions.
	 * `other`|Covers other contribution methods not listed.
	 */
	type: string;
	/** **Integer**. The total amount contributed. If type is bits, total represents the amount of Bits used. If type is subscription, total is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
	total: number;
}

export interface SharedTrainParticipant {
	/** The ID of the broadcaster participating in the shared Hype Train. */
	broadcaster_user_id: string;
	/** The login of the broadcaster participating in the shared Hype Train. */
	broadcaster_user_login: string;
	/** The display name of the broadcaster participating in the shared Hype Train. */
	broadcaster_user_name: string;
}