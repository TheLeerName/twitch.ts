import * as Main from "../../..";

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID. */
	client_id: string;
	/** Your app’s registered client secret. */
	client_secret: string;
}

export type RequestParameters = RequestQueryParameters;

export interface ResponseBody {
	access_token: string;
	expires_in: number;
	token_type: "bearer";
}

export interface ResponseBodyError {
	/** HTTP error status code. */
	status: number;
	/** HTTP error message. */
	message: string;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "token", Main.Options.idOAuth2Path);
	url.searchParams.appendMany({
		client_id: params.client_id,
		client_secret: params.client_secret,
		grant_type: "client_credentials",
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
 * ## [Client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow)
 * Gets app access token, this is meant only for server-to-server API requests that use an app access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}