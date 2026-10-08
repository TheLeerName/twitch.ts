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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:read:chatters`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:read:chatters`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster whose list of chatters you want to get. */
	broadcaster_id: string;
	/** The ID of the broadcaster or one of the broadcaster’s moderators. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 1,000. The default is 100. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of users that are connected to the broadcaster’s chat room. The list is empty if no users are connected to the chat room. */
	data: {
		/** The ID of a user that’s connected to the broadcaster’s chat room. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
	/** **Integer**. The total number of users that are connected to the broadcaster’s chat room. As you page through the list, the number of users may change as users join and leave the chat room. */
	total: number;
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "chat/chatters",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			first: params.first,
			after: params.after,
		},
		...params.config,
	};
}

/**
 * ## [Get Chatters](https://dev.twitch.tv/docs/api/reference/#get-chatters)
 * Gets the list of users that are connected to the broadcaster’s chat session.

 * **NOTE**: There is a delay between when users join and leave a chat and when the list is updated accordingly.

 * To determine whether a user is a moderator or VIP, use the {@link Helix.GetModerators | Get Moderators} and {@link Helix.GetVIPs | Get VIPs} endpoints. You can check the roles of up to 100 users.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of chatters.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The ID in the `moderator_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `moderator_id` query parameter must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:read:chatters** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in the `moderator_id` query parameter is not one of the broadcaster's moderators.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}