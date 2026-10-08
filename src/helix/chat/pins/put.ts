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

export interface RequestQueryParameters {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
	/** The ID of the message to pin. */
	message_id: string;
	/** **Integer**. The number of seconds the message should be pinned for. Minimum: 30. Maximum: 1800. If not specified, the message will be pinned until the stream ends. */
	duration_seconds?: number;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "chat/pins",
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			message_id: params.message_id,
			duration_seconds: params.duration_seconds,
		},
		...params.config,
	};
}

/**
 * ## [Pin Chat Message](https://dev.twitch.tv/docs/api/reference/#pin-chat-message)
 * Pins a chat message to the top of the specified broadcaster’s chat room. Only one mod-pinned message can be active per channel at a time. If a mod-pinned message already exists, it is automatically replaced.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully pinned the message.
 * 400 Bad Request|A required query parameter is missing or invalid.
 * ㅤ|The `duration_seconds` value is invalid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * ㅤ|The access token must include the **moderator:manage:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to pin messages in this channel.
 * 404 Not Found|The specified message was not found.
 * 409 Conflict|The message is already pinned.
 * 429 Too Many Requests|The rate limit for pinning messages has been exceeded.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}