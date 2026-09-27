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
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the `user_id` in the user access token. */
	moderator_id: string;
	/** The ID of the Guest Star session in which to update slot settings. */
	session_id: string;
	/** The slot assignment previously assigned to a user. */
	source_slot_id: string;
	/** The slot to move this user assignment to. If the destination slot is occupied, the user assigned will be swapped into `source_slot_id`. */
	destination_slot_id?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Update Guest Star Slot](https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot)
 * Allows a user to update the assigned slot for a particular user within the active Guest Star session.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfuly updated slot(s)
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing or invalid `session_id` 
 * ㅤ|Missing or invalid `slot_id`
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "guest_star/slot", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
		session_id: params.session_id,
		source_slot_id: params.source_slot_id,
		destination_slot_id: params.destination_slot_id,
	});
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}