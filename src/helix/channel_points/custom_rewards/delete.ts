import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:redemptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that created the custom reward. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** The ID of the custom reward to delete. */
	id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "channel_points/custom_rewards", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
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
 * ## [Delete Custom Reward](https://dev.twitch.tv/docs/api/reference/#delete-custom-reward)
 * Deletes a custom reward that the broadcaster created.

 * The app used to create the reward is the only app that may delete it. If the reward’s redemption status is UNFULFILLED at the time the reward is deleted, its redemption status is marked as FULFILLED.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 204 No Content|Successfully deleted the custom reward.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * ㅤ|The user access token must include the **channel:manage:redemptions** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to create the custom reward.
 * ㅤ|The broadcaster is not a partner or affiliate.
 * 404 Not Found|The custom reward specified in the `id` query parameter was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}