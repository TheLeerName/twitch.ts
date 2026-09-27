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
	/** **Integer**. The number of shards to create for this conduit. */
	shard_count: number;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** List of information about the client’s conduits. */
	data: object[];
	/** Conduit ID. */
		id: string;
	/** **Integer**. Number of shards created for this conduit. */
		shard_count: number;
}

/**
 * ## [Create Conduits](https://dev.twitch.tv/docs/api/reference/#create-conduits)
 * Creates a new [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Conduit created.
 * 400 Bad Request|Invalid shard count.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 429 Too Many Requests|Conduit limit reached.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "eventsub/conduits", Main.Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			shard_count: params.shard_count,
		}),
	});
}