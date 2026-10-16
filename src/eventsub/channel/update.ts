import * as Main from "../..";

/**
 * ## [channel.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate)
 * Sends a notification when any user sends a message to a channel’s chat room.

 * ### Authorization
 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface RequestBody extends Main.EventSub.RequestBody.Subscription {
	type: "channel.update";
	version: "2";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.update", version: "2", condition, transport};
}

export interface Condition {
	/** The broadcaster user ID for the channel you want to get updates for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.chat.message](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage)
 * Sends a notification when any user sends a message to a channel’s chat room.

 * ### Authorization
 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
 */
export interface ResponseBody {
	subscription: ResponseBodySubscription;
	event: ResponseBodyEvent;
}
export type ResponseBodySubscription = Main.EventSub.ResponseBody.Subscription<RequestBody>;
export interface ResponseBodyEvent {
	/** The broadcaster’s user ID. */
	broadcaster_user_id: string;
	/** The broadcaster’s user login. */
	broadcaster_user_login: string;
	/** The broadcaster’s user display name. */
	broadcaster_user_name: string;
	/** The channel’s stream title. */
	title: string;
	/** The channel’s broadcast language. */
	language: string;
	/** The channel’s category ID. */
	category_id: string;
	/** The category name. */
	category_name: string;
	/** Array of content classification label IDs currently applied on the Channel. To retrieve a list of all possible IDs, use the {@link Main.Helix.GetContentClassificationLabels | Get Content Classification Labels} API endpoint. */
	content_classification_labels: string[];
}