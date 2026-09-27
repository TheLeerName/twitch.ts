import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:manage:chat_color`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the user whose chat color you want to update. This ID must match the user ID in the access token. */
	user_id: string;
	/**
	 * The color to use for the user's name in chat. All users may specify one of the following named color values.
	 * - blue
	 * - blue_violet
	 * - cadet_blue
	 * - chocolate
	 * - coral
	 * - dodger_blue
	 * - firebrick
	 * - golden_rod
	 * - green
	 * - hot_pink
	 * - orange_red
	 * - red
	 * - sea_green
	 * - spring_green
	 * - yellow_green

	 * Turbo and Prime users may specify a named color or a Hex color code like #9146FF.
	 */
	color: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Update User Chat Color](https://dev.twitch.tv/docs/api/reference/#update-user-chat-color)
 * Updates the color used for the user’s name in chat.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the user's chat color.
 * 400 Bad Request|The ID in the `user_id` query parameter is not valid.
 * ㅤ|The `color` query parameter is required.
 * ㅤ|The named color in the `color` query parameter is not valid.
 * ㅤ|To specify a Hex color code, the user must be a Turbo or Prime user.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:manage:chat_color** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the `user_id` query parameter must match the user ID in the access token.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "chat/color", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		color: params.color,
	});
	return global.fetch(url as any, {
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}