import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:stream_key`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the channel. The ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the channel’s stream key. */
	data: [{
		/** The channel’s stream key. */
		stream_key: string;
	}];
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
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "streams/key", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
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