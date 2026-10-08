import * as Main from "../..";

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

export interface RequestQueryParameters {
	/** The ID of the category or game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found. */
	id?: string | string[];
	/** The name of the category or game to get. The name must exactly match the category’s or game’s title. You may specify a maximum of 100 names. The endpoint ignores duplicate names and names that weren’t found. */
	name?: string | string[];
	/** The [IGDB](https://www.igdb.com/) ID of the game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found. */
	igdb_id?: string | string[];
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of categories and games. The list is empty if the specified categories and games weren’t found. */
	data: {
		/** An ID that identifies the category or game. */
		id: string;
		/** The category’s or game’s name. */
		name: string;
		/** A URL to the category’s or game’s box art. You must replace the `{width}x{height}` placeholder with the size of image you want. */
		box_art_url: string;
		/** The ID that [IGDB](https://www.igdb.com/) uses to identify this game. If the IGDB ID is not available to Twitch, this field is set to an empty string. */
		igdb_id: string;
	}[];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "games",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			id: params.id,
			name: params.name,
			igdb_id: params.igdb_id,
		},
		...params.config,
	};
}

/**
 * ## [Get Games](https://dev.twitch.tv/docs/api/reference/#get-games)
 * Gets information about specified categories or games.

 * You may get up to 100 categories or games by specifying their ID or name. You may specify all IDs, all names, or a combination of IDs and names. If you specify a combination of IDs and names, the total number of IDs and names must not exceed 100.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the specified games.
 * 400 Bad Request|The request must specify the `id` or `name` or `igdb_id` query parameter.
 * ㅤ|The combined number of game IDs (`id` and `igdb_id`) and game names that you specify in the request must not exceed 100.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}