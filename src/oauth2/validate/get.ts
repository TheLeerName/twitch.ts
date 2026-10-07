import * as Main from "../..";

export interface RequestQueryParameters {
	/** App or user access token to validate. */
	token: string;
}

export type RequestParameters = Main.RequestParameters & RequestQueryParameters;

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

export interface ResponseBodyError extends Main.ResponseBodyError {
	/**
	 * HTTP error message. Can be:
	 * Value|Reason
	 * -|-
	 * `missing authorization token`|`token` is empty string
	 * `invalid access token`|`token` is not valid
	 */
	message:
	| "missing authorization token"
	| "invalid access token";
}

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.idOAuth2Path,
		url: "validate",
		method: "GET",
		headers: {
			authorization: `Bearer ${params.token}`,
		},
		...params.config,
	};
}

/**
 * ## [Validating Tokens](https://dev.twitch.tv/docs/authentication/validate-tokens/)
 * The Twitch authorization service provides this endpoint that you can use to validate your OAuth access token or discover information about the token, such as when it expires, its scopes, and the user that authorized the client to access their resources.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}