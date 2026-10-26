import * as Main from "../../..";
import { BitsVoting, ChannelPointsVoting, ChoiceWithoutVotes } from "./begin";

/**
 * ## [channel.poll.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend)
 * Sends a notification when a poll ends on the specified channel.

 * ### Authorization
 * Must have `channel:read:polls` or `channel:manage:polls` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.poll.end";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.poll.end", version: "1", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID of the channel for which “poll end” notifications will be received. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.poll.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress)
 * Sends a notification when a poll ends on the specified channel.

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
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.poll.end" && message.metadata.subscription_version === "1";
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
	/** An array of choices for the poll. Includes vote counts. */
	choices: Choice[];
	/** Not supported. */
	bits_voting: BitsVoting;
	/** The Channel Points voting settings for the poll. */
	channel_points_voting: ChannelPointsVoting;
	/** The status of the poll. Valid values are `completed`, `archived`, and `terminated`. */
	status: "completed" | "archived" | "terminated";
	/** The time the poll started. */
	started_at: string;
	/** The time the poll ended. */
	ended_at: string;
}

/** An choice for a particular poll. Each poll’s event payload includes a choices array. The choices array contains an object that describes each choice and, if applicable, the votes for that choice. */
export interface Choice extends ChoiceWithoutVotes {
	/** **Integer**. Not used; will be set to 0. */
	bits_votes: 0;
	/** **Integer**. Number of votes received via Channel Points. */
	channel_points_votes: number;
	/** **Integer**. Total number of votes received for the choice across all methods of voting. */
	votes: number;
}