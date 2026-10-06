import * as Main from "../..";
import { User } from "./get";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:edit`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * The string to update the channel’s description to. The description is limited to a maximum of 300 characters.

	 * To remove the description, set this to empty string.
	 */
	description: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list contains the single user that you updated. */
	data: [User];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "users", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		description: params.description,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Update User](https://dev.twitch.tv/docs/api/reference/#update-user)
 * Updates the specified user’s information. The user ID in the OAuth token identifies the user whose information you want to update.

 * To include the user’s verified email address in the response, the user access token must also include the **user:read:email** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the specified user's information.
 * 400 Bad Request|The string in the `description` query parameter is too long.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:edit** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 429 Too Many Requests|The app exceeded the number of requests that it may make. 
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}