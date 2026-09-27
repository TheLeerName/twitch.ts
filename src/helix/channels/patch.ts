import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:broadcast`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose channel you want to update. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
}

/** All fields are optional, but you must specify at least one field. */
export interface RequestBody {
	/** The ID of the game that the user plays. The game is not updated if the ID isn’t a game ID that Twitch recognizes. To unset this field, use “0” or “” (an empty string). */
	game_id?: string;
	/** The user’s preferred language. Set the value to an ISO 639-1 two-letter language code (for example, `en` for English). Set to “other” if the user’s preferred language is not a Twitch supported language. The language isn’t updated if the language code isn’t a Twitch supported language. */
	broadcaster_language?: string;
	/** The title of the user’s stream. You may not set this field to an empty string. */
	title?: string;
	/** **Integer**. The number of seconds you want your broadcast buffered before streaming it live. The delay helps ensure fairness during competitive play. Only users with Partner status may set this field. The maximum delay is 900 seconds (15 minutes). */
	delay?: number;
	/**
	 * A list of channel-defined tags to apply to the channel. To remove all tags from the channel, set tags to an empty array. Tags help identify the content that the channel streams. [Learn More](https://help.twitch.tv/s/article/guide-to-tags)

	 * A channel may specify a maximum of 10 tags. Each tag is limited to a maximum of 25 characters and may not be an empty string or contain spaces or special characters.
	 */
	tags?: string[];
	/**
	 * List of labels that should be set as the Channel’s CCLs.
	 * **Note:** To clear CCLs for a channel, set all `is_enabled` for all possible CCLs to `false`
	 */
	content_classification_labels?: {
		/**
		 * ID of the [Content Classification Labels](https://help.twitch.tv/s/article/content-classification-labels) that must be added/removed from the channel. Can be one of the following values:
		 * - DebatedSocialIssuesAndPolitics
		 * - DrugsIntoxication
		 * - SexualThemes
		 * - ViolentGraphic
		 * - Gambling
		 * - ProfanityVulgarity
		 */
		id: "DebatedSocialIssuesAndPolitics" | "DrugsIntoxication" | "SexualThemes" | "ViolentGraphic" | "Gambling" | "ProfanityVulgarity";
		/** Boolean flag indicating whether the label should be enabled (true) or disabled for the channel. */
		is_enabled: boolean;
	}[];
	/** Boolean flag indicating if the channel has branded content. */
	is_branded_content?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

/**
 * ## [Modify Channel Information](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)
 * Updates a channel’s properties.

 * **NOTE**: All fields in request body are optional, but you must specify at least one field.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 204 No Content|Successfully updated the channel’s properties.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The request must update at least one property.
 * ㅤ|The `title` field may not contain an empty string.
 * ㅤ|The ID in `game_id` is not valid.
 * ㅤ|To update the `delay` field, the broadcaster must have partner status.
 * ㅤ|The list in the `tags` field exceeds the maximum number of tags allowed.
 * ㅤ|A tag in the `tags` field exceeds the maximum length allowed.
 * ㅤ|A tag in the `tags` field is empty.
 * ㅤ|A tag in the `tags` field contains special characters or spaces.
 * ㅤ|One or more tags in the `tags` field failed AutoMod review.
 * ㅤ|Game restricted for user's age and region
 * ㅤ|Title exceeds the 140 character limit.
 * 401 Unauthorized|User requests CCL for a channel they don’t own
 * ㅤ|The ID in `broadcaster_id` must match the user ID found in the OAuth token.
 * ㅤ|The Authorization header is required and must specify a user access token.
 * ㅤ|The OAuth token must include the **channel:manage:broadcast** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|User requested gaming CCLs to be added to their channel
 * ㅤ|Unallowed CCLs declared for underaged authorized user in a restricted country
 * 409 Too Many Requests|User set the Branded Content flag too frequently
 * 500 Internal server error| 
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<undefined>> {
	const url = new Main.Helix.URL(params.apiPath ?? "channels", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			game_id: params.game_id,
			broadcaster_language: params.broadcaster_language,
			title: params.title,
			delay: params.delay,
			tags: params.tags,
			content_classification_labels: params.content_classification_labels,
			is_branded_content: params.is_branded_content,
		}),
	});
}