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
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:chat_messages` and `user:bot` (for the user represented by the `moderator_id`) or `channel:bot` (for the user represented by the `broadcaster_id`). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
	/** The ID of the message to unpin. */
	message_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Unpin Chat Message](https://dev.twitch.tv/docs/api/reference/#unpin-chat-message)
 * **NEW** Unpins a pinned chat message from the specified broadcaster’s chat room.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully unpinned the message.
 * 400 Bad Request|A required query parameter is missing.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * ㅤ|The access token must include the **moderator:manage:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to unpin messages in this channel.
 * 404 Not Found|The specified pinned message was not found.
 * 429 Too Many Requests|The rate limit for unpinning messages has been exceeded.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "chat/pins", Main.Options.apiHelixPath);
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