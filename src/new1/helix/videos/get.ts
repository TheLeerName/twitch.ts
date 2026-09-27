import { Options, Helix } from "../..";

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

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/**
	 * A list of IDs that identify the videos you want to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate IDs and IDs that weren't found (if there's at least one valid ID).

	 * The `id`, `user_id`, and `game_id` parameters are mutually exclusive.
	 */
	id?: string | string[];
	/**
	 * The ID of the user whose list of videos you want to get.

	 * The `id`, `user_id`, and `game_id` parameters are mutually exclusive.
	 */
	user_id?: string;
	/**
	 * A category or game ID. The response contains a maximum of 500 videos that show this content. To get category/game IDs, use the [Search Categories](https://dev.twitch.tv/docs/api/reference#search-categories) endpoint.

	 * The `id`, `user_id`, and `game_id` parameters are mutually exclusive.
	 */
	game_id?: string;
	/**
	 * A filter used to filter the list of videos by the language that the video owner broadcasts in. For example, to get videos that were broadcast in German, set this parameter to the ISO 639-1 two-letter code for German (i.e., DE). For a list of supported languages, see [Supported Stream Language](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). If the language is not supported, use “other.”

	 * Specify this parameter only if you specify the `game_id` query parameter.
	 */
	language?: string;
	/**
	 * A filter used to filter the list of videos by when they were published. For example, videos published in the last week. Possible values are:
	 * - all
	 * - day
	 * - month
	 * - week

	 * The default is "all", which returns videos published in all periods.

	 * Specify this parameter only if you specify the `game_id` or `user_id` query parameter.
	 */
	period?: "all" | "day" | "month" | "week";
	/**
	 * The order to sort the returned videos in. Possible values are:
	 * - time — Sort the results in descending order by when they were created (i.e., latest video first).
	 * - trending — Sort the results in descending order by biggest gains in viewership (i.e., highest trending video first).
	 * - views — Sort the results in descending order by most views (i.e., highest number of views first).

	 * The default is "time".

	 * Specify this parameter only if you specify the `game_id` or `user_id` query parameter.
	 */
	sort?: "time" | "trending" | "views";
	/**
	 * A filter used to filter the list of videos by the video's type. Possible case-sensitive values are:
	 * - all
	 * - archive — On-demand videos (VODs) of past streams.
	 * - highlight — Highlight reels of past streams.
	 * - upload — External videos that the broadcaster uploaded using the Video Producer.

	 * The default is "all", which returns all video types.

	 * Specify this parameter only if you specify the `game_id` or `user_id` query parameter.
	 */
	type?: "all" | "archive" | "highlight" | "upload";
	/**
	 * The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.

	 * Specify this parameter only if you specify the `game_id` or `user_id` query parameter.
	 */
	first?: string;
	/**
	 * The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)

	 * Specify this parameter only if you specify the `user_id` query parameter.
	 */
	after?: string;
	/**
	 * The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)

	 * Specify this parameter only if you specify the `user_id` query parameter.
	 */
	before?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of published videos that match the filter criteria. */
	data: {
		/** An ID that identifies the video. */
		id: string;
		/** The ID of the stream that the video originated from if the video's type is "archive"; otherwise, **null**. */
		stream_id: string | null;
		/** The ID of the broadcaster that owns the video. */
		user_id: string;
		/** The broadcaster's login name. */
		user_login: string;
		/** The broadcaster's display name. */
		user_name: string;
		/** The video's title. */
		title: string;
		/** The video's description. */
		description: string;
		/** The date and time, in UTC, of when the video was created. The timestamp is in RFC3339 format. */
		created_at: string;
		/** The date and time, in UTC, of when the video was published. The timestamp is in RFC3339 format. */
		published_at: string;
		/** The video's URL. */
		url: string;
		/** A URL to a thumbnail image of the video. Before using the URL, you must replace the `%{width}` and `%{height}` placeholders with the width and height of the thumbnail you want returned. Due to current limitations, `${width}` must be 320 and `${height}` must be 180. */
		thumbnail_url: string;
		/** The video's viewable state. Always set to **public**. */
		viewable: "public";
		/** **Integer**. The number of times that users have watched the video. */
		view_count: number;
		/** The ISO 639-1 two-letter language code that the video was broadcast in. For example, the language code is DE if the video was broadcast in German. For a list of supported languages, see [Supported Stream Language](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). The language value is "other" if the video was broadcast in a language not in the list of supported languages. */
		language: string;
		/**
		 * The video's type. Possible values are:
		 * - archive — An on-demand video (VOD) of one of the broadcaster's past streams.
		 * - highlight — A highlight reel of one of the broadcaster's past streams. See [Creating Highlights](https://help.twitch.tv/s/article/creating-highlights-and-stream-markers).
		 * - upload — A video that the broadcaster uploaded to their video library. See Upload under [Video Producer](https://help.twitch.tv/s/article/video-on-demand?language=en_US#videoproducer).
		 */
		type: "archive" | "highlight" | "upload";
		/** The video's length in ISO 8601 duration format. For example, 3m21s represents 3 minutes, 21 seconds. */
		duration: string;
		/** The segments that Twitch Audio Recognition muted; otherwise, **null**. */
		muted_segments: {
			/** **Integer**. The duration of the muted segment, in seconds. */
			duration: number;
			/** **Integer**. The offset, in seconds, from the beginning of the video to where the muted segment begins. */
			offset: number;
		}[] | null;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request's `after` or `before` query parameter depending on whether you're paging forwards or backwards through the results. */
		cursor?: string;
	};
}

/**
 * ## [Get Videos](https://dev.twitch.tv/docs/api/reference/#get-videos)
 * Gets information about one or more published videos. You may get videos by ID, by user, or by game/category.

 * You may apply several filters to get a subset of the videos. The filters are applied as an AND operation to each video. For example, if `language` is set to ‘de’ and `game_id` is set to 21779, the response includes only videos that show playing League of Legends by users that stream in German. The filters apply only if you get videos by user ID or game ID.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of videos.
 * 400 Bad Request|The request must specify either the `id` or `user_id` or `game_id` query parameter.
 * ㅤ|The `id`, `user_id`, and `game_id` query parameters are mutually exclusive; you must specify only one of them.
 * ㅤ|The value in the `id` query parameter is not valid.
 * ㅤ|The ID in the `game_id` query parameter is not valid.
 * ㅤ|The value in the `type` query parameter is not valid.
 * ㅤ|The value in the `period` query parameter is not valid.
 * ㅤ|The value in the `sort` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The ID in the `game_id` query parameter was not found.
 * ㅤ|The ID in the `id` query parameter was not found. Returned only if all the IDs were not found; otherwise, the ID is ignored.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "videos", Options.apiHelixPath);
	url.searchParams.appendMany({
		id: params.id,
		user_id: params.user_id,
		game_id: params.game_id,
		language: params.language,
		period: params.period,
		sort: params.sort,
		type: params.type,
		first: params.first,
		after: params.after,
		before: params.before,
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