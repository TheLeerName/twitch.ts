import * as Main from "../..";

export interface RequestQueryParameters {
	/** The client ID that the [generate](https://dev.twitch.tv/docs/cli/mock-api-command/#generating-the-data) sub-command created for you. To get the ID programmatically, see [Getting your client ID and secret](https://dev.twitch.tv/docs/cli/mock-api-command/#get-client-id). */
	client_id: string;
	/** The client secret that the [generate](https://dev.twitch.tv/docs/cli/mock-api-command/#generating-the-data) sub-command created for you. To get the secret programmatically, see [Getting your client ID and secret](https://dev.twitch.tv/docs/cli/mock-api-command/#get-client-id). */
	client_secret: string;
	/** The user to get the token for. */
	user_id: string;
	/** A space-delimited list of scopes to request for the given user. For the required scopes, see the documentation for the endpoints you plan to call. */
	scope: string[];
}

export type RequestParameters = Main.RequestParameters & RequestQueryParameters;

export interface ResponseBody {
	access_token: string;
	/** Empty string. */
	refresh_token: "";
	/** in seconds */
	expires_in: number;
	scope?: string[];
	token_type: "bearer";
}

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.idOAuth2Path,
		url: "authorize",
		method: "POST",
		params: {
			client_id: params.client_id,
			client_secret: params.client_secret,
			grant_type: "user_token",
			user_id: params.user_id,
			scope: params.scope.join(" "),
		},
		...params.config,
	};
}

/**
 * ## [Getting a user access token](https://dev.twitch.tv/docs/cli/mock-api-command/#getting-a-user-access-token)
 * **NOTE:** This endpoint can be used only on mock API of [Twitch CLI](https://dev.twitch.tv/docs/cli/). For getting user access token on real API, check test with Getting user access token via Authorization Code.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, Main.ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}