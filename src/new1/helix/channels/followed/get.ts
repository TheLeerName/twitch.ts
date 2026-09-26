import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:read:follows`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** A user’s ID. Returns the list of broadcasters that this user follows. This ID must match the user ID in the user OAuth token. */
	user_id: string;
	/** A broadcaster’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this broadcaster if the user follows them. If not specified, the response contains all broadcasters that the user follows. */
	broadcaster_id?: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of broadcasters that the user follows. The list is in descending order by `followed_at` (with the most recently followed broadcaster first). The list is empty if the user doesn’t follow anyone. */
	data: {
		/** An ID that uniquely identifies the broadcaster that this user is following. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The UTC timestamp when the user started following the broadcaster. */
		followed_at: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
	/** **Integer**. The total number of broadcasters that the user follows. As someone pages through the list, the number may change as the user follows or unfollows broadcasters. */
	total: number;
}

/**
 * ## [Get Followed Channels](https://dev.twitch.tv/docs/api/reference/#get-followed-channels)
 * Gets a list of broadcasters that the specified user follows. You can also use this endpoint to see whether a user follows a specific broadcaster.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's list of followers.
 * 400 Bad Request|Possible reasons:
 * ㅤ|The `user_id` query parameter is required.
 * ㅤ|The `broadcaster_id` query parameter is not valid.
 * ㅤ|The `user_id` query parameter is required.
 * 401 Unauthorized|Possible reasons:
 * ㅤ|The ID in the `user_id` query parameter must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token is missing the **user:read:follows** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "channels/followed", Options.apiHelixPath);
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