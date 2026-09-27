import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:schedule`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster that owns the streaming schedule. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID of the broadcast segment to remove. */
	id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Delete Channel Stream Schedule Segment](https://dev.twitch.tv/docs/api/reference/#delete-channel-stream-schedule-segment)
 * Removes a broadcast segment from the broadcaster’s streaming schedule.

 * **NOTE**: For recurring segments, removing a segment removes all segments in the recurring schedule.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully removed the broadcast segment.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The `id` query parameter is required.
 * ㅤ|The ID in the `id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:schedule** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<undefined>> {
	const url = new Helix.URL(params.apiPath ?? "schedule/segment", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		id: params.id,
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