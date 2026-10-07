import * as Main from "../../..";

export interface RequestQueryParameters {
	/** Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID. */
	client_id: string;
	/** Your app’s registered client secret. */
	client_secret: string;
}

export type RequestParameters = Main.RequestParameters & RequestQueryParameters;

export interface ResponseBody {
	access_token: string;
	/** in seconds */
	expires_in: number;
	token_type: "bearer";
}

export interface ResponseBodyError extends Main.ResponseBodyError {
	/**
	 * HTTP error message. Can be:
	 * Value|Reason
	 * -|-
	 * `missing client id`|`client_id` is empty string
	 * `invalid client`|`client_id` is not valid
	 * `missing client secret`|`client_secret` is empty string
	 * `invalid client secret`|`client_secret` is not valid
	 */
	message:
	| "missing client id"
	| "invalid client"
	| "missing client secret"
	| "invalid client secret";
}

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.idOAuth2Path,
		url: "token",
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		params: {
			client_id: params.client_id,
			client_secret: params.client_secret,
			grant_type: "client_credentials",
		},
		...params.config,
	};
}

/**
 * ## [Client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow)
 * Gets app access token, this is meant only for server-to-server API requests that use an app access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}