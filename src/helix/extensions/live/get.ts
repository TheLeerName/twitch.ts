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
	/** The ID of the extension to get. Returns the list of broadcasters that are live and that have installed or activated this extension. */
	extension_id: string;
	/** **Integer**. The specific maximum number of items per page in the response. The actual number returned may be less than this limit. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	first?: number;
	/** The cursor used to get the next page of results. The `pagination` field in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of broadcasters that are streaming live and that have installed or activated the extension. */
	data: {
		/** The ID of the broadcaster that is streaming live and has installed or activated the extension. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The name of the category or game being streamed. */
		game_name: string;
		/** The ID of the category or game being streamed. */
		game_id: string;
		/** The title of the broadcaster’s stream. May be an empty string if not specified. */
		title: string;
	}[];
	/** This field contains the cursor used to page through the results. The field is empty if there are no more pages left to page through. Note that this field is a string compared to other endpoints that use a **Pagination** object. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: string;
}

/**
 * ## [Get Extension Live Channels](https://dev.twitch.tv/docs/api/reference/#get-extension-live-channels)
 * Gets a list of broadcasters that are streaming live and have installed or activated the extension.

 * It may take a few minutes for the list to include or remove broadcasters that have recently gone live or stopped broadcasting.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of broadcasters.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * ㅤ|The pagination cursor is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|The extension specified in the `extension_id` query parameter was not found or it's not being used in a live stream.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "extensions/live", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		extension_id: params.extension_id,
		first: params.first,
		after: params.after,
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