import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:manage:guest_star` or `moderator:manage:guest_star`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster running the Guest Star session. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the `user_id` in the user access token. */
	moderator_id: string;
	/** The session ID for the invite to be sent on behalf of the broadcaster. */
	session_id: string;
	/** Twitch User ID for the guest to invite to the Guest Star session. */
	guest_id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "guest_star/invites",
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			session_id: params.session_id,
			guest_id: params.guest_id,
		},
		...params.config,
	};
}

/**
 * ## [Send Guest Star Invite](https://dev.twitch.tv/docs/api/reference/#send-guest-star-invite)
 * Sends an invite to a specified guest on behalf of the broadcaster for a Guest Star session in progress.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfully sent the Guest Star invite
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing `moderator_id` 
 * ㅤ|Missing `session_id` 
 * ㅤ|Missing `guest_id` 
 * ㅤ|Invalid `session_id`
 * 403 Forbidden|Unauthorized guest invited 
 * ㅤ|Guest already invited
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}