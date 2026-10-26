import * as Main from "../../..";

export interface Authorization {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:stream_key`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	token: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster that owns the channel. The ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export type RequestParameters = Main.RequestParameters & Authorization & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the channel’s stream key. */
	data: [{
		/** The channel’s stream key. */
		stream_key: string;
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "streams/key",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: `Bearer ${params.token}`,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
		},
		...params.config,
	};
}

/**
 * ## [Get Stream Key](https://dev.twitch.tv/docs/api/reference/#get-stream-key)
 * Gets the channel’s stream key.

 * ### Response Codes
 * Code|Decription
 * -|-
 * 200 OK|Successfully retrieved the stream’s key.
 * 400 Bad Request|The `broadcaster_id` field is required.
 * ㅤ|The ID in the `broadcaster_id` field is not valid.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:stream_key** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 403 Forbidden|The user must complete additional steps in order to stream. Present the user with the returned error message.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}