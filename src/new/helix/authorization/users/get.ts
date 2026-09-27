import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the user(s) you want to check authorization for. The maximum number of IDs you may specify is 10. */
	user_id: string | string[];
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** List of users and their authorized scopes. */
	data: {
		/** The user’s ID. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
		/** An array of all the scopes the user has granted to the client ID. */
		scopes: string[];
		// TODO: add Authorization.Scope here
		/** A boolean indicating whether or not the specified user has authorized this application. */
		has_authorized: boolean;
	}[];
}

/**
 * ## [Get Authorization By User](https://dev.twitch.tv/docs/api/reference/#get-authorization-by-user)
 * Gets the authorization scopes that the specified user(s) have granted the application.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved user authorization.
 * 400 Bad Request|Request is malformed - invalid parameters or missing parameters.
 * 401 Unauthorized|     
 * ㅤ|The access token is not valid. 
 * ㅤ|Authorization header is required and must specify an app access token. 
 * 403 Forbidden|The client-id in the header must match the client ID in the access token.
 * 500 Internal Error|Internal Server Error.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "authorization/users", Options.apiHelixPath);
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