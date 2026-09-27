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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose chat settings you want to get. */
	broadcaster_id: string;
	/**
	 * The ID of the broadcaster or one of the broadcaster’s moderators.

	 * This field is required only if you want to include the `non_moderator_chat_delay` and `non_moderator_chat_delay_duration` settings in the response.

	 * If you specify this field, this ID must match the user ID in the user access token.
	 */
	moderator_id?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

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
		/**
		 * A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message. See the `non_moderator_chat_delay_duration` field for the length of the delay. Is **true** if the broadcaster applies a delay; otherwise, **false**.

		 * The response includes this field only if the request specifies a user access token that includes the  **moderator:read:chat_settings** scope and the user in the `moderator_id` query parameter is one of the broadcaster’s moderators.
		 */
		non_moderator_chat_delay?: boolean;
		/**
		 * **Integer**. The amount of time, in seconds, that messages are delayed before appearing in chat. Is **null** if `non_moderator_chat_delay` is **false**.

		 * The response includes this field only if the request specifies a user access token that includes the  **moderator:read:chat_settings** scope and the user in the `moderator_id` query parameter is one of the broadcaster’s moderators.
		 */
		non_moderator_chat_delay_duration?: number;
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
		slow_mode_wait_time: number | null;
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
 * ## [Get Chat Settings](https://dev.twitch.tv/docs/api/reference/#get-chat-settings)
 * Gets the broadcaster’s chat settings.

 * For an overview of chat settings, see [Chat Commands for Broadcasters and Moderators](https://help.twitch.tv/s/article/chat-commands#AllMods) and [Moderator Preferences](https://help.twitch.tv/s/article/setting-up-moderation-for-your-twitch-channel#modpreferences).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s chat settings.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "chat/settings", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
	});
	return global.fetch(url as any, {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}