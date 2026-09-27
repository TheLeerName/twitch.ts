import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)) along with the `channel_id` and `pubsub_perms` fields. The `role` field must be set to **external**.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/**
	 * The target of the message. Possible values are:
	 * - broadcast
	 * - global
	 * - whisper-<user-id>

	 * If `is_global_broadcast` is **true**, you must set this field to global. The broadcast and global values are mutually exclusive; specify only one of them.
	 */
	target: string[];
	/** The ID of the broadcaster to send the message to. Don’t include this field if `is_global_broadcast` is set to **true**. */
	broadcaster_id?: string;
	/** A Boolean value that determines whether the message should be sent to all channels where your extension is active. Set to **true** if the message should be sent to all channels. The default is **false**. */
	is_global_broadcast?: boolean;
	/** The message to send. The message can be a plain-text string or a string-encoded JSON object. The message is limited to a maximum of 5 KB. */
	message: string;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

/**
 * ## [Send Extension PubSub Message](https://dev.twitch.tv/docs/api/reference/#send-extension-pubsub-message)
 * Sends a message to one or more viewers. You can send messages to a specific channel or to all channels where your extension is active. This endpoint uses the same mechanism as the [send](https://dev.twitch.tv/docs/extensions/reference#send) JavaScript helper function used to send messages.

 * **Rate Limits**: You may send a maximum of 100 messages per minute per combination of extension client ID and broadcaster ID.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the message.
 * 400 Bad Request|The `broadcaster_id` field in the request's body may only be set if the `is_global_broadcast` field is set to **false**.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The Client-Id header is required.
 * 403 Forbidden|The channel found in the JWT provided is not the same as the channel specfieid in `broadcaster_id`
 * ㅤ|JWT could not be verified
 * 422 Unprocessable Entity|The message is too large.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	const url = new Main.URL(params.apiPath ?? "extensions/pubsub", Main.Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			target: params.target,
			broadcaster_id: params.broadcaster_id,
			is_global_broadcast: params.is_global_broadcast,
			message: params.message,
		}),
	});
}