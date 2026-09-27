import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:read:followers`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * A user’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this user if they follow the broadcaster. If not specified, the response contains all users that follow the broadcaster.

	 * Using this parameter requires both a user access token with the **moderator:read:followers** scope and the user ID in the access token match the broadcaster_id or be the user ID for a moderator of the specified broadcaster.
	 */
	user_id?: string;
	/** The broadcaster’s ID. Returns the list of users that follow this broadcaster. */
	broadcaster_id: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of users that follow the specified broadcaster. The list is in descending order by `followed_at` (with the most recent follower first). The list is empty if nobody follows the broadcaster, the specified `user_id` isn’t in the follower list, the user access token is missing the **moderator:read:followers** scope, or the user isn’t the broadcaster or moderator for the channel. */
	data: {
		/** The UTC timestamp when the user started following the broadcaster. */
		followed_at: string;
		/** An ID that uniquely identifies the user that’s following the broadcaster. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
	/** **Integer**. The total number of users that follow this broadcaster. As someone pages through the list, the number of users may change as users follow or unfollow the broadcaster. */
	total: number;
}

/**
 * ## [Get Channel Followers](https://dev.twitch.tv/docs/api/reference/#get-channel-followers)
 * Gets a list of users that follow the specified broadcaster. You can also use this endpoint to see whether a specific user follows the broadcaster.

 * This endpoint will return specific follower information only if `moderator_id` or `broadcaster_id` matches the user ID in the access token and if **moderator:read:followers** scope was provided, otherwise only the total follower count will be included in the response.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of followers.
 * 400 Bad Request|Possible reasons:
 * ㅤ|The `broadcaster_id` query parameter is required.
 * ㅤ|The `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|Possible reasons:
 * ㅤ|The ID in the `broadcaster_id` query parameter must match the user ID in the access token or the user must be a moderator for the specified broadcaster.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token is missing the **moderator:read:followers** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * ㅤ|The `user_id` parameter was specified but either the user access token is missing the **moderator:read:followers** scope or the user is not the broadcaster or moderator for the specified channel
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "channels/followers", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		broadcaster_id: params.broadcaster_id,
		first: params.first,
		after: params.after,
	});
	return global.fetch(url as any, {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}