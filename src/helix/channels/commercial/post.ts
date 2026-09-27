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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:edit:commercial`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `channel:edit:commercial`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The ID of the partner or affiliate broadcaster that wants to run the commercial. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** **Integer**. The length of the commercial to run, in seconds. Twitch tries to serve a commercial that’s the requested length, but it may be shorter or longer. The maximum length you should request is 180 seconds. */
	length: number;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** An array that contains a single object with the status of your start commercial request. */
	data: [{
		/** **Integer**. The length of the commercial you requested. If you request a commercial that’s longer than 180 seconds, the API uses 180 seconds. */
		length: number;
		/** A message that indicates whether Twitch was able to serve an ad. */
		message: string;
		/** **Integer**. The number of seconds you must wait before running another commercial. */
		retry_after: number;
	}];
}

/**
 * ## [Start Commercial](https://dev.twitch.tv/docs/api/reference/#start-commercial)
 * Starts a commercial on the specified channel.

 * **NOTE**: Only partners and affiliates may run commercials and they must be streaming live at the time.

 * **NOTE**: Only the broadcaster may start a commercial; the broadcaster’s editors and moderators may not start commercials on behalf of the broadcaster.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully started the commercial.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `length` query parameter is required.
 * ㅤ|The ID in `broadcaster_id` is not valid.
 * ㅤ|To start a commercial, the broadcaster must be streaming live.
 * ㅤ|The broadcaster may not run another commercial until the cooldown period expires. The `retry_after` field in the previous start commercial response specifies the amount of time the broadcaster must wait between running commercials.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID found in the request’s OAuth token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:edit:commercial** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The ID in `broadcaster_id` was not found.
 * 429 Too Many Requests|The broadcaster may not run another commercial until the cooldown period expires. The `retry_after` field in the previous start commercial response specifies the amount of time the broadcaster must wait between running commercials.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "channels/commercial", Main.Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			broadcaster_id: params.broadcaster_id,
			length: params.length,
		}),
	});
}