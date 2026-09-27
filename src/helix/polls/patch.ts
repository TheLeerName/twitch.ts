import * as Main from "../..";
import { Poll } from "./get";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:polls`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The ID of the broadcaster that’s running the poll. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID of the poll to update. */
	id: string;
	/**
	 * The status to set the poll to. Possible case-sensitive values are:
	 * - TERMINATED — Ends the poll before the poll is scheduled to end. The poll remains publicly visible.
	 * - ARCHIVED — Ends the poll before the poll is scheduled to end, and then archives it so it's no longer publicly visible.
	 */
	status: "TERMINATED" | "ARCHIVED";
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the poll that you ended. */
	data: [Poll];
}

/**
 * ## [End Poll](https://dev.twitch.tv/docs/api/reference/#end-poll)
 * Ends an active poll. You have the option to end it or end it and archive it.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully ended the poll.
 * 400 Bad Request|The `broadcaster_id` field is required.
 * ㅤ|The `id` field is required.
 * ㅤ|The `status` field is required.
 * ㅤ|The value in the `status` field is not valid.
 * ㅤ|The poll must be active to terminate or archive it.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:polls** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "polls", Main.Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			broadcaster_id: params.broadcaster_id,
			id: params.id,
			status: params.status,
		}),
	});
}