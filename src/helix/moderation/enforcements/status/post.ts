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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderation:read`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderation:read`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster whose AutoMod settings and list of blocked terms are used to check the message. This ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export interface RequestBody {
	/** The list of messages to check. The list must contain at least one message and may contain up to a maximum of 100 messages. */
	data: {
		/** A caller-defined ID used to correlate this message with the same message in the response. */
		msg_id: string;
		/** The message to check. */
		msg_text: string;
	}[];
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** The list of messages and whether Twitch would approve them for chat. */
	data: {
		/** The caller-defined ID passed in the request. */
		msg_id: string;
		/** A Boolean value that indicates whether Twitch would approve the message for chat or hold it for moderator review or block it from chat. Is **true** if Twitch would approve the message; otherwise, **false** if Twitch would hold the message for moderator review or block it from chat. */
		is_permitted: boolean;
	}[];
}

/**
 * ## [Check AutoMod Status](https://dev.twitch.tv/docs/api/reference/#check-automod-status)
 * Checks whether AutoMod would flag the specified message for review.

 * AutoMod is a moderation tool that holds inappropriate or harassing chat messages for moderators to review. Moderators approve or deny the messages that AutoMod flags; only approved messages are released to chat. AutoMod detects misspellings and evasive language automatically. For information about AutoMod, see [How to Use AutoMod](https://help.twitch.tv/s/article/how-to-use-automod).

 * **Rate Limits**: Rates are limited per channel based on the account type rather than per access token.
 * Account type|Limit per minute|Limit per hour
 * -|-|-
 * Normal|5|50
 * Affiliate|10|100
 * Partner|30|300

 * The above limits are in addition to the standard [Twitch API rate limits](https://dev.twitch.tv/docs/api/guide#twitch-rate-limits). The rate limit headers in the response represent the Twitch rate limits and not the above limits.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully checked the messages.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `data` field is required and the list must contain one or more messages to check.
 * ㅤ|The `msg_id` field is required.
 * ㅤ|The `msg_text` field is required.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderation:read** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The ID in `broadcaster_id` must match the user ID in the user access token.
 * 429 Too Many Requests|The broadcaster exceeded the number of chat message checks that they may make. See the endpoint's rate limits.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "moderation/enforcements/status", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			data: params.data,
		}),
	});
}