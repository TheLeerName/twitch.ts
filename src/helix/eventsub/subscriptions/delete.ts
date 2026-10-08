import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token.
	 *   - If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the subscription to delete. */
	id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "eventsub/subscriptions",
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			id: params.id,
		},
		...params.config,
	};
}

/**
 * ## [Delete EventSub Subscription](https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)
 * Deletes an EventSub subscription.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully deleted the subscription.
 * 400 Bad Request|The `id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|The subscription was not found.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}