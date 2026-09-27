import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:editors`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the channel. This ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of users that are editors for the specified broadcaster. The list is empty if the broadcaster doesn’t have editors. */
	data: {
		/** An ID that uniquely identifies a user with editor permissions. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The date and time, in RFC3339 format, when the user became one of the broadcaster’s editors. */
		created_at: string;
	}[];
}

/**
 * ## [Get Channel Editors](https://dev.twitch.tv/docs/api/reference/#get-channel-editors)
 * Gets the broadcaster’s list editors.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's list of editors.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID found in the OAuth token.
 * ㅤ|The Authorization header is required and must specify a user access token.
 * ㅤ|The OAuth token must include the **channel:read:editors** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "channels/editors", Main.Options.apiHelixPath);
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