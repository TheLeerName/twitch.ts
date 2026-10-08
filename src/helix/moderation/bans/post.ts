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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:banned_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:banned_users` and `user:bot`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster whose chat room the user is being banned from. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

export interface RequestBody {
	/** The ID of the user to ban or put in a timeout. */
	user_id: string;
	/**
	 * **Integer**. To ban a user indefinitely, don’t include this field.

	 * To put a user in a timeout, include this field and specify the timeout period, in seconds. The minimum timeout is 1 second and the maximum is 1,209,600 seconds (2 weeks).

	 * To end a user’s timeout early, set this field to 1, or use the {@link Helix.UnbanUser | Unban user} endpoint.
	 */
	duration?: number;
	/** The reason the you’re banning the user or putting them in a timeout. The text is user defined and is limited to a maximum of 500 characters. */
	reason?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the user you successfully banned or put in a timeout. */
	data: [{
		/** The broadcaster whose chat room the user was banned from chatting in. */
		broadcaster_id: string;
		/** The moderator that banned or put the user in the timeout. */
		moderator_id: string;
		/** The user that was banned or put in a timeout. */
		user_id: string;
		/** The UTC date and time (in RFC3339 format) that the ban or timeout was placed. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) that the timeout will end. Is **null** if the user was banned instead of being put in a timeout. */
		end_time: string | null;
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/bans",
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
				duration: params.duration,
				reason: params.reason,
			},
		}),
		...params.config,
	};
}

/**
 * ## [Ban User](https://dev.twitch.tv/docs/api/reference/#ban-user)
 * Bans a user from participating in the specified broadcaster’s chat room or puts them in a timeout.

 * For information about banning or putting users in a timeout, see [Ban a User](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat#TheBanFeature) and [Timeout a User](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat#TheTimeoutFeature).

 * If the user is currently in a timeout, you can call this endpoint to change the duration of the timeout or ban them altogether. If the user is currently banned, you cannot call this method to put them in a timeout instead.

 * To remove a ban or end a timeout, see {@link Helix.UnbanUser | Unban user}.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully banned the user or placed them in a timeout.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The `user_id` field is required.
 * ㅤ|The text in the `reason` field is too long.
 * ㅤ|The value in the `duration` field is not valid.
 * ㅤ|The user specified in the `user_id` field may not be banned.
 * ㅤ|The user specified in the `user_id` field may not be put in a timeout.
 * ㅤ|The user specified in the `user_id` field is already banned.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:banned_users** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 * 409 Conflict|You may not update the user's ban state while someone else is updating the state. For example, someone else is currently banning the user or putting them in a timeout, moving the user from a timeout to a ban, or removing the user from a ban or timeout. Please retry your request.
 * 429 Too Many Requests|The app has exceeded the number of requests it may make per minute for this broadcaster.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}