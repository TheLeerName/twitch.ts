import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:guest_star`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster you want to end a Guest Star session for. Provided `broadcaster_id` must match the `user_id` in the auth token. */
	broadcaster_id: string;
	/** ID for the session to end on behalf of the broadcaster. */
	session_id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** Summary of the session details when the session was ended. */
	data: [{
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
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "guest_star/session",
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			session_id: params.session_id,
		},
		...params.config,
	};
}

/**
 * ## [End Guest Star Session](https://dev.twitch.tv/docs/api/reference/#end-guest-star-session)
 * Programmatically ends a Guest Star session on behalf of the broadcaster. Performs the same action as if the host clicked the “End Call” button in the Guest Star UI.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Successfully ended the Guest Star session.
 * 400 Bad Request|Missing or invalid `broadcaster_id` 
 * ㅤ|Missing or invalid `session_id` 
 * ㅤ|Session has already been ended
 * 403 Forbidden|Insufficient authorization for ending session
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}