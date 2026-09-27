import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:chat_settings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:chat_settings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose chat settings you want to update. */
	broadcaster_id: string;
	/** The ID of a user that has permission to moderate the broadcaster’s chat room, or the broadcaster’s ID if they’re making the update. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

/**
 * All fields are optional. Specify only those fields that you want to update.

 * To set the `slow_mode_wait_time` or `follower_mode_duration` field to its default value, set the corresponding `slow_mode` or `follower_mode` field to **true** (and don’t include the `slow_mode_wait_time` or `f`ollower_mode_duration` field).

 * To set the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field’s value, you must set the corresponding `slow_mode`, `follower_mode`, or `non_moderator_chat_delay` field to **true**.

 * To remove the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field’s value, set the corresponding `slow_mode`, `follower_mode`, or `non_moderator_chat_delay` field to **false** (and don’t include the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field).
 */
export interface RequestBody {
	/**
	 * A Boolean value that determines whether chat messages must contain only emotes.

	 * Set to **true** if only emotes are allowed; otherwise, **false**. The default is **false**.
	 */
	emote_mode?: boolean;
	/**
	 * A Boolean value that determines whether the broadcaster restricts the chat room to followers only.

	 * Set to **true** if the broadcaster restricts the chat room to followers only; otherwise, **false**. The default is **true**.

	 * To specify how long users must follow the broadcaster before being able to participate in the chat room, see the `follower_mode_duration` field.
	 */
	follower_mode?: boolean;
	/** **Integer**. The length of time, in minutes, that users must follow the broadcaster before being able to participate in the chat room. Set only if `follower_mode` is **true**. Possible values are: 0 (no restriction) through 129600 (3 months). The default is 0. */
	follower_mode_duration?: number;
	/**
	 * A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message.

	 * Set to **true** if the broadcaster applies a delay; otherwise, **false**. The default is **false**.

	 * To specify the length of the delay, see the `non_moderator_chat_delay_duration` field.
	 */
	non_moderator_chat_delay?: boolean;
	/**
	 * **Integer**. The amount of time, in seconds, that messages are delayed before appearing in chat. Set only if `non_moderator_chat_delay` is **true**. Possible values are:
	 * - 2  —  2 second delay (recommended)
	 * - 4  —  4 second delay
	 * - 6  —  6 second delay
	 */
	non_moderator_chat_delay_duration?: 2 | 4 | 6;
	/**
	 * A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Set to **true** if the broadcaster applies a wait period between messages; otherwise, **false**. The default is **false**.

	 * To specify the delay, see the `slow_mode_wait_time` field.
	 */
	slow_mode?: boolean;
	/**
	 * **Integer**. The amount of time, in seconds, that users must wait between sending messages. Set only if `slow_mode` is **true**.

	 * Possible values are: 3 (3 second delay) through 120 (2 minute delay). The default is 30 seconds.
	 */
	slow_mode_wait_time?: number;
	/**
	 * A Boolean value that determines whether only users that subscribe to the broadcaster’s channel may talk in the chat room.

	 * Set to **true** if the broadcaster restricts the chat room to subscribers only; otherwise, **false**. The default is **false**.
	 */
	subscriber_mode?: boolean;
	/**
	 * A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room.

	 * Set to **true** if the broadcaster allows only unique messages; otherwise, **false**. The default is **false**.
	 */
	unique_chat_mode?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** The list of chat settings. The list contains a single object with all the settings. */
	data: [{
		/** The ID of the broadcaster specified in the request. */
		broadcaster_id: string;
		/** A Boolean value that determines whether chat messages must contain only emotes. Is **true** if chat messages may contain only emotes; otherwise, **false**. */
		emote_mode: boolean;
		/**
		 * A Boolean value that determines whether the broadcaster restricts the chat room to followers only.

		 * Is **true** if the broadcaster restricts the chat room to followers only; otherwise, **false**.

		 * See the `follower_mode_duration` field for how long users must follow the broadcaster before being able to participate in the chat room.
		 */
		follower_mode: boolean;
		/** **Integer**. The length of time, in minutes, that users must follow the broadcaster before being able to participate in the chat room. Is **null** if `follower_mode` is **false**. */
		follower_mode_duration: number | null;
		/** The moderator’s ID. The response includes this field only if the request specifies a user access token that includes the  **moderator:read:chat_settings** scope. */
		moderator_id?: string;
		/** A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message. See the `non_moderator_chat_delay_duration` field for the length of the delay. Is **true** if the broadcaster applies a delay; otherwise, **false**. */
		non_moderator_chat_delay: boolean;
		/** **Integer**. The amount of time, in seconds, that messages are delayed before appearing in chat. Is **null** if `non_moderator_chat_delay` is **false**. */
		non_moderator_chat_delay_duration: number | null;
		/**
		 * A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages.

		 * Is **true** if the broadcaster applies a delay; otherwise, **false**.

		 * See the `slow_mode_wait_time` field for the delay.
		 */
		slow_mode: boolean;
		/**
		 * **Integer**. The amount of time, in seconds, that users must wait between sending messages.

		 * Is **null** if slow_mode is **false**.
		 */
		slow_mode_wait_time: number;
		/**
		 * A Boolean value that determines whether only users that subscribe to the broadcaster’s channel may talk in the chat room.

		 * Is **true** if the broadcaster restricts the chat room to subscribers only; otherwise, **false**.
		 */
		subscriber_mode: boolean;
		/**
		 * A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room.

		 * Is **true** if the broadcaster requires unique messages only; otherwise, **false**.
		 */
		unique_chat_mode: boolean;
	}];
}

/**
 * ## [Update Chat Settings](https://dev.twitch.tv/docs/api/reference/#update-chat-settings)
 * Updates the broadcaster’s chat settings.
 * 
 * ### Request Body
 * All fields are optional. Specify only those fields that you want to update.

 * To set the `slow_mode_wait_time` or `follower_mode_duration` field to its default value, set the corresponding `slow_mode` or `follower_mode` field to **true** (and don’t include the `slow_mode_wait_time` or `f`ollower_mode_duration` field).

 * To set the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field’s value, you must set the corresponding `slow_mode`, `follower_mode`, or `non_moderator_chat_delay` field to **true**.

 * To remove the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field’s value, set the corresponding `slow_mode`, `follower_mode`, or `non_moderator_chat_delay` field to **false** (and don’t include the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the broadcaster’s chat settings.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|If `slow_mode` is **true**, the `slow_mode_wait_time` field must be set to a valid value.
 * ㅤ|If `follower_mode` is **true**, the `follower_mode_duration` field must be set to a valid value.
 * ㅤ|If `non_moderator_chat_delay` is **true**, the `non_moderator_chat_delay_duration` field must be set to a valid value.
 * 401 Unauthorized|The ID in the `moderator_id` query parameter must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:chat_settings** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 403 Forbidden|The user in the `moderator_id` query parameter must have moderator privileges in the broadcaster's channel.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "chat/settings", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
	});
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			emote_mode: params.emote_mode,
			follower_mode: params.follower_mode,
			follower_mode_duration: params.follower_mode_duration,
			non_moderator_chat_delay: params.non_moderator_chat_delay,
			non_moderator_chat_delay_duration: params.non_moderator_chat_delay_duration,
			slow_mode: params.slow_mode,
			slow_mode_wait_time: params.slow_mode_wait_time,
			subscriber_mode: params.subscriber_mode,
			unique_chat_mode: params.unique_chat_mode,
		}),
	});
}