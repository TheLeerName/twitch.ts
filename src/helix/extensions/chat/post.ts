import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster that has activated the extension. */
	broadcaster_id: string;
}

export interface RequestBody {
	/** The message. The message may contain a maximum of 280 characters. */
	text: string;
	/** The ID of the extension that’s sending the chat message. */
	extension_id: string;
	/** The extension’s version number. */
	extension_version: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters & RequestBody;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "extensions/chat",
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		params: {
			broadcaster_id: params.broadcaster_id,
		},
		data: JSON.stringify({
			text: params.text,
			extension_id: params.extension_id,
			extension_version: params.extension_version,
		}),
		...params.config,
	};
}

/**
 * ## [Send Extension Chat Message](https://dev.twitch.tv/docs/api/reference/#send-extension-chat-message)
 * Sends a message to the specified broadcaster’s chat room. The extension’s name is used as the username for the message in the chat room. To send a chat message, your extension must enable **Chat Capabilities** (under your extension’s **Capabilities** tab).

 * **Rate Limits**: You may send a maximum of 12 messages per minute per channel.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the chat message.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `extension_id` field in the request's body is required.
 * ㅤ|The `extension_version` field in the request's body is required.
 * ㅤ|The `text` field in the request's body is required.
 * ㅤ|The message is too long.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * ㅤ|The ID in the `broadcaster_id` query parameter must match the `channel_id` claim in the JWT.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The Client-Id header is required.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}