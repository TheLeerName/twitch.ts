import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:manage:whispers`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the user sending the whisper. This user must have a verified phone number. This ID must match the user ID in the user access token. */
	from_user_id: string;
	/** The ID of the user to receive the whisper. */
	to_user_id: string;
}

export interface RequestBody {
	/**
	 * The whisper message to send. The message must not be empty.

	 * The maximum message lengths are:
	 * - 500 characters if the user you're sending the message to hasn't whispered you before.
	 * - 10,000 characters if the user you're sending the message to has whispered you before.Messages that exceed the maximum length are truncated.
	 */
	message: string;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "whispers", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		from_user_id: params.from_user_id,
		to_user_id: params.to_user_id,
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
		}),
	};
}

/**
 * ## [Send Whisper](https://dev.twitch.tv/docs/api/reference/#send-whisper)
 * Sends a whisper message to the specified user.

 * NOTE: The user sending the whisper must have a verified phone number (see the **Phone Number** setting in your [Security and Privacy](https://www.twitch.tv/settings/security) settings).

 * NOTE: The API may silently drop whispers that it suspects of violating Twitch policies. (The API does not indicate that it dropped the whisper; it returns a 204 status code as if it succeeded.)

 * **Rate Limits**: You may whisper to a maximum of 40 unique recipients per day. Within the per day limit, you may whisper a maximum of 3 whispers per second and a maximum of 100 whispers per minute.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the whisper message or the message was silently dropped.
 * 400 Bad Request|The ID in the `from_user_id` and `to_user_id` query parameters must be different.
 * ㅤ|The `message` field must not contain an empty string.
 * ㅤ|The user that you're sending the whisper to doesn't allow whisper messages (see the **Block Whispers from Strangers** setting in your [Security and Privacy](https://www.twitch.tv/settings/security) settings).
 * ㅤ|Whisper messages may not be sent to suspended users.
 * ㅤ|The ID in the `from_user_id` query parameter is not valid.
 * ㅤ|The ID in the `to_user_id` query parameter is not valid.
 * 401 Unauthorized|The user in the `from_user_id` query parameter must have a verified phone number.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:manage:whispers** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|This ID in `from_user_id` must match the user ID in the user access token.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|Suspended users may not send whisper messages.
 * ㅤ|The account that's sending the message doesn't allow sending whispers.
 * 404 Not Found|The ID in `to_user_id` was not found.
 * 429 Too Many Requests|The sending user exceeded the number of whisper requests that they may make. See Rate Limits for this endpoint above.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}