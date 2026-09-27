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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:chat_messages`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:chat_messages`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the chat room to remove messages from. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/**
	 * The ID of the message to remove. The `id` tag in the [PRIVMSG](https://dev.twitch.tv/docs/irc/tags#privmsg-tags) tag contains the message’s ID. Restrictions:
	 * - The message must have been created within the last 6 hours.
	 * - The message must not belong to the broadcaster.
	 * - The message must not belong to another moderator.If not specified, the request removes all messages in the broadcaster’s chat room.
	 */
	message_id?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Delete Chat Messages](https://dev.twitch.tv/docs/api/reference/#delete-chat-messages)
 * Removes a single chat message or all chat messages from the broadcaster’s chat room.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully removed the specified messages.
 * 400 Bad Request|You may not delete another moderator's messages.
 * ㅤ|You may not delete the broadcaster's messages.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token is missing the **moderator:manage:chat_messages** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 * 404 Not Found|The ID in `message_id` was not found.
 * ㅤ|The specified message was created more than 6 hours ago.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	const url = new Main.URL(params.apiPath ?? "moderation/chat", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
		message_id: params.message_id,
	});
	return global.fetch(url as any, {
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}