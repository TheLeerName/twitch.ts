import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:broadcast`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The ID of the broadcaster that’s streaming content. This ID must match the user ID in the access token or the user in the access token must be one of the broadcaster’s editors. */
	user_id: string;
	/** A short description of the marker to help the user remember why they marked the location. The maximum length of the description is 140 characters. */
	description?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & Main.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the single marker that you added. */
	data: [{
		/** An ID that identifies this marker. */
		id: string;
		/** The UTC date and time (in RFC3339 format) of when the user created the marker. */
		created_at: string;
		/** **Integer**. The relative offset (in seconds) of the marker from the beginning of the stream. */
		position_seconds: number;
		/** A description that the user gave the marker to help them remember why they marked the location. */
		description: string;
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "streams/markers",
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		data: JSON.stringify({
			user_id: params.user_id,
			description: params.description,
		}),
		...params.config,
	};
}

/**
 * ## [Create Stream Marker](https://dev.twitch.tv/docs/api/reference/#create-stream-marker)
 * Adds a marker to a live stream. A marker is an arbitrary point in a live stream that the broadcaster or editor wants to mark, so they can return to that spot later to create video highlights. For more information on these features, see [Creating Highlights and Stream Markers](https://help.twitch.tv/s/article/creating-highlights-and-stream-markers).

 * You may not add markers:

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the marker.
 * 400 Bad Request|The `user_id` field is required.
 * ㅤ|The length of the string in the `description` field is too long.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:broadcast** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The Client ID specified in the Client-Id header does not match the Client ID specified in the access token.
 * 403 Forbidden|The user in the access token is not authorized to create video markers for the user in the `user_id` field. The user in the access token must own the video or they must be one of the broadcaster's editors.
 * 404 Not Found|The user in the `user_id` field is not streaming live.
 * ㅤ|The ID in the user_id field is not valid.
 * ㅤ|The user hasn't enabled video on demand (VOD).
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}