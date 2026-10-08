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
	/** The URI-encoded search string. For example, encode `#archery` as `%23archery` and search strings like `angel of death` as `angel%20of%20death`. */
	query: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of games or categories that match the query. The list is empty if there are no matches. */
	data: {
		/** A URL to an image of the game’s box art or streaming category. */
		box_art_url: string;
		/** The name of the game or category. */
		name: string;
		/** An ID that uniquely identifies the game or category. */
		id: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "search/categories",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			query: params.query,
			first: params.first,
			after: params.after,
		},
		...params.config,
	};
}

/**
 * ## [Search Categories](https://dev.twitch.tv/docs/api/reference/#search-categories)
 * Gets the games or categories that match the specified query.

 * To match, the category’s name must contain all parts of the query string. For example, if the query string is 42, the response includes any category name that contains 42 in the title. If the query string is a phrase like `love computer`, the response includes any category name that contains the words love and computer anywhere in the name. The comparison is case insensitive.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of category names that matched the specified query string.
 * 400 Bad Request|The `query` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}