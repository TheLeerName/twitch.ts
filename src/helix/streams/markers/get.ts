import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `user:read:broadcast` or `channel:manage:broadcast`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * A user ID. The request returns the markers from this user’s most recent video. This ID must match the user ID in the access token or the user in the access token must be one of the broadcaster’s editors.

	 * This parameter and the `video_id` query parameter are mutually exclusive.
	 */
	user_id?: string;
	/**
	 * A video on demand (VOD)/video ID. The request returns the markers from this VOD/video. The user in the access token must own the video or the user must be one of the broadcaster’s editors.

	 * This parameter and the `user_id` query parameter are mutually exclusive.
	 */
	video_id?: string;
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: string;
	/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of markers grouped by the user that created the marks. */
	data: {
		/** The ID of the user that created the marker. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
		/** A list of videos that contain markers. The list contains a single video. */
		videos: [{
			/** An ID that identifies this video. */
			video_id: string;
			/** The list of markers in this video. The list in ascending order by when the marker was created. */
			markers: {
				/** An ID that identifies this marker. */
				id: string;
				/** The UTC date and time (in RFC3339 format) of when the user created the marker. */
				created_at: string;
				/** The description that the user gave the marker to help them remember why they marked the location. Is an empty string if the user didn’t provide one. */
				description: string;
				/** **Integer**. The relative offset (in seconds) of the marker from the beginning of the stream. */
				position_seconds: number;
				/** A URL that opens the video in Twitch Highlighter. */
				url: string;
			}[];
		}];
	}[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request’s `after` or `before` query parameter to this value depending on whether you’re paging forwards or backwards. */
		cursor?: string;
	};
}

/**
 * ## [Get Stream Markers](https://dev.twitch.tv/docs/api/reference/#get-stream-markers)
 * Gets a list of markers from the user’s most recent stream or from the specified VOD/video. A marker is an arbitrary point in a live stream that the broadcaster or editor marked, so they can return to that spot later to create video highlights. For more information on these features, see [Creating Highlights and Stream Markers](https://help.twitch.tv/s/article/creating-highlights-and-stream-markers).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of markers.
 * 400 Bad Request|The request must specify either the `user_id` or `video_id` query parameter, but not both.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:read:broadcast** or **channel:manage:broadcast** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The Client ID specified in the Client-Id header does not match the Client ID specified in the access token.
 * 403 Forbidden|The user in the access token is not authorized to get the video's markers. The user in the access token must own the video or be one of the broadcaster's editors.
 * 404 Not Found|The user specified in the `user_id` query parameter doesn't have videos.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "streams/markers", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		video_id: params.video_id,
		first: params.first,
		before: params.before,
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