import { Options, Helix } from "../../..";

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

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the user to remove VIP status from. */
	user_id: string;
	/** The ID of the broadcaster who owns the channel where the user has VIP status. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Remove VIP](https://dev.twitch.tv/docs/api/reference/#remove-channel-vip)
 * Removes the specified user as a VIP in the broadcaster’s channel.

 * If the broadcaster is removing the user’s VIP status, the ID in the `broadcaster_id` query parameter must match the user ID in the access token; otherwise, if the user is removing their VIP status themselves, the ID in the `user_id` query parameter must match the user ID in the access token.

 * **Rate Limits**: The broadcaster may remove a maximum of 10 VIPs within a 10-second window.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully removed the VIP status from the user.
 * 400 Bad Request|The ID in `broadcaster_id` is not valid.
 * ㅤ|The ID in `user_id` is not valid.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:vips** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the `broadcaster_id` query parameter must match the user ID in the access token, unless the user ID in the access token is removing themselves as a VIP.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 403 Forbidden|The user in `broadcaster_id` doesn't have permission to remove the user's VIP status.
 * 404 Not Found|The ID in `broadcaster_id` was not found.
 * ㅤ|The ID in `user_id` was not found.
 * 422 Unprocessable Entity|The user in `user_id` is not a VIP in the broadcaster's channel.
 * 429 Too Many Requests|The broadcaster exceeded the number of VIPs that they may remove within a 10-second window. See Rate Limits for this endpoint above.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<undefined>> {
	const url = new Helix.URL(params.apiPath ?? "channels/vips", Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
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