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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:write:chat`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `user:write:chat` and `user:bot` (for the user represented by the `sender_id`) or `channel:bot` (for the user represented by the `broadcaster_id`). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The ID of the broadcaster whose chat room the message will be sent to. */
	broadcaster_id: string;
	/** The ID of the user sending the message. This ID must match the user ID in the user access token. */
	sender_id: string;
	/** The message to send. The message is limited to a maximum of 500 characters. Chat messages can also include emoticons. To include emoticons, use the name of the emote. The names are case sensitive. Don’t include colons around the name (e.g., :bleedPurple:). If Twitch recognizes the name, Twitch converts the name to the emote before writing the chat message to the chat room */
	message: string;
	/** The ID of the chat message being replied to. */
	reply_parent_message_id?: string;
	/**
	 * **NOTE:** This parameter can only be set when utilizing an App Access Token. It cannot be specified when a User Access Token is used, and will instead result in an HTTP 400 error.

	 * Determines if the chat message is sent only to the source channel (defined by `broadcaster_id`) during a shared chat session. This has no effect if the message is not sent during a shared chat session.

	 * If this parameter is not set, the default value when using an App Access Token is `false`. On May 19, 2025 the default value for this parameter will be updated to `true`, and chat messages sent using an App Access Token will only be shared with the source channel by default. If you prefer to send a chat message to both channels in a shared chat session, make sure this parameter is explicitly set to `false` in your API request before May 19.
	 */
	for_source_only?: boolean;
	/** If true, the message will be sent and immediately pinned. Default: false. Cannot be combined with `reply_parent_message_id` or `for_source_only`. When `pin` is true, additionally requires the `moderator:manage:chat_messages` scope and the sender must be the broadcaster or a moderator. Messages pinned via this endpoint are always pinned for 20 minutes. If the pin fails, the message is not sent. */
	pin?: boolean;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	data: [{
		/** The message id for the message that was sent. */
		message_id: string;
		/** If the message passed all checks and was sent. */
		is_sent: boolean;
		/** The reason the message was dropped, if any. */
		drop_reason?: {
			/** Code for why the message was dropped. */
			code: string;
			/** Message for why the message was dropped. */
			message: string;
		};
	}];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "chat/messages", Main.Options.apiHelixPath);
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
			broadcaster_id: params.broadcaster_id,
			sender_id: params.sender_id,
			message: params.message,
			reply_parent_message_id: params.reply_parent_message_id,
			for_source_only: params.for_source_only,
			pin: params.pin,
		}),
	};
}

/**
 * ## [Send Chat Message](https://dev.twitch.tv/docs/api/reference/#send-chat-message)
 * Sends a message to the broadcaster’s chat room.

 * **NOTE:** When sending messages to a Shared Chat session, behaviors differ depending on your authentication token type:
 * - When using an App Access Token, messages will only be sent to the source channel (defined by the `broadcaster_id` parameter) by default starting on May 19, 2025. Messages can be sent to all channels by using the `for_source_only` parameter and setting it to **false**.
 * - When using a User Access Token, messages will be sent to all channels in the shared chat session, including the source channel. This behavior cannot be changed with this token type.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully sent the specified broadcaster a message.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The `sender_id` query parameter is required.
 * ㅤ|The ID in the `sender_id` query parameter is not valid.
 * ㅤ|The `text` query parameter is required.
 * ㅤ|The ID in the `reply_parent_message_id` query parameter is not valid.
 * ㅤ|Cannot set *for_source_only* if User Access Token is used.
 * ㅤ|The `reply_parent_message_id` parameter is not supported when `pin` is true.
 * ㅤ|The `for_source_only` parameter is not supported when `pin` is true.
 * 401 Unauthenticated|The ID in the user_id query parameter must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the user:write:chat scope.
 * ㅤ|Pinning requires the **moderator:manage:chat_messages** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The sender is not permitted to send chat messages to the broadcaster’s chat room.
 * 422 Unprocessable Entity|The message is too large.
 * 429 Too Many Requests|The rate limit has been exceeded.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}