import * as Main from "../../..";

export interface Authorization {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	token: string;
}

export type RequestParameters = Main.RequestParameters & Authorization;

export interface ResponseBody {
	/** List of information about the client’s conduits. */
	data: {
		/** Conduit ID. */
		id: string;
		/** **Integer**. Number of shards associated with this conduit. */
		shard_count: number;
	}[];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "eventsub/conduits",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: `Bearer ${params.token}`,
		},
		...params.config,
	};
}

/**
 * ## [Get Conduits](https://dev.twitch.tv/docs/api/reference/#get-conduits)
 * Gets the [conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) for a client ID.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Successfully retrieved conduits.
 * 401 Unauthenticated|Authorization header required with an app access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}