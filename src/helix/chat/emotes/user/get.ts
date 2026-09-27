import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:read:emotes`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the user. This ID must match the user ID in the user access token. */
	user_id: string;
	/** The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value. */
	after?: string;
	/**
	 * The User ID of a broadcaster you wish to get follower emotes of. Using this query parameter will guarantee inclusion of the broadcaster’s follower emotes in the response body.  

	 * **Note:** If the user specified in `user_id` is subscribed to the broadcaster specified, their follower emotes will appear in the response body regardless if this query parameter is used.
	 */
	broadcaster_id?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	data: {
		/** An ID that uniquely identifies this emote. */
		id: string;
		/** The case-sensitive name of the emote. This is the name that viewers type in the chat window to get the emote to appear. */
		name: string;
		/**
		 * The type of emote. The possible values are: 
		 * - **none** — No emote type was assigned to this emote.
		 * - **bitstier** — A Bits tier emote.
		 * - **follower** — A follower emote.
		 * - **subscriptions** — A subscriber emote.
		 * - **channelpoints** — An emote granted by using channel points.
		 * - **rewards** — An emote granted to the user through a special event.
		 * - **hypetrain** — An emote granted for participation in a Hype Train.
		 * - **prime** — An emote granted for linking an Amazon Prime account.
		 * - **turbo** — An emote granted for having Twitch Turbo.
		 * - **smilies** — Emoticons supported by Twitch.
		 * - **globals** — An emote accessible by everyone.
		 * - **owl2019** — Emotes related to Overwatch League 2019.
		 * - **twofactor** — Emotes granted by enabling two-factor authentication on an account.
		 * - **limitedtime** — Emotes that were granted for only a limited time.
		 */
		emote_type: "none" | "bitstier" | "follower" | "subscriptions" | "channelpoints" | "rewards" | "hypetrain" | "prime" | "turbo" | "smilies" | "globals" | "owl2019" | "twofactor" | "limitedtime";
		/** An ID that identifies the emote set that the emote belongs to. If the emote does not belong to a set, this field will be an empty string. */
		emote_set_id: string;
		/** The ID of the broadcaster who owns the emote. If this emote does not have an owner, this field will be an empty string. */
		owner_id: string;
		/**
		 * The formats that the emote is available in. For example, if the emote is available only as a static PNG, the array contains only static. But if the emote is available as a static PNG and an animated GIF, the array contains static and animated. 
		 * - **animated** —  An animated GIF is available for this emote.
		 * - **static** — A static PNG file is available for this emote.
		 */
		format: ("animated" | "static")[];
		/**
		 * The sizes that the emote is available in. For example, if the emote is available in small and medium sizes, the array contains 1.0 and 2.0.   
		 * - **1.0** —  A small version (28px x 28px) is available.
		 * - **2.0** — A medium version (56px x 56px) is available.
		 * - **3.0** —  A large version (112px x 112px) is available.
		 */
		scale: ("1.0" | "2.0" | "3.0")[];
		/**
		 * The background themes that the emote is available in.  
		 * - **dark**
		 * - **light**
		 */
		theme_mode: ("dark" | "light")[];
	}[];
	/**
	 * A templated URL. Uses the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN (content delivery network) URL that you use to fetch the emote. 

	 *  For information about what the template looks like and how to use it to fetch emotes, see [Emote CDN URL](https://dev.twitch.tv/docs/irc/emotes#cdn-template) format.
	 */
	template: string;
	/**
	 * Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. 

	 *  For more information about pagination support, see [Twitch API Guide - Pagination](https://dev.twitch.tv/docs/api/guide#pagination).
	 */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Get User Emotes](https://dev.twitch.tv/docs/api/reference/#get-user-emotes)
 * Retrieves emotes available to the user across all channels.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the emotes.
 * 400 Bad Request|The `user_id` query parameter is required.
 * ㅤ|The ID in the `user_id` query parameter is not valid.
 * 401 Unauthorized|The ID in `user_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:read:emotes** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "chat/emotes/user", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		after: params.after,
		broadcaster_id: params.broadcaster_id,
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