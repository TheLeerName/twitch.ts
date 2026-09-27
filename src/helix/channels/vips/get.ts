import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:read:vips` or `channel:manage:vips`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Filters the list for specific VIPs. The maximum number of IDs that you may specify is 100. Ignores the ID of those users in the list that aren’t VIPs. */
	user_id?: string | string[];
	/** The ID of the broadcaster whose list of VIPs you want to get. This ID must match the user ID in the access token. */
	broadcaster_id: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of VIPs. The list is empty if the broadcaster doesn’t have VIP users. */
	data: {
		/** An ID that uniquely identifies the VIP user. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Get VIPs](https://dev.twitch.tv/docs/api/reference/#get-vips)
 * Gets a list of the broadcaster’s VIPs.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of VIPs.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `user_id` query parameter is not valid.
 * ㅤ|The number of `user_id` query parameters exceeds the maximum allowed.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:vips**  or **channel:manage:vips** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "channels/vips", Main.Options.apiHelixPath);
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