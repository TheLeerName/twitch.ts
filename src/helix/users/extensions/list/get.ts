import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `user:read:broadcast` or `user:edit:broadcast`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}. To include inactive extensions, you must include the `user:edit:broadcast` scope.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters;

export interface ResponseBody {
	/** The list of extensions that the user has installed. */
	data: {
		/** An ID that identifies the extension. */
		id: string;
		/** The extension's version. */
		version: string;
		/** The extension's name. */
		name: string;
		/** A Boolean value that determines whether the extension is configured and can be activated. Is **true** if the extension is configured and can be activated. */
		can_activate: boolean;
		/**
		 * The extension types that you can activate for this extension. Possible values are:
		 * - component
		 * - mobile
		 * - overlay
		 * - panel
		 */
		type: ("component" | "mobile" | "overlay" | "panel")[];
	}[];
}

/**
 * ## [Get User Extensions](https://dev.twitch.tv/docs/api/reference/#get-user-extensions)
 * Gets a list of all extensions (both active and inactive) that the broadcaster has installed. The user ID in the access token identifies the broadcaster.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the user's installed extensions.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:read:broadcast** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "users/extensions/list", Main.Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}