import * as Main from "../../..";

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

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** ID for the user hosting the Guest Star session. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** Summary of the session details */
	data: {
		/** ID uniquely representing the Guest Star session. */
		id: string;
		/** List of guests currently interacting with the Guest Star session. */
		guests: {
			/**
			 * ID representing this guest’s slot assignment. 
			 * - Host is always in slot "0" 
			 * - Guests are assigned the following consecutive IDs (e.g, "1", "2", "3", etc) 
			 * - Screen Share is represented as a special guest with the ID "SCREENSHARE" 
			 * - The identifier here matches the ID referenced in browser source links used in broadcasting software.
			 */
			slot_id: string;
			/** Flag determining whether or not the guest is visible in the browser source in the host’s streaming software. */
			is_live: boolean;
			/** User ID of the guest assigned to this slot. */
			user_id: string;
			/** Display name of the guest assigned to this slot. */
			user_display_name: string;
			/** Login of the guest assigned to this slot. */
			user_login: string;
			/** **Integer**. Value from 0 to 100 representing the host’s volume setting for this guest. */
			volume: number;
			/** Timestamp when this guest was assigned a slot in the session. */
			assigned_at: string;
			/** Information about the guest’s audio settings */
			audio_settings: {
				/** Flag determining whether the host is allowing the guest’s audio to be seen or heard within the session. */
				is_host_enabled: boolean;
				/** Flag determining whether the guest is allowing their audio to be transmitted to the session. */
				is_guest_enabled: boolean;
				/** Flag determining whether the guest has an appropriate audio device available to be transmitted to the session. */
				is_available: boolean;
			};
			/** Information about the guest’s video settings */
			video_settings: {
				/** Flag determining whether the host is allowing the guest’s video to be seen or heard within the session. */
				is_host_enabled: boolean;
				/** Flag determining whether the guest is allowing their video to be transmitted to the session. */
				is_guest_enabled: boolean;
				/** Flag determining whether the guest has an appropriate video device available to be transmitted to the session. */
				is_available: boolean;
			};
		}[];
	}[];
}

/**
 * ## [Get Guest Star Session](https://dev.twitch.tv/docs/api/reference/#get-guest-star-session)
 * Gets information about an ongoing Guest Star session for a particular channel.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Successfully retrieved the Guest Star session.
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Missing `moderator_id`
 * 401 Unauthenticated|`moderator_id` and user token do not match
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "guest_star/session", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
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