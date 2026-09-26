import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:read:guest_star,` `channel:manage:guest_star,` `moderator:read:guest_star` or `moderator:manage:guest_star`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster running the Guest Star session. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the `user_id` in the user access token. */
	moderator_id: string;
	/** The session ID to query for invite status. */
	session_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of invite objects describing the invited user as well as their ready status. */
	data: {
		/** Twitch User ID corresponding to the invited guest */
		user_id: string;
		/** Timestamp when this user was invited to the session. */
		invited_at: string;
		/**
		 * Status representing the invited user’s join state. Can be one of the following: 
		 * - `INVITED`: The user has been invited to the session but has not acknowledged it. 
		 * - `ACCEPTED`: The invited user has acknowledged the invite and joined the waiting room, but may still be setting up their media devices or otherwise preparing to join the call. 
		 * - `READY`: The invited user has signaled they are ready to join the call from the waiting room.
		 */
		status: "INVITED" | "ACCEPTED" | "READY";
		/** Flag signaling that the invited user has chosen to disable their local video device. The user has hidden themselves, but they may choose to reveal their video feed upon joining the session. */
		is_video_enabled: boolean;
		/** Flag signaling that the invited user has chosen to disable their local audio device. The user has muted themselves, but they may choose to unmute their audio feed upon joining the session. */
		is_audio_enabled: boolean;
		/** Flag signaling that the invited user has a video device available for sharing. */
		is_video_available: boolean;
		/** Flag signaling that the invited user has an audio device available for sharing. */
		is_audio_available: boolean;
	}[];
}

/**
 * ## [Get Guest Star Invites](https://dev.twitch.tv/docs/api/reference/#get-guest-star-invites)
 * Provides the caller with a list of pending invites to a Guest Star session, including the invitee’s ready status while joining the waiting room.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s Guest Star invites.
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing `session_id`
 * 403 Forbidden|The user specified in the `moderator_id` is not permitted to view the broadcaster’s invites.
 * 404 Not Found|Invalid `session_id`
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "guest_star/invites", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
		session_id: params.session_id,
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