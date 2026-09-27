import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * An ID that identifies the emote set to get. You may specify a maximum of 25 IDs. The response contains only the IDs that were found and ignores duplicate IDs.

	 * To get emote set IDs, use the {@link Helix.GetChannelEmotes | Get Channel Emotes} API.
	 */
	emote_set_id: string | string[];
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of emotes found in the specified emote sets. The list is empty if none of the IDs were found. The list is in the same order as the set IDs specified in the request. Each set contains one or more emoticons. */
	data: {
		/** An ID that uniquely identifies this emote. */
		id: string;
		/** The name of the emote. This is the name that viewers type in the chat window to get the emote to appear. */
		name: string;
		/**
		 * The image URLs for the emote. These image URLs always provide a static, non-animated emote image with a light background.

		 * **NOTE:** You should use the templated URL in the `template` field to fetch the image instead of using these URLs.
		 */
		images: {
			/** A URL to the small version (28px x 28px) of the emote. */
			url_1x: string;
			/** A URL to the medium version (56px x 56px) of the emote. */
			url_2x: string;
			/** A URL to the large version (112px x 112px) of the emote. */
			url_4x: string;
		};
		/**
		 * The type of emote. The possible values are: 
		 * - bitstier — A Bits tier emote.
		 * - follower — A follower emote.
		 * - subscriptions — A subscriber emote.
		 */
		emote_type: "bitstier" | "follower" | "subscriptions";
		/** An ID that identifies the emote set that the emote belongs to. */
		emote_set_id: string;
		/** The ID of the broadcaster who owns the emote. */
		owner_id: string;
		/**
		 * The formats that the emote is available in. For example, if the emote is available only as a static PNG, the array contains only `static`. But if the emote is available as a static PNG and an animated GIF, the array contains `static` and `animated`. The possible formats are: 
		 * - animated — An animated GIF is available for this emote.
		 * - static — A static PNG file is available for this emote.
		 */
		format: ("animated" | "static")[];
		/**
		 * The sizes that the emote is available in. For example, if the emote is available in small and medium sizes, the array contains 1.0 and 2.0. Possible sizes are: 
		 * - 1.0 — A small version (28px x 28px) is available.
		 * - 2.0 — A medium version (56px x 56px) is available.
		 * - 3.0 — A large version (112px x 112px) is available.
		 */
		scale: ("1.0" | "2.0" | "3.0")[];
		/**
		 * The background themes that the emote is available in. Possible themes are: 
		 * - dark
		 * - light
		 */
		theme_mode: ("dark" | "light")[];
	}[];
	/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN (content delivery network) URL that you use to fetch the emote. For information about what the template looks like and how to use it to fetch emotes, see [Emote CDN URL format](https://dev.twitch.tv/docs/irc/emotes#cdn-template). You should use this template instead of using the URLs in the `images` object. */
	template: string;
}

/**
 * ## [Get Emote Sets](https://dev.twitch.tv/docs/api/reference/#get-emote-sets)
 * Gets emotes for one or more specified emote sets.

 * An emote set groups emotes that have a similar context. For example, Twitch places all the subscriber emotes that a broadcaster uploads for their channel in the same emote set.

 * [Learn More](https://dev.twitch.tv/docs/irc/emotes)

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the emotes for the specified emote sets.
 * 400 Bad Request|The `emote_set_id` query parameter is required.
 * ㅤ|The number of `emote_set_id` query parameters exceeds the maximum allowed.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "chat/emotes/set", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		emote_set_id: params.emote_set_id,
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