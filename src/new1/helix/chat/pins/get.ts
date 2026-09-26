import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `moderator:manage:chat_messages` or `moderator:read:chat_messages`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `moderator:manage:chat_messages` or `moderator:read:chat_messages` and `user:bot` (for the user represented by the `moderator_id`) or `channel:bot` (for the user represented by the `broadcaster_id`). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** Pinned messages. Empty if none pinned. */
	data: {
		/** The ID of the pinned chat message. */
		message_id: string;
		/** The ID of the broadcaster. */
		broadcaster_id: string;
		/** The ID of the user who sent the pinned message. */
		sender_user_id: string;
		/** The login of the user who sent the pinned message. */
		sender_user_login: string;
		/** The display name of the user who sent the pinned message. */
		sender_user_name: string;
		/** The ID of the user who pinned the message. */
		pinned_by_user_id: string;
		/** The login of the user who pinned the message. */
		pinned_by_user_login: string;
		/** The display name of the user who pinned the message. */
		pinned_by_user_name: string;
		/** The pinned message content. */
		message: {
			/** Plain text of the message. */
			text: string;
			/** Ordered list of message fragments. */
			fragments: {
				/**
				 * The fragment type. Possible values: 
				 * - text
				 * - emote
				 * - cheermote
				 * - mention
				 */
				type: "text";
				/** Fragment text. */
				text: string;
			} | {
				/**
				 * The fragment type. Possible values: 
				 * - text
				 * - emote
				 * - cheermote
				 * - mention
				 */
				type: "emote";
				/** Fragment text. */
				text: string;
				/** Emote metadata. Null if not an emote fragment. */
				emote: {
					/** The emote ID. */
					id: string;
					/** The emote set ID. */
					emote_set_id: string;
					/** The ID of the emote owner. */
					owner_id: string;
					/** The emote formats available. */
					format: string[];
				};
			} | {
				/**
				 * The fragment type. Possible values: 
				 * - text
				 * - emote
				 * - cheermote
				 * - mention
				 */
				type: "cheermote";
				/** Fragment text. */
				text: string;
				/** Cheermote metadata. Null if not a cheermote fragment. */
				cheermote: {
					/** The cheermote prefix. */
					prefix: string;
					/** **Integer**. The number of bits cheered. */
					bits: number;
					/** **Integer**. The cheermote tier. */
					tier: number;
				};
			} | {
				/**
				 * The fragment type. Possible values: 
				 * - text
				 * - emote
				 * - cheermote
				 * - mention
				 */
				type: "mention";
				/** Fragment text. */
				text: string;
				/** Mention metadata. Null if not a mention fragment. */
				mention: {
					/** The mentioned user’s ID. */
					user_id: string;
					/** The mentioned user’s login. */
					user_login: string;
					/** The mentioned user’s display name. */
					user_name: string;
				};
			}[];
		};
		/** RFC3339 timestamp of when the message was pinned. */
		starts_at: string;
		/** RFC3339 expiry timestamp. Null if pinned until stream ends. */
		ends_at: string;
		/** RFC3339 timestamp of last update. */
		updated_at: string;
	}[];
}

/**
 * ## [Get Pinned Chat Message](https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message)
 * Gets the currently pinned message for the specified broadcaster’s chat room, including message fragments. Only one mod-pinned message can be active per channel at a time.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved pinned message(s).
 * 400 Bad Request|A required query parameter is missing.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * ㅤ|The access token must include the **moderator:manage:chat_messages** or **moderator:read:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to moderate the broadcaster’s chat room.
 * 500 Internal Server Error|An unexpected error occurred.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "chat/pins", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
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