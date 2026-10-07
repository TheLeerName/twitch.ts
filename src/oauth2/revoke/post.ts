import * as Main from "../..";

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID. */
	client_id: string;
	/** The app or user access token to revoke. */
	token: string;
}

export type RequestParameters = RequestQueryParameters;

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
	message: string;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "revoke", Main.Options.idOAuth2Path);
	url.searchParams.appendMany({
		client_id: params.client_id,
		token: params.token,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		signal: params.signal,
	};
}

/**
 * ## [Revoking Access Tokens](https://dev.twitch.tv/docs/authentication/revoke-tokens/)
 * If your app no longer needs an access token, you can revoke it by using this method.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined, ResponseBodyError>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}