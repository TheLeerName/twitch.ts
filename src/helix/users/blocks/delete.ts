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
	/** The ID of the user to remove from the broadcaster’s list of blocked users. The API ignores the request if the broadcaster hasn’t blocked the user. */
	target_user_id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "users/blocks",
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			target_user_id: params.target_user_id,
		},
		...params.config,
	};
}

/**
 * ## [Unblock User](https://dev.twitch.tv/docs/api/reference/#unblock-user)
 * Removes the user from the broadcaster’s list of blocked users. The user ID in the OAuth token identifies the broadcaster who’s removing the block.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully removed the block.
 * 400 Bad Request|The `target_user_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:read:blocked_users** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}