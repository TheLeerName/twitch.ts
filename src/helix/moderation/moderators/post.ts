import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:moderators`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the chat room. This ID must match the user ID in the access token. */
	broadcaster_id: string;
	/** The ID of the user to add as a moderator in the broadcaster’s chat room. */
	user_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "moderation/moderators", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		user_id: params.user_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Add Moderator](https://dev.twitch.tv/docs/api/reference/#add-channel-moderator)
 * Adds a moderator to the broadcaster’s chat room.

 * **Rate Limits**: The broadcaster may add a maximum of 10 moderators within a 10-second window.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully added the moderator.
 * 400 Bad Request|The ID in `broadcaster_id` was not found.
 * ㅤ|The ID in `user_id` was not found.
 * ㅤ|The user in `user_id` is already a moderator in the broadcaster's chat room.
 * ㅤ|The user in `user_id` cannot become a moderator because they're banned from the channel.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:moderators** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 422 Unprocessable Entity|The user in `user_id` is a VIP. To make them a moderator, you must first remove them as a VIP (see {@link Helix.RemoveVIP | Remove VIP}).
 * 429 Too Many Requests|The broadcaster has exceeded the number of requests allowed within a 10-second window. See this endpoint's rate limits.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}