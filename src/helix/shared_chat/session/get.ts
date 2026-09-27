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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The User ID of the channel broadcaster. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	data: [{
		/** The unique identifier for the shared chat session. */
		session_id: string;
		/** The User ID of the host channel. */
		host_broadcaster_id: string;
		/** The list of participants in the session. */
		participants: object[];
		/** The User ID of the participant channel. */
		broadcaster_id: string;
		/** The UTC date and time (in RFC3339 format) for when the session was created. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) for when the session was last updated. */
		updated_at: string;
	}];
}

/**
 * ## [Get Shared Chat Session](https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session)
 * Retrieves the active shared chat session for a channel.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the shared chat session. Returns an empty array if the broadcaster_id in the request isn’t in a shared chat session.
 * 400 Bad Request|The ID in the `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The OAuth token is not valid.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * 500 Internal Error|Internal Server Error.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "shared_chat/session", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}