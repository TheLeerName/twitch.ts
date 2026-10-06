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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** A user ID used to filter the list of streams. Returns only the streams of those users that are broadcasting. You may specify a maximum of 100 IDs. */
	user_id?: string | string[];
	/** A user login name used to filter the list of streams. Returns only the streams of those users that are broadcasting. You may specify a maximum of 100 login names. */
	user_login?: string | string[];
	/** A game (category) ID used to filter the list of streams. Returns only the streams that are broadcasting the game (category). You may specify a maximum of 100 IDs. */
	game_id?: string | string[];
	/**
	 * The type of stream to filter the list of streams by. Possible values are:
	 * - all
	 * - live

	 * The default is `all`.
	 */
	type?: "all" | "live";
	/** A language code used to filter the list of streams. Returns only streams that broadcast in the specified language. Specify the language using an ISO 639-1 two-letter language code or `other` if the broadcast uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). You may specify a maximum of 100 language codes. */
	language?: string | string[];
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of streams. */
	data: Stream[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request’s `after` or `before` query parameter to this value depending on whether you’re paging forwards or backwards. */
		cursor?: string;
	};
}

export interface Stream {
	/** An ID that identifies the stream. You can use this ID later to look up the video on demand (VOD). */
	id: string;
	/** The ID of the user that’s broadcasting the stream. */
	user_id: string;
	/** The user’s login name. */
	user_login: string;
	/** The user’s display name. */
	user_name: string;
	/** The ID of the category or game being streamed. If no category is set on the channel, this will be set to an empty string. */
	game_id: string;
	/** The name of the category or game being streamed. If no category is set on the channel, this will be set to an empty string. */
	game_name: string;
	/**
	 * The type of stream. Possible values are:
	 * - live

		* If an error occurs, this field is set to an empty string.
		*/
	type: "live" | "";
	/** The stream’s title. Is an empty string if not set. */
	title: string;
	/** The tags applied to the stream. */
	tags: string[];
	/** **Integer**. The number of users watching the stream. */
	viewer_count: number;
	/** The UTC date and time (in RFC3339 format) of when the broadcast began. */
	started_at: string;
	/** The language that the stream uses. This is an ISO 639-1 two-letter language code or `other` if the stream uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). */
	language: string;
	/** A URL to an image of a frame from the last 5 minutes of the stream. Replace the width and height placeholders in the URL (`{width}x{height}`) with the size of the image you want, in pixels. */
	thumbnail_url: string;
	/**
	 * **IMPORTANT** As of February 28, 2023, this field is deprecated and returns only an empty array. If you use this field, please update your code to use the `tags` field.

		* The list of tags that apply to the stream. The list contains IDs only when the channel is steaming live. For a list of possible tags, see [List of All Tags](https://www.twitch.tv/directory/all/tags). The list doesn’t include Category Tags.
		*/
	tag_ids: [];
	/**
	 * **IMPORTANT** This field is deprecated and returns only `false`.

		* A Boolean value that indicates whether the stream is meant for mature audiences.
		*/
	is_mature: false;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "streams", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		user_login: params.user_login,
		game_id: params.game_id,
		type: params.type,
		language: params.language,
		first: params.first,
		before: params.before,
		after: params.after,
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
 * ## [Get Streams](https://dev.twitch.tv/docs/api/reference/#get-streams)
 * Gets a list of all streams. The list is in descending order by the number of viewers watching the stream. Because viewers come and go during a stream, it’s possible to find duplicate or missing streams in the list as you page through the results.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of streams.
 * 400 Bad Request|The value in the `type` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}