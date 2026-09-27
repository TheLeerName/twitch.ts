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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * The ID of the user whose username color you want to get. The maximum number of IDs that you may specify is 100.

	 * The API ignores duplicate IDs and IDs that weren’t found.
	 */
	user_id: string | string[];
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of users and the color code they use for their name. */
	data: {
		/** An ID that uniquely identifies the user. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** The Hex color code that the user uses in chat for their name. If the user hasn’t specified a color in their settings, the string is empty. */
		color: string;
	}[];
}

/**
 * ## [Get User Chat Color](https://dev.twitch.tv/docs/api/reference/#get-user-chat-color)
 * Gets the color used for the user’s name in chat.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the chat color used by the specified users.
 * 400 Bad Request|The ID in the `user_id` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "chat/color", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
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