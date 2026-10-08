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

export interface RequestQueryParameters {
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of broadcasts. The broadcasts are sorted by the number of viewers, with the most popular first. */
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
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` or `before` query parameter to get the next or previous page of results. */
		cursor?: string;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "games/top",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			first: params.first,
			after: params.after,
			before: params.before,
		},
		...params.config,
	};
}

/**
 * ## [Get Top Games](https://dev.twitch.tv/docs/api/reference/#get-top-games)
 * Gets information about all broadcasts on Twitch.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of broadcasts.
 * 400 Bad Request|The value in the `first` query parameter is not valid.
 * ㅤ|The cursor in the `after` or `before` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}