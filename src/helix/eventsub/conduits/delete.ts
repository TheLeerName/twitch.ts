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

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Conduit ID. */
	id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "eventsub/conduits", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		id: params.id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Delete Conduit](https://dev.twitch.tv/docs/api/reference/#delete-conduit)
 * Deletes a specified [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/). Note that it may take some time for Eventsub subscriptions on a deleted [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) to show as disabled when calling {@link Helix.GetEventSubSubscriptions | Get Eventsub Subscriptions}.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfully deleted the conduit.
 * 400 Bad Request|The id query parameter is required.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 404 Not Found|Conduit not found.
 * ㅤ|Conduit’s owner must match the client ID in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}