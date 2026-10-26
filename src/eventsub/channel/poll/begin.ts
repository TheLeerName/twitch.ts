import * as Main from "../../..";

/**
 * ## [channel.poll.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin)
 * Sends a notification when a poll begins on the specified channel.

 * ### Authorization
 * Must have `channel:read:polls` or `channel:manage:polls` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.poll.begin";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.poll.begin", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel for which “poll begin” notifications will be received. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.poll.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin)
 * Sends a notification when a poll begins on the specified channel.

 * ### Authorization
 * Must have `channel:read:polls` or `channel:manage:polls` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.poll.begin" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** ID of the poll. */
	id: string;
	/** The requested broadcaster ID. */
	broadcaster_user_id: string;
	/** The requested broadcaster login. */
	broadcaster_user_login: string;
	/** The requested broadcaster display name. */
	broadcaster_user_name: string;
	/** Question displayed for the poll. */
	title: string;
	/** An array of choices for the poll. */
	choices: ChoiceWithoutVotes[];
	/** Not supported. */
	bits_voting: BitsVoting;
	/** The Channel Points voting settings for the poll. */
	channel_points_voting: ChannelPointsVoting;
	/** The time the poll started. */
	started_at: string;
	/** The time the poll will end. */
	ends_at: string;
}

/** An choice for a particular poll. Each poll’s event payload includes a choices array. The choices array contains an object that describes each choice and, if applicable, the votes for that choice. */
export interface ChoiceWithoutVotes {
	/** ID for the choice. */
	id: string;
	/** Text displayed for the choice. */
	title: string;
}

/** **NOTE**: Bits voting is not supported. */
export interface BitsVoting {
	/** Not used; will be set to `false`. */
	is_enabled: false;
	/** **Integer**. Not used; will be set to 0. */
	amount_per_vote: 0;
}


export interface ChannelPointsVoting {
	/** Indicates if Channel Points can be used for voting. */
	is_enabled: boolean;
	/** **Integer**. Number of Channel Points required to vote once with Channel Points. */
	amount_per_vote: 0;
}