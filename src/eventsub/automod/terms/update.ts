import * as Main from "../../..";

/**
 * ## [automod.terms.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate)
 * Sends a notification when a broadcaster’s automod terms are updated. Changes to private terms are not sent.

 * ### Authorization
 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.

 * The moderator must be a moderator or broadcaster for the specified broadcaster.
 */
export interface RequestBody extends Main.EventSub.RequestBody.Subscription {
	type: "automod.terms.update";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "automod.terms.update", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the broadcaster (channel). */
	broadcaster_user_id: string;
	/** User ID of the moderator. */
	moderator_user_id: string;
}

/**
 * ## [automod.terms.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate)
 * Sends a notification when a broadcaster’s automod terms are updated. Changes to private terms are not sent.

 * ### Authorization
 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.

 * The moderator must be a moderator or broadcaster for the specified broadcaster.
 */
export interface ResponseBody {
	subscription: ResponseBodySubscription;
	event: ResponseBodyEvent;
}
export type ResponseBodySubscription = Main.EventSub.ResponseBody.Subscription<RequestBody>;
export interface ResponseBodyEvent {
	/** The ID of the broadcaster specified in the request. */
	broadcaster_user_id: string;
	/** The login of the broadcaster specified in the request. */
	broadcaster_user_login: string;
	/** The user name of the broadcaster specified in the request. */
	broadcaster_user_name: string;
	/** The ID of the moderator who changed the channel settings. */
	moderator_user_id: string;
	/** The moderator’s login. */
	moderator_user_login: string;
	/** The moderator’s user name. */
	moderator_user_name: string;
	/**
	 * The status change applied to the terms. Possible options are: 
	 * - add_permitted
	 * - remove_permitted
	 * - add_blocked
	 * - remove_blocked
	 */
	action: "add_permitted" | "remove_permitted" | "add_blocked" | "remove_blocked";
	/** Indicates whether this term was added due to an Automod message approve/deny action. */
	from_automod: boolean;
	/** The list of terms that had a status change. */
	terms: string[];
}