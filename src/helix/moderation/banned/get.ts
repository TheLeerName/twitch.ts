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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `moderation:read` or `moderator:manage:banned_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `moderation:read` or `moderator:manage:banned_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose list of banned users you want to get. This ID must match the user ID in the access token. */
	broadcaster_id: string;
	/**
	 * A list of user IDs used to filter the results. You may specify a maximum of 100 IDs.

	 * The returned list includes only those users that were banned or put in a timeout. The list is returned in the same order that you specified the IDs.
	 */
	user_id?: string | string[];
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of users that were banned or put in a timeout. */
	data: {
		/** The ID of the banned user. */
		user_id: string;
		/** The banned user’s login name. */
		user_login: string;
		/** The banned user’s display name. */
		user_name: string;
		/** The UTC date and time (in RFC3339 format) of when the timeout expires, or an empty string if the user is permanently banned. */
		expires_at: string;
		/** The UTC date and time (in RFC3339 format) of when the user was banned. */
		created_at: string;
		/** The reason the user was banned or put in a timeout if the moderator provided one. */
		reason: string;
		/** The ID of the moderator that banned the user or put them in a timeout. */
		moderator_id: string;
		/** The moderator’s login name. */
		moderator_login: string;
		/** The moderator’s display name. */
		moderator_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "moderation/banned", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		user_id: params.user_id,
		first: params.first,
		after: params.after,
		before: params.before,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Get Banned Users](https://dev.twitch.tv/docs/api/reference/#get-banned-users)
 * Gets all users that the broadcaster banned or put in a timeout.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of banned users.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderation:read** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}