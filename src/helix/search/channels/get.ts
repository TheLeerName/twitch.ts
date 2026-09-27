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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The URI-encoded search string. For example, encode search strings like `angel of death` as `angel%20of%20death`. */
	query: string;
	/** A Boolean value that determines whether the response includes only channels that are currently streaming live. Set to **true** to get only channels that are streaming live; otherwise, **false** to get live and offline channels. The default is **false**. */
	live_only?: boolean;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of channels that match the query. The list is empty if there are no matches. */
	data: {
		/** The ISO 639-1 two-letter language code of the language used by the broadcaster. For example, `en` for English. If the broadcaster uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang), the value is `other`. */
		broadcaster_language: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		display_name: string;
		/** The ID of the game that the broadcaster is playing or last played. */
		game_id: string;
		/** The name of the game that the broadcaster is playing or last played. */
		game_name: string;
		/** An ID that uniquely identifies the channel (this is the broadcaster’s ID). */
		id: string;
		/** A Boolean value that determines whether the broadcaster is streaming live. Is **true** if the broadcaster is streaming live; otherwise, **false**. */
		is_live: boolean;
		/**
		 * **IMPORTANT** As of February 28, 2023, this field is deprecated and returns only an empty array. If you use this field, please update your code to use the `tags` field.

		 * The list of tags that apply to the stream. The list contains IDs only when the channel is steaming live. For a list of possible tags, see [List of All Tags](https://www.twitch.tv/directory/all/tags). The list doesn’t include Category Tags.
		 */
		tag_ids: [];
		/** The tags applied to the channel. */
		tags: string[];
		/** A URL to a thumbnail of the broadcaster’s profile image. */
		thumbnail_url: string;
		/** The stream’s title. Is an empty string if the broadcaster didn’t set it. */
		title: string;
		/** The UTC date and time (in RFC3339 format) of when the broadcaster started streaming. The string is empty if the broadcaster is not streaming live. */
		started_at: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Search Channels](https://dev.twitch.tv/docs/api/reference/#search-channels)
 * Gets the channels that match the specified query and have streamed content within the past 6 months.

 * The fields that the API uses for comparison depends on the value that the `live_only` query parameter is set to. If `live_only` is **false**, the API matches on the broadcaster’s login name. However, if `live_only` is **true**, the API matches on the broadcaster’s name and category name.

 * To match, the beginning of the broadcaster’s name or category must match the query string. The comparison is case insensitive. If the query string is angel_of_death, it matches all names that begin with angel_of_death. However, if the query string is a phrase like `angel of death`, it matches to names starting with angelofdeath or names starting with angel_of_death.

 * By default, the results include both live and offline channels. To get only live channels set the `live_only` query parameter to **true**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of category names that matched the specified query string.
 * 400 Bad Request|The `query` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "search/channels", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		query: params.query,
		live_only: params.live_only,
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