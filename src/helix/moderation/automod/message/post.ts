import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:automod`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:automod`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The moderator who is approving or denying the held message. This ID must match the user ID in the access token. */
	user_id: string;
	/** The ID of the message to allow or deny. */
	msg_id: string;
	/**
	 * The action to take for the message. Possible values are:
	 * - ALLOW
	 * - DENY
	 */
	action: "ALLOW" | "DENY";
}

export type RequestParameters = Main.RequestParameters & Authentication & Main.RequestQueryParameters & RequestBody;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/automod/message",
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		data: JSON.stringify({
			user_id: params.user_id,
			msg_id: params.msg_id,
			action: params.action,
		}),
		...params.config,
	};
}

/**
 * ## [Manage Held AutoMod Messages](https://dev.twitch.tv/docs/api/reference/#manage-held-automod-messages)
 * Allow or deny the message that AutoMod flagged for review. For information about AutoMod, see [How to Use AutoMod](https://help.twitch.tv/s/article/how-to-use-automod).

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully approved or denied the message.
 * 400 Bad Request|The value in the `action` field is not valid.
 * ㅤ|The `user_id` field is required.
 * ㅤ|The `msg_id` field is required.
 * ㅤ|The `action` field is required.
 * 401 Unauthorized|The ID in `user_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:automod** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `user_id` is not one of the broadcaster's moderators.
 * 404 Not Found|The message specified in the `msg_id` field was not found.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}