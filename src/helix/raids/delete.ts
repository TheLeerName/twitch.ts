import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:raids`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that initiated the raid. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Cancel Raid](https://dev.twitch.tv/docs/api/reference/#cancel-raid)
 * Cancel a pending raid.

 * You can cancel a raid at any point up until the broadcaster clicks **Raid Now** in the Twitch UX or the 90-second countdown expires.

 * **Rate Limit**: The limit is 10 requests within a 10-minute window.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|The pending raid was successfully canceled.
 * 400 Bad Request|The ID in the `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID found in the request’s OAuth token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:raids** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The broadcaster doesn't have a pending raid to cancel.
 * 429 Too Many Requests|The broadcaster exceeded the number of raid requests that they may make. The limit is 10 requests within a 10-minute window.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "raids", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}