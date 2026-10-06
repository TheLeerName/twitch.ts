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
	/** The ID of the broadcaster you want to get guest star settings for. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
	is_moderator_send_live_enabled: boolean;
	/** **Integer**. Number of slots the Guest Star call interface will allow the host to add to a call. Required to be between 1 and 6. */
	slot_count: number;
	/** Flag determining if Browser Sources subscribed to sessions on this channel should output audio */
	is_browser_source_audio_enabled: boolean;
	/**
	 * This setting determines how the guests within a session should be laid out within the browser source. Can be one of the following values: 
	 * - `TILED_LAYOUT`: All live guests are tiled within the browser source with the same size. 
	 * - `SCREENSHARE_LAYOUT`: All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests.
	 */
	group_layout: "TILED_LAYOUT" | "SCREENSHARE_LAYOUT";
	/** View only token to generate browser source URLs */
	browser_source_token: string;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "guest_star/channel_settings", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Get Channel Guest Star Settings](https://dev.twitch.tv/docs/api/reference/#get-channel-guest-star-settings)
 * Gets the channel settings for configuration of the Guest Star feature for a particular host.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Successfully retrieved the Guest Star settings.
 * 400 Bad Request|Missing `broadcaster_id`
 * ㅤ|Missing `moderator_id`
 * 403 Forbidden|Insufficient authorization for viewing channel’s Guest Star settings
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}