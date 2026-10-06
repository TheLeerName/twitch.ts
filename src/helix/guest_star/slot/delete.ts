import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:manage:guest_star` or `moderator:manage:guest_star`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster running the Guest Star session. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** The ID of the Guest Star session in which to remove the slot assignment. */
	session_id: string;
	/** The Twitch User ID corresponding to the guest to remove from the session. */
	guest_id: string;
	/** The slot ID representing the slot assignment to remove from the session. */
	slot_id: string;
	/** Flag signaling that the guest should be reinvited to the session, sending them back to the invite queue. */
	should_reinvite_guest?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "guest_star/slot", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
		session_id: params.session_id,
		guest_id: params.guest_id,
		slot_id: params.slot_id,
		should_reinvite_guest: params.should_reinvite_guest,
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
 * ## [Delete Guest Star Slot](https://dev.twitch.tv/docs/api/reference/#delete-guest-star-slot)
 * Allows a caller to remove a slot assignment from a user participating in an active Guest Star session. This revokes their access to the session immediately and disables their access to publish or subscribe to media within the session.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfuly removed user from slot
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing `moderator_id` 
 * ㅤ|Missing or invalid `session_id` 
 * ㅤ|Missing or invalid `slot_id`
 * 403 Forbidden|`moderator_id` is not a Guest Star moderator 
 * ㅤ|The request is attempting to modify a restricted slot
 * 404 Not Found|`guest_id` or `slot_id` not found
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}