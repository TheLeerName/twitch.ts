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

export interface RequestQueryParameters {
	/** The ID of the broadcaster running the Guest Star session. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** The ID of the Guest Star session in which to update a slot’s settings. */
	session_id: string;
	/** The slot assignment that has previously been assigned to a user. */
	slot_id: string;
	/** Flag indicating whether the slot is allowed to share their audio with the rest of the session. If false, the slot will be muted in any views containing the slot. */
	is_audio_enabled?: boolean;
	/** Flag indicating whether the slot is allowed to share their video with the rest of the session. If false, the slot will have no video shared in any views containing the slot. */
	is_video_enabled?: boolean;
	/** Flag indicating whether the user assigned to this slot is visible/can be heard from any public subscriptions. Generally, this determines whether or not the slot is enabled in any broadcasting software integrations. */
	is_live?: boolean;
	/** **Integer**. Value from 0-100 that controls the audio volume for shared views containing the slot. */
	volume?: number;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "guest_star/slot_settings",
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			session_id: params.session_id,
			slot_id: params.slot_id,
			is_audio_enabled: params.is_audio_enabled,
			is_video_enabled: params.is_video_enabled,
			is_live: params.is_live,
			volume: params.volume,
		},
		...params.config,
	};
}

/**
 * ## [Update Guest Star Slot Settings](https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot-settings)
 * Allows a user to update slot settings for a particular guest within a Guest Star session, such as allowing the user to share audio or video within the call as a host. These settings will be broadcasted to all subscribers which control their view of the guest in that slot. One or more of the optional parameters to this API can be specified at any time.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfuly updated slot settings
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing `moderator_id` 
 * ㅤ|Missing or invalid `session_id` 
 * ㅤ|Missing or invalid `slot_id`
 * 403 Forbidden|`moderator_id` is not a Guest Star moderator 
 * ㅤ|The request is attempting to modify a restricted slot
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}