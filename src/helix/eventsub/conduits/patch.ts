import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** Conduit ID. */
	id: string;
	/** **Integer**. The new number of shards for this conduit. */
	shard_count: number;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** List of information about the client’s conduits. */
	data: object[];
	/** Conduit ID. */
		id: string;
	/** **Integer**. Number of shards associated with this conduit after the update. */
		shard_count: number;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "eventsub/conduits", Main.Options.apiHelixPath);
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			id: params.id,
			shard_count: params.shard_count,
		}),
	};
}

/**
 * ## [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits)
 * Updates a [conduit’s](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) shard count. To delete shards, update the count to a lower number, and the shards above the count will be deleted. For example, if the existing shard count is 100, by resetting shard count to 50, shards 50-99 are disabled.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Conduit updated.
 * 400 Bad Request|Invalid shard count
 * ㅤ|The id query parameter is required.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 404 Not Found|Conduit not found.
 * ㅤ|Conduit’s owner must match the client ID in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}