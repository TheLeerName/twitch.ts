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

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster you want to update Guest Star settings for. */
	broadcaster_id: string;
}

export interface RequestBody {
	/** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
	is_moderator_send_live_enabled?: boolean;
	/** **Integer**. Number of slots the Guest Star call interface will allow the host to add to a call. Required to be between 1 and 6. */
	slot_count?: number;
	/** Flag determining if Browser Sources subscribed to sessions on this channel should output audio */
	is_browser_source_audio_enabled?: boolean;
	/**
	 * This setting determines how the guests within a session should be laid out within the browser source. Can be one of the following values: 
	 * - `TILED_LAYOUT`: All live guests are tiled within the browser source with the same size. 
	 * - `SCREENSHARE_LAYOUT`: All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests. 
	 * - `HORIZONTAL_LAYOUT`: All live guests are arranged in a horizontal bar within the browser source 
	 * - `VERTICAL_LAYOUT`: All live guests are arranged in a vertical bar within the browser source
	 */
	group_layout?: "TILED_LAYOUT" | "SCREENSHARE_LAYOUT" | "HORIZONTAL_LAYOUT" | "VERTICAL_LAYOUT";
	/** Flag determining if Guest Star should regenerate the auth token associated with the channel’s browser sources. Providing a true value for this will immediately invalidate all browser sources previously configured in your streaming software. */
	regenerate_browser_sources?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

/**
 * ## [Update Channel Guest Star Settings](https://dev.twitch.tv/docs/api/reference/#update-channel-guest-star-settings)
 * Mutates the channel settings for configuration of the Guest Star feature for a particular host.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 204 No Content|Successfully updated channel settings
 * 400 Bad Request|Missing `broadcaster_id` 
 * ㅤ|Invalid `slot_count` 
 * ㅤ| Invalid `group_layout`
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	const url = new Main.URL(params.apiPath ?? "guest_star/channel_settings", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			is_moderator_send_live_enabled: params.is_moderator_send_live_enabled,
			slot_count: params.slot_count,
			is_browser_source_audio_enabled: params.is_browser_source_audio_enabled,
			group_layout: params.group_layout,
			regenerate_browser_sources: params.regenerate_browser_sources,
		}),
	});
}