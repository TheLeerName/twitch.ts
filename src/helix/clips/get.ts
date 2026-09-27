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

/** The `id`, `game_id`, and `broadcaster_id` query parameters are mutually exclusive. */
export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** An ID that identifies the broadcaster whose video clips you want to get. Use this parameter to get clips that were captured from the broadcaster’s streams. */
	broadcaster_id?: string;
	/** An ID that identifies the game whose clips you want to get. Use this parameter to get clips that were captured from streams that were playing this game. */
	game_id?: string;
	/** An ID that identifies the clip to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that aren’t found. */
	id?: string | string[];
	/** The start date used to filter clips. The API returns only clips within the start and end date window. Specify the date and time in RFC3339 format. */
	started_at?: string;
	/** The end date used to filter clips. If not specified, the time window is the start date plus one week. Specify the date and time in RFC3339 format. */
	ended_at?: string;
	/** **Integer**. The maximum number of clips to return per page in the response. The minimum page size is 1 clip per page and the maximum is 100. The default is 20. */
	first?: number;
	/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** A Boolean value that determines whether the response includes featured clips. If **true**, returns only clips that are featured. If **false**, returns only clips that aren’t featured. All clips are returned if this parameter is not present. */
	is_featured?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of video clips. For clips returned by `game_id` or `broadcaster_id`, the list is in descending order by view count. For lists returned by `id`, the list is in the same order as the input IDs. */
	data: {
		/** An ID that uniquely identifies the clip. */
		id: string;
		/** A URL to the clip. */
		url: string;
		/** A URL that you can use in an iframe to embed the clip (see [Embedding Video and Clips](https://dev.twitch.tv/docs/embed/video-and-clips/)). */
		embed_url: string;
		/** An ID that identifies the broadcaster that the video was clipped from. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** An ID that identifies the user that created the clip. */
		creator_id: string;
		/** The user’s display name. */
		creator_name: string;
		/** An ID that identifies the video that the clip came from. This field contains an empty string if the video is not available. */
		video_id: string;
		/** The ID of the game that was being played when the clip was created. */
		game_id: string;
		/** The ISO 639-1 two-letter language code that the broadcaster broadcasts in. For example, `en` for English. The value is `other` if the broadcaster uses a language that Twitch doesn’t support. */
		language: string;
		/** The title of the clip. */
		title: string;
		/** **Integer**. The number of times the clip has been viewed. */
		view_count: number;
		/** The date and time of when the clip was created. The date and time is in RFC3339 format. */
		created_at: string;
		/** A URL to a thumbnail image of the clip. */
		thumbnail_url: string;
		/** The length of the clip, in seconds. Precision is 0.1. */
		duration: number;
		/**
		 * **Integer**. The zero-based offset, in seconds, to where the clip starts in the video (VOD). Is **null** if the video is not available or hasn’t been created yet from the live stream (see `video_id`).

		 * Note that there’s a delay between when a clip is created during a broadcast and when the offset is set. During the delay period, `vod_offset` is **null**. The delay is indeterminant but is typically minutes long.
		 */
		vod_offset: number | null;
		/** A Boolean value that indicates if the clip is featured or not. */
		is_featured: boolean;
	}[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request’s `after` or `before` query parameter to this value depending on whether you’re paging forwards or backwards. */
		cursor?: string;
	};
}

/**
 * ## [Get Clips](https://dev.twitch.tv/docs/api/reference/#get-clips)
 * Gets one or more video clips that were captured from streams. For information about clips, see [How to use clips](https://help.twitch.tv/s/article/how-to-use-clips).

 * When using pagination for clips, note that the maximum number of results returned over multiple requests will be approximately 1,000. If additional results are necessary, paginate over different query parameters such as multiple `started_at` and `ended_at` timeframes to refine the search.

 * **NOTE**: The `id`, `game_id`, and `broadcaster_id` query parameters are mutually exclusive.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of video clips.
 * 400 Bad Request|The `id` or `game_id` or `broadcaster_id` query parameter is required.
 * ㅤ|The `id`, `game_id`, and `broadcaster_id` query parameters are mutually exclusive; you may specify only one of them.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The ID in `game_id` was not found.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "clips", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		game_id: params.game_id,
		id: params.id,
		started_at: params.started_at,
		ended_at: params.ended_at,
		first: params.first,
		before: params.before,
		after: params.after,
		is_featured: params.is_featured,
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