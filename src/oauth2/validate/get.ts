import * as Main from "../..";

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** App or user access token to validate. */
	token: string;
}

export type RequestParameters = RequestQueryParameters;

export type ResponseBody = ResponseBody.AppAccessToken | ResponseBody.UserAccessToken;
export namespace ResponseBody {
	export interface Base {
		/** The Client ID associated with the access token. */
		client_id: string;
		/** A list of scopes granted to the access token. */
		// TODO: add Authorization.Scope here
		scopes: string[];
		/** **Integer**. The amount of seconds from now in which the token will expire. */
		expires_in: number;
		/** The lowercase username for the user associated with the access token. If the access token is an App Access Token, this field will be not included in response. */
		login?: string;
		/** The user ID associated with the access token. If the access token is an App Access Token, this field will be not included in response. */
		user_id?: string;
	}
	export interface AppAccessToken extends Base {
		login: undefined;
		user_id: undefined;
	}
	export interface UserAccessToken extends Base {
		login: string;
		user_id: string;
	}
}

export interface ResponseBodyError {
	/** HTTP error status code. */
	status: number;
	/**
	 * HTTP error message. Can be:
	 * Value|Reason
	 * -|-
	 * `missing authorization token`|`token` is empty string
	 * `invalid access token`|`token` is not valid
	 */
	message: string;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "validate", Main.Options.idOAuth2Path);
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		headers: {
			authorization: `Bearer ${params.token}`
		},
		signal: params.signal,
	};
}

/**
 * ## [Validating Tokens](https://dev.twitch.tv/docs/authentication/validate-tokens/)
 * The Twitch authorization service provides this endpoint that you can use to validate your OAuth access token or discover information about the token, such as when it expires, its scopes, and the user that authorized the client to access their resources.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}