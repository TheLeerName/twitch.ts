import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:vips`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the user to give VIP status to. */
	user_id: string;
	/** The ID of the broadcaster that’s adding the user as a VIP. This ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Add VIP](https://dev.twitch.tv/docs/api/reference/#add-channel-vip)
 * Adds the specified user as a VIP in the broadcaster’s channel.

 * **Rate Limits**: The broadcaster may add a maximum of 10 VIPs within a 10-second window.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully added the VIP.
 * 400 Bad Request|The user in the `user_id` query parameter is blocked from the broadcaster's channel.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The ID in the `user_id` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:vips** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The ID in `broadcaster_id` was not found.
 * ㅤ|The ID in `user_id` was not found.
 * 409 Conflict|The broadcaster doesn’t have available VIP slots. [Read More](https://help.twitch.tv/s/article/Managing-Roles-for-your-Channel?language=en_US#types)
 * 422 Unprocessable Entity|The user in `user_id` is a moderator. To make them a VIP, you must first remove them as a moderator (see {@link Helix.RemoveModerator | Remove Moderator}).
 * ㅤ|The user in the `user_id` query parameter is already a VIP.
 * 425 Too Early|The broadcaster must complete the Build a Community requirement before they may assign VIPs.
 * 429 Too Many Requests|The broadcaster exceeded the number of VIP that they may add within a 10-second window. See Rate Limits for this endpoint above.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "channels/vips", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}