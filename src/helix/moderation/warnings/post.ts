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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:warnings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:warnings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the channel in which the warning will take effect. */
	broadcaster_id: string;
	/** The ID of the twitch user who requested the warning. */
	moderator_id: string;
}

export interface RequestBody {
	/** The ID of the twitch user to be warned. */
	user_id: string;
	/** A custom reason for the warning. **Max 500 chars.** */
	reason: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains information about the warning. */
	data: [{
		/** The ID of the channel in which the warning will take effect. */
		broadcaster_id: string;
		/** The ID of the warned user. */
		user_id: string;
		/** The ID of the user who applied the warning. */
		moderator_id: string;
		/** The reason provided for warning. */
		reason: string;
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/warnings",
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
		},
		data: JSON.stringify({
			data: {
				user_id: params.user_id,
				reason: params.reason,
			},
		}),
		...params.config,
	};
}

/**
 * ## [Warn Chat User](https://dev.twitch.tv/docs/api/reference/#warn-chat-user)
 * Warns a user in the specified broadcaster’s chat room, preventing them from chat interaction until the warning is acknowledged. New warnings can be issued to a user when they already have a warning in the channel (new warning will replace old warning).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully warn a user.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The `user_id` query parameter is required.
 * ㅤ|The `reason` query parameter is required.
 * ㅤ|The text in the `reason` field is too long.
 * ㅤ|The user specified in the `user_id` may not be warned.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:warnings** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster’s moderators.
 * 409 Conflict|You may not update the user’s warning state while someone else is updating the state. For example, someone else is currently warning the user or the user is acknowledging an existing warning. Please retry your request.
 * 429 Too Many Requests|The app has exceeded the number of requests it may make per minute for this broadcaster.
 * 500 Internal Server Error|Internal Server Error.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}