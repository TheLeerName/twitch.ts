import * as Main from "../..";

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

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "token", Main.Options.idOAuth2Path);
	url.searchParams.appendMany({
		client_id: params.client_id,
		client_secret: params.client_secret,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		signal: params.signal,
	};
}

/**
 * ## [Client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow)
 * The [client credentials grant flow](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3.4) is meant only for server-to-server API requests that use an app access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}