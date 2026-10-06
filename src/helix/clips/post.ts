import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `clips:edit`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose stream you want to create a clip from. */
	broadcaster_id: string;
	/** The title of the clip. */
	title?: string;
	/** The length of the clip in seconds. Possible values range from 5 to 60 inclusively with a precision of 0.1. The default is 30. */
	duration?: number;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list containing the created clip. */
	data: [{
		/** An ID that uniquely identifies the clip. */
		id: string;
		/**
		 * A URL that you can use to edit the clip’s title, identify the part of the clip to publish, and publish the clip. [Learn More](https://help.twitch.tv/s/article/how-to-use-clips)

		 * The URL is valid for up to 24 hours or until the clip is published, whichever comes first.
		 */
		edit_url: string;
	}];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "clips", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		title: params.title,
		duration: params.duration,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Create Clip](https://dev.twitch.tv/docs/api/reference/#create-clip)
 * Creates a clip from the broadcaster’s stream.

 * This API captures up to 90 seconds of the broadcaster’s stream. The 90 seconds spans the point in the stream from when you called the API. For example, if you call the API at the 4:00 minute mark, the API captures from approximately the 2:35 mark to approximately the 4:05 minute mark. Twitch tries its best to capture 90 seconds of the stream, but the actual length may be less. This may occur if you begin capturing the clip near the beginning or end of the stream.

 * By default, Twitch publishes up to the last 30 seconds of the 90 seconds window and provides a default title for the clip. To specify the title and the portion of the 90 seconds window that’s used for the clip, use the URL in the response’s `edit_url` field. You can specify a clip that’s from 5 seconds to 60 seconds in length. The URL is valid for up to 24 hours or until the clip is published, whichever comes first.

 * Creating a clip is an asynchronous process that can take a short amount of time to complete. To determine whether the clip was successfully created, call {@link Helix.GetClips | GetClips} using the clip ID that this request returned. If Get Clips returns the clip, the clip was successfully created. If after 60 seconds Get Clips hasn’t returned the clip, assume it failed.

 * ### Response Codes
 * Code|Description
 * -|-
 * 202 Accepted|Successfully started the clip process.
 * 400 Bad Request|        
 * ㅤ|The `broadcaster_id` query parameter is required.        
 * ㅤ|The ID in the `broadcaster_id` query parameter was not found.        
 * ㅤ|The category is not clippable.        
 * ㅤ|The title did not pass AutoMod checks.      
 * 401 Unauthorized|        
 * ㅤ|The Authorization header is required and must specify user access token.        
 * ㅤ|The user access token must include the **clips:edit** scope.        
 * ㅤ|The OAuth token is not valid.        
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.      
 * 403 Forbidden|        
 * ㅤ|The broadcaster has restricted the ability to capture clips to followers and/or subscribers only.        
 * ㅤ|The specified broadcaster has not enabled clips on their channel.        
 * ㅤ|The user is banned or timed out from the broadcaster’s channel.      
 * 404 Not Found|The broadcaster in the `broadcaster_id` query parameter must be broadcasting live.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}