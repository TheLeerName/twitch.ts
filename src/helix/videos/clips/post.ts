import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `editor:manage:clips` or `channel:manage:clips`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `editor:manage:clips` or `channel:manage:clips`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The user ID of the editor for the channel you want to create a clip for. If using the broadcaster’s auth token, this is the same as broadcaster_id. This must match the user_id in the user access token. */
	editor_id: string;
	/** The user ID for the channel you want to create a clip for. */
	broadcaster_id: string;
	/** ID of the VOD the user wants to clip. */
	vod_id: string;
	/** **Integer**. The zero-based offset, in seconds, to where the clip should end in the video (VOD). See this endpoint’s description for more information on how to use this parameter. */
	vod_offset: number;
	/** The length of the clip, in seconds. Precision is 0.1. Defaults to 30. Min: 5 seconds, Max: 60 seconds. */
	duration?: number;
	/** The title of the clip. */
	title: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list containing the created clip. */
	data: [{
		/** An ID that uniquely identifies the clip. */
		id: string;
		/** A URL you can use to edit the clip’s title, feature the clip, create a portrait version of the clip, download the clip media, and share the clip directly to third-party platforms. */
		edit_url: string;
	}];
}

/**
 * ## [Create Clip From VOD](https://dev.twitch.tv/docs/api/reference/#create-clip-from-vod)
 * Creates a clip from a broadcaster’s VOD on behalf of the broadcaster or an editor of the channel. Since a live stream is actively creating a VOD, this endpoint can also be used to create a clip from earlier in the current stream.

 * The duration of a clip can be from 5 seconds to 60 seconds in length, with a default of 30 seconds if not specified.

 * `vod_offset` indicates where the clip will end. In other words, the clip will start at (`vod_offset` - `duration`) and end at `vod_offset`. This means that the value of `vod_offset` must greater than or equal to the value of `duration`.

 * The URL in the response’s `edit_url` field allows you to edit the clip’s title, feature the clip, create a portrait version of the clip, download the clip media, and share the clip directly to social platforms.

 * ### Response Codes
 * Code|Description
 * -|-
 * 202 Accepted|Successfully started the clip process.
 * 400 Bad Request|Validation errors: Invalid source type, missing required fields.
 * ㅤ|The broadcaster_id query parameter is required.
 * ㅤ|The ID in the broadcaster_id query parameter was not found.
 * ㅤ|The category is not clippable.
 * ㅤ|The title did not pass AutoMod checks.
 * ㅤ|Broadcaster is banned.
 * 401 Unauthorized|The Authorization header is required and must specify user access token.
 * ㅤ|The user access token must include the **editor:manage:clips** or **channel:manage:clips** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster has restricted the ability to capture clips to followers and/or subscribers only.
 * ㅤ|The specified broadcaster has not enabled clips on their channel.
 * ㅤ|The user defined by the `editor_id` is not authorized to create Clips.
 * ㅤ|The user is banned or timed out from the broadcaster's channel.
 * 404 Not Found|The broadcaster in the `broadcaster_id` query parameter must be broadcasting live.
 * ㅤ|The VOD is not found..
 * ㅤ|The `broadcaster_id` or the `editor_id` does not exist.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "videos/clips", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		editor_id: params.editor_id,
		broadcaster_id: params.broadcaster_id,
		vod_id: params.vod_id,
		vod_offset: params.vod_offset,
		duration: params.duration,
		title: params.title,
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