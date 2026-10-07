import * as Main from "../..";

export interface RequestQueryParameters {
	/** Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID. */
	client_id: string;
	/** The app or user access token to revoke. */
	token: string;
}

export type RequestParameters = Main.RequestParameters & RequestQueryParameters;

export interface ResponseBodyError {
	/** HTTP error status code. */
	status: number;
	/**
	 * HTTP error message. Can be:
	 * Value|Reason
	 * -|-
	 * `missing client id`|`client_id` is empty string
	 * `invalid client`|`client_id` is not valid
	 * `missing oauth token`|`token` is empty string
	 * `token Invalid token`|`token` is not valid
	 */
	message:
	| "missing client id"
	| "invalid client"
	| "missing oauth token"
	| "token Invalid token";
}

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.idOAuth2Path,
		url: "revoke",
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		params: {
			client_id: params.client_id,
			token: params.token,
		},
		...params.config,
	};
}

/**
 * ## [Revoking Access Tokens](https://dev.twitch.tv/docs/authentication/revoke-tokens/)
 * If your app no longer needs an access token, you can revoke it by using this method.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}