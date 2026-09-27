import * as Main from "../..";

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
	/** The ID of the broadcaster whose channel you want to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that are not found. */
	broadcaster_id: string | string[];
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains information about the specified channels. The list is empty if the specified channels weren’t found. */
	data: {
		/** An ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s preferred language. The value is an ISO 639-1 two-letter language code (for example, `en` for English). The value is set to “other” if the language is not a Twitch supported language. */
		broadcaster_language: string;
		/** The name of the game that the broadcaster is playing or last played. The value is an empty string if the broadcaster has never played a game. */
		game_name: string;
		/** An ID that uniquely identifies the game that the broadcaster is playing or last played. The value is an empty string if the broadcaster has never played a game. */
		game_id: string;
		/** The title of the stream that the broadcaster is currently streaming or last streamed. The value is an empty string if the broadcaster has never streamed. */
		title: string;
		/**
		 * **Unsigned Integer**. The value of the broadcaster’s stream delay setting, in seconds. This field’s value defaults to zero unless:
		 * - the request specifies a user access token
		 * - the ID in the `broadcaster_id` query parameter matches the user ID in the access token
		 * - the broadcaster has partner status and they set a non-zero stream delay value
		 */
		delay: number;
		/** The tags applied to the channel. */
		tags: string[];
		/** The CCLs applied to the channel. */
		content_classification_labels: string[];
		/** Boolean flag indicating if the channel has branded content. */
		is_branded_content: boolean;
	}[];
}

/**
 * ## [Get Channel Information](https://dev.twitch.tv/docs/api/reference/#get-channel-information)
 * Gets information about one or more channels.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of channels.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The broadcaster ID is not valid.
 * ㅤ|The number of `broadcaster_id` query parameters exceeds the maximum allowed.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 429 Too Many Requests|The application exceeded the number of calls it may make per minute. For details, see [Rate Limits](https://dev.twitch.tv/docs/api/guide#twitch-rate-limits).
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "channels", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
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