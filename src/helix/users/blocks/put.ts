import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:manage:blocked_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the user to block. The API ignores the request if the broadcaster has already blocked the user. */
	target_user_id: string;
	/**
	 * The location where the harassment took place that is causing the brodcaster to block the user. Possible values are:
	 * - chat
	 * - whisper
	 */
	source_context?: "chat" | "whisper";
	/**
	 * The reason that the broadcaster is blocking the user. Possible values are:
	 * - harassment
	 * - spam
	 * - other
	 */
	reason?: "harassment" | "spam" | "other";
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "users/blocks",
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			target_user_id: params.target_user_id,
			source_context: params.source_context,
			reason: params.reason,
		},
		...params.config,
	};
}

/**
 * ## [Block User](https://dev.twitch.tv/docs/api/reference/#block-user)
 * Blocks the specified user from interacting with or having contact with the broadcaster. The user ID in the OAuth token identifies the broadcaster who is blocking the user.

 * To learn more about blocking users, see [Block Other Users on Twitch](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat?language=en_US#BlockWhispersandMessagesfromStrangers).

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully blocked the user.
 * 400 Bad Request|The `target_user_id` query parameter is required.
 * ㅤ|The ID in `target_user_id` cannot be the same as the user ID in the access token.
 * ㅤ|The value in `source_context` is not valid.
 * ㅤ|The value in `reason` is not valid.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:manage:blocked_users** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}