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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:announcements`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `moderator:manage:announcements` and `user:bot` (for the user represented by the `moderator_id`) or `channel:bot` (for the user represented by the `broadcaster_id`). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the chat room to send the announcement to. */
	broadcaster_id: string;
	/** The ID of a user who has permission to moderate the broadcaster’s chat room, or the broadcaster’s ID if they’re sending the announcement. */
	moderator_id: string;
}

export interface RequestBody {
	/** The announcement to make in the broadcaster’s chat room. Announcements are limited to a maximum of 500 characters; announcements longer than 500 characters are truncated. */
	message: string;
	/**
	 * The color used to highlight the announcement. Possible case-sensitive values are:
	 * - blue
	 * - green
	 * - orange
	 * - purple
	 * - primary (default)If `color` is set to `primary` or is not set, the channel’s accent color is used to highlight the announcement (see **Profile Accent Color** under [profile settings](https://www.twitch.tv/settings/profile), **Channel and Videos**, and **Brand**).
	 */
	color?: string;
	/**
	 * **NOTE:** This parameter can only be set when utilizing an App Access Token. It cannot be specified when a User Access Token is used, and will instead result in an HTTP 400 error.

	 * Determines if the chat announcement is sent only to the source channel (defined by `broadcaster_id`) during a shared chat session. This has no effect if the announcement is not sent during a shared chat session.

	 * The default value when using an App Access Token is `true`. If you prefer to send an announcement to all channels in a shared chat session, set this parameter to `false`.
	 */
	for_source_only?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "chat/announcements", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			message: params.message,
			color: params.color,
			for_source_only: params.for_source_only,
		}),
	};
}

/**
 * ## [Send Chat Announcement](https://dev.twitch.tv/docs/api/reference/#send-chat-announcement)
 * Sends an announcement to the broadcaster’s chat room.

 * **Rate Limits**: One announcement may be sent every 2 seconds.

 * **NOTE:** When sending announcements during a Shared Chat session, behaviors differ depending on your authentication token type:
 * - When using an App Access Token, announcements will only be sent to the source channel (defined by the `broadcaster_id` parameter) by default. Announcements can be sent to all channels by using the `for_source_only` parameter and setting it to **false**.
 * - When using a User Access Token, announcements will be sent to all channels in the shared chat session, including the source channel. This behavior cannot be changed with this token type.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the announcement.
 * 400 Bad Request|The `message` field in the request's body is required.
 * ㅤ|The `message` field may not contain an empty string.
 * ㅤ|The string in the `message` field failed review.
 * ㅤ|The specified color is not valid.
 * ㅤ|Cannot set `for_source_only` if User Access Token is used.
 * 401 Unauthorized|The Authorization header is required and must contain an access token.
 * ㅤ|The user access token is missing the **moderator:manage:announcements** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * ㅤ|The sender must have authorized the app with the **moderator:manage:announcements** and **user:bot** scopes.
 * ㅤ|The broadcaster must have authorized the app with the **channel:bot** scope.
 * 429 Too Many Requests|The sender has exceeded the number of announcements they may send to this **broadcaster_id** within a given window.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}