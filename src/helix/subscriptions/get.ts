import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:subscriptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `channel:read:subscriptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The broadcaster’s ID. This ID must match the user ID in the access token. */
	broadcaster_id: string;
	/** Filters the list to include only the specified subscribers. You may specify a maximum of 100 subscribers. */
	user_id?: string | string[];
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: string;
	/** The cursor used to get the next page of results. Do not specify if you set the `user_id` query parameter. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** The cursor used to get the previous page of results. Do not specify if you set the `user_id` query parameter. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of users that subscribe to the broadcaster. The list is empty if the broadcaster has no subscribers. */
	data: {
		/** An ID that identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID of the user that gifted the subscription to the user. Is an empty string if `is_gift` is **false**. */
		gifter_id: string;
		/** The gifter’s login name. Is an empty string if `is_gift` is **false**. */
		gifter_login: string;
		/** The gifter’s display name. Is an empty string if `is_gift` is **false**. */
		gifter_name: string;
		/** A Boolean value that determines whether the subscription is a gift subscription. Is **true** if the subscription was gifted. */
		is_gift: boolean;
		/** The name of the subscription. */
		plan_name: string;
		/**
		 * The type of subscription. Possible values are:
		 * - 1000 — Tier 1
		 * - 2000 — Tier 2
		 * - 3000 — Tier 3
		 */
		tier: "1000" | "2000" | "3000";
		/** An ID that identifies the subscribing user. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next or previous page of results. Use the cursor to set the request’s `after` or `before` query parameter depending on whether you’re paging forwards or backwards. */
		cursor?: string;
	};
	/**
	 * **Integer**. The current number of subscriber points earned by this broadcaster. Points are based on the subscription tier of each user that subscribes to this broadcaster. For example, a Tier 1 subscription is worth 1 point, Tier 2 is worth 2 points, and Tier 3 is worth 6 points. The number of points determines the number of emote slots that are unlocked for the broadcaster (see [Subscriber Emote Slots](https://help.twitch.tv/s/article/subscriber-emote-guide#emoteslots)).

	 * If the `user_id` query parameter is used, this field will be null.
	 */
	points: number | null;
	/**
	 * **Integer**. The total number of users that subscribe to this broadcaster.

	 * If the `user_id` query parameter is used, this field will be null.
	 */
	total: number | null;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "subscriptions", Main.Options.apiHelixPath);
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
 * ## [Get Broadcaster Subscriptions](https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions)
 * Gets a list of users that subscribe to the specified broadcaster.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of subscribers.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID found in the request’s OAuth token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:subscriptions** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}