import { Options, Helix } from "../../..";

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

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/**
	 * The ID of the broadcaster whose active extensions you want to get.

	 * This parameter is required if you specify an app access token and is optional if you specify a user access token. If you specify a user access token and don’t specify this parameter, the API uses the user ID from the access token.
	 */
	user_id?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The active extensions that the broadcaster has installed. */
	data: {
		/** A dictionary that contains the data for a panel extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the panel’s data for each key. */
		panel: Record<string, {
			/** A Boolean value that determines the extension’s activation state. If **false**, the user has not configured this panel extension. */
			active: boolean;
			/** An ID that identifies the extension. */
			id: string;
			/** The extension’s version. */
			version: string;
			/** The extension’s name. */
			name: string;
		}>;
		/** A dictionary that contains the data for a video-overlay extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the overlay’s data for each key. */
		overlay: Record<string, {
			/** A Boolean value that determines the extension’s activation state. If **false**, the user has not configured this overlay extension. */
			active: boolean;
			/** An ID that identifies the extension. */
			id: string;
			/** The extension’s version. */
			version: string;
			/** The extension’s name. */
			name: string;
		}>;
		/** A dictionary that contains the data for a video-component extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the component’s data for each key. */
		component: Record<string, {
			/** A Boolean value that determines the extension’s activation state. If **false**, the user has not configured this component extension. */
			active: boolean;
			/** An ID that identifies the extension. */
			id: string;
			/** The extension’s version. */
			version: string;
			/** The extension’s name. */
			name: string;
			/** **Integer**. The x-coordinate where the extension is placed. */
			x: number;
			/** **Integer**. The y-coordinate where the extension is placed. */
			y: number;
		}>;
	};
}

/**
 * ## [Get User Active Extensions](https://dev.twitch.tv/docs/api/reference/#get-user-active-extensions)
 * Gets the active extensions that the broadcaster has installed for each configuration.

 * NOTE: To include extensions that you have under development, you must specify a user access token that includes the **user:read:broadcast** or **user:edit:broadcast** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the user's active extensions.
 * 400 Bad Request|The `user_id` query parameter is required if you specify an app access token.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "users/extensions", Options.apiHelixPath);
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