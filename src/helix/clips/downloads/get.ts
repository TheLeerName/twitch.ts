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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `editor:manage:clips` or `channel:manage:clips`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `editor:manage:clips` or `channel:manage:clips`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The User ID of the editor for the channel you want to download a clip for. If using the broadcaster’s auth token, this is the same as `broadcaster_id`. This must match the `user_id` in the user access token. */
	editor_id: string;
	/** The ID of the broadcaster you want to download clips for. */
	broadcaster_id: string;
	/** The ID that identifies the clip you want to download. Up to a maximum of 10 clips. */
	clip_id: string | string[];
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** List of clips and their download URLs. */
	data: {
		/** An ID that uniquely identifies the clip. */
		clip_id: string;
		/** The landscape URL to download the clip. This field is `null` if the URL is not available. */
		landscape_download_url: string | null;
		/** The portrait URL to download the clip. This field is `null` if the URL is not available. */
		portrait_download_url: string | null;
	}[];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "clips/downloads",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			editor_id: params.editor_id,
			broadcaster_id: params.broadcaster_id,
			clip_id: params.clip_id,
		},
		...params.config,
	};
}

/**
 * ## [Get Clips Download](https://dev.twitch.tv/docs/api/reference/#get-clips-download)
 * Provides URLs to download the video file(s) for the specified clips. For information about clips, see [How to use clips](https://help.twitch.tv/s/article/how-to-use-clips). These links are temporary and should have a long-term expectation to expire.

 * **Rate Limits**: Limited to 100 requests per minute.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the clip download URL(s).
 * 400 Bad Request|The ID in the broadcaster_id, editor_id, or clip_id query parameter is not valid.
 * 401 Unauthorized|     
 * ㅤ|The OAuth token is not valid. 
 * ㅤ|The Authorization header is required and must contain a user access token or app access token. 
 * ㅤ|The access token must include the editor:manage:clips or channel:manage:clips scope 
 * ㅤ|The access token is not valid 
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token. 
 * 403 Forbidden|The user is not an editor for the specified broadcaster.
 * 500 Internal Error|Internal Server Error.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}