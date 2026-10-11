import * as Main from "../../..";
import { MessageFragment } from "../../channel/chat";

/**
 * ## [automod.message.update V2](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate-v2)
 * The `automod.message.update` subscription type sends notification when a message in the automod queue has its status changed. Only public blocked terms trigger notifications, not private ones.

 * ### Authorization
 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.

 * The moderator must be a moderator or broadcaster for the specified broadcaster.
 */
export interface RequestBody extends Main.EventSub.RequestBody.Subscription {
	type: "automod.message.update";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}

export interface Condition {
	/** User ID of the broadcaster (channel). */
	broadcaster_user_id: string;
	/** User ID of the moderator. */
	moderator_user_id: string;
}

/**
 * ## [automod.message.update V2](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate-v2)
 * The `automod.message.update` subscription type sends notification when a message in the automod queue has its status changed. Only public blocked terms trigger notifications, not private ones.

 * ### Authorization
 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.

 * The moderator must be a moderator or broadcaster for the specified broadcaster.
 */
export interface ResponseBody {
	subscription: ResponseBody.Subscription;
	event: ResponseBody.Event;
}
export namespace ResponseBody {
	export type Subscription = Main.EventSub.ResponseBody.Subscription<RequestBody>;

	export type Event = Event.Automod | Event.BlockedTermOrLink;
	export namespace Event {
		export interface Base {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The message sender’s user ID. */
			user_id: string;
			/** The message sender’s login name. */
			user_login: string;
			/** The message sender’s display name. */
			user_name: string;
			/** The ID of the moderator. */
			moderator_user_id: string;
			/** TThe moderator’s user name. */
			moderator_user_name: string;
			/** The login of the moderator. */
			moderator_user_login: string;
			/** The ID of the message that was flagged by automod. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Metadata surrounding the potential inappropriate fragments of the message. */
				fragments: MessageFragment[];
			};
			/** The message’s status. */
			status: "Approved" | "Denied" | "Expired";
			/** The timestamp of when automod saved the message. */
			held_at: string;
			/** The reason why the message was caught. */
			reason: string;
		}
		export interface Automod extends Base {
			reason: "automod";
			/** If the message was caught by automod, this will be populated. */
			automod: {
				/** The category of the caught message. */
				category: string;
				/** **Integer**. The level of severity (1-4). */
				level: 1 | 2 | 3 | 4;
				/** The bounds of the text that caused the message to be caught. */
				boundaries: TextBoundary[];
			};
		}
		export interface BlockedTermOrLink extends Base {
			reason: "blocked_term" | "blocked_link";
			/** If the message was caught due to a blocked term or a blocked link, this will be populated. */
			blocked_term: {
				/** The list of blocked terms found in the message. */
				terms_found: {
					/** The id of the blocked term found. */
					term_id: string;
					/** The bounds of the text that caused the message to be caught. */
					boundary: TextBoundary;
					/** The id of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_id: string;
					/** The login of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_login: string;
					/** The username of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_name: string;
				}[];
			};
		}

		export interface TextBoundary {
			/** **Integer**. Index in the message for the start of the problem (0 indexed, inclusive). */
			start_pos: number;
			/** **Integer**. Index in the message for the end of the problem (0 indexed, inclusive). */
			end_pos: number;
		}
	}
}