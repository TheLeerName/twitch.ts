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
	/** The ID of the Guest Star session in which to assign the slot. */
	session_id: string;
	/** The Twitch User ID corresponding to the guest to assign a slot in the session. This user must already have an invite to this session, and have indicated that they are ready to join. */
	guest_id: string;
	/** The slot assignment to give to the user. Must be a numeric identifier between “1” and “N” where N is the max number of slots for the session. Max number of slots allowed for the session is reported by {@link Helix.GetChannelGuestStarSettings | Get Channel Guest Star Settings}. */
	slot_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Assign Guest Star Slot](https://dev.twitch.tv/docs/api/reference/#assign-guest-star-slot)
 * Allows a previously invited user to be assigned a slot within the active Guest Star session, once that guest has indicated they are ready to join.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfuly assigned guest to slot
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing `moderator_id` 
 * ㅤ|Missing `guest_id` 
 * ㅤ|Missing or invalid `session_id` 
 * ㅤ|Missing or invalid `slot_id`
 * 401 Unauthorized|`moderator_id` is not a guest star moderator
 * 403 Forbidden|Cannot assign host slot 
 * ㅤ|Guest not invited to session 
 * ㅤ|Guest already assigned to slot 
 * ㅤ|Guest is not ready to join
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "guest_star/slot", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
		session_id: params.session_id,
		guest_id: params.guest_id,
		slot_id: params.slot_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}