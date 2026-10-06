import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:videos`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * The list of videos to delete. You can delete a maximum of 5 videos per request. Ignores invalid video IDs.

	 * If the user doesn’t have permission to delete one of the videos in the list, none of the videos are deleted.
	 */
	id: string | string[];
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of IDs of the videos that were deleted. */
	data: string[];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "videos", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		id: params.id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Delete Videos](https://dev.twitch.tv/docs/api/reference/#delete-videos)
 * Deletes one or more videos. You may delete past broadcasts, highlights, or uploads.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully deleted the list of videos.
 * 400 Bad Request|The `id` query parameter is required.
 * ㅤ|The request exceeded the number of allowed `id` query parameters.
 * 401 Unauthorized|The caller is not authorized to delete the specified video.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:videos** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}