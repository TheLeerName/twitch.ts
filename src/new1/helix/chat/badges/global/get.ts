import { Options, Helix } from "../../../..";

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

export type RequestParameters = Authentication & Helix.RequestQueryParameters;

export interface ResponseBody {
	/** The list of chat badges. The list is sorted in ascending order by `set_id`, and within a set, the list is sorted in ascending order by `id`. */
	data: {
		/** An ID that identifies this set of chat badges. For example, Bits or Subscriber. */
		set_id: string;
		/** The list of chat badges in this set. */
		versions: {
			/** An ID that identifies this version of the badge. The ID can be any value. For example, for Bits, the ID is the Bits tier level, but for World of Warcraft, it could be Alliance or Horde. */
			id: string;
			/** A URL to the small version (18px x 18px) of the badge. */
			image_url_1x: string;
			/** A URL to the medium version (36px x 36px) of the badge. */
			image_url_2x: string;
			/** A URL to the large version (72px x 72px) of the badge. */
			image_url_4x: string;
			/** The title of the badge. */
			title: string;
			/** The description of the badge. */
			description: string;
			/** The action to take when clicking on the badge. Set to `null` if no action is specified. */
			click_action: string | null;
			/** The URL to navigate to when clicking on the badge. Set to `null` if no URL is specified. */
			click_url: null;
		}[];
	}[];
}

/**
 * ## [Get Global Chat Badges](https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges)
 * Gets Twitch’s list of chat badges, which users may use in any channel’s chat room. For information about chat badges, see [Twitch Chat Badges Guide](https://help.twitch.tv/s/article/twitch-chat-badges-guide).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of global chat badges.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "chat/badges/global", Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}