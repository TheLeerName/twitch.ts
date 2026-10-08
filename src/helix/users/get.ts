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
	/** The ID of the user to get. The maximum number of IDs you may specify is 100. */
	id?: string | string[];
	/** The login name of the user to get. The maximum number of login names you may specify is 100. */
	login?: string | string[];
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of users. */
	data: User[];
}

export interface User {
	/** An ID that identifies the user. */
	id: string;
	/** The user’s login name. */
	login: string;
	/** The user’s display name. */
	display_name: string;
	/**
	 * The type of user. Possible values are: 
	 * - admin — Twitch administrator 
	 * - global_mod
	 * - staff — Twitch staff
	 * - "" — Normal user
	 */
	type: "admin" | "global_mod" | "staff" | "";
	/**
	 * The type of broadcaster. Possible values are: 
	 * - affiliate — An affiliate broadcaster [affiliate broadcaster](https://help.twitch.tv/s/article/joining-the-affiliate-program%20target=)
	 * - partner — A partner broadcaster [partner broadcaster](https://help.twitch.tv/s/article/partner-program-overview)
	 * - "" — A normal broadcaster
	 */
	broadcaster_type: "affiliate" | "partner" | "";
	/** The user’s description of their channel. */
	description: string;
	/** A URL to the user’s profile image. */
	profile_image_url: string;
	/** A URL to the user’s offline image. */
	offline_image_url: string;
	/**
	 * **Integer**. The number of times the user’s channel has been viewed.

		*  **NOTE**: This field has been deprecated (see [Get Users API endpoint – “view_count” deprecation](https://discuss.dev.twitch.tv/t/get-users-api-endpoint-view-count-deprecation/37777)). Any data in this field is not valid and should not be used.
		*/
	view_count: number;
	/**
	 * The user’s verified email address. The object includes this field only if the user access token includes the **user:read:email** scope.

		* If the request contains more than one user, only the user associated with the access token that provided consent will include an email address — the email address for all other users will be empty.
		*/
	email?: string;
	/** The UTC date and time that the user’s account was created. The timestamp is in RFC3339 format. */
	created_at: string;
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "users",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			id: params.id,
			login: params.login,
		},
		...params.config,
	};
}

/**
 * ## [Get Users](https://dev.twitch.tv/docs/api/reference/#get-users)
 * Gets information about one or more users.

 * You may look up users using their user ID, login name, or both but the sum total of the number of users you may look up is 100. For example, you may specify 50 IDs and 50 names or 100 IDs or names, but you cannot specify 100 IDs and 100 names.

 * If you don’t specify IDs or login names, the request returns information about the user in the access token if you specify a user access token.

 * To include the user’s verified email address in the response, you must use a user access token that includes the **user:read:email** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the specified users’ information.
 * 400 Bad Request|The *id* or *login* query parameter is required unless the request uses a user access token.
 * ㅤ|The request exceeded the maximum allowed number of *id* and/or *login* query parameters.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}