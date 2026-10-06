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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:blocked_terms`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:blocked_terms`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the list of blocked terms. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

export interface RequestBody {
	/**
	 * The word or phrase to block from being used in the broadcaster’s chat room. The term must contain a minimum of 2 characters and may contain up to a maximum of 500 characters.

	 * Terms may include a wildcard character (*). The wildcard character must appear at the beginning or end of a word or set of characters. For example, *foo or foo*.

	 * If the blocked term already exists, the response contains the existing blocked term.
	 */
	text: string;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the single blocked term that the broadcaster added. */
	data: [{
		/** The broadcaster that owns the list of blocked terms. */
		broadcaster_id: string;
		/** The moderator that blocked the word or phrase from being used in the broadcaster’s chat room. */
		moderator_id: string;
		/** An ID that identifies this blocked term. */
		id: string;
		/** The blocked word or phrase. */
		text: string;
		/** The UTC date and time (in RFC3339 format) that the term was blocked. */
		created_at: string;
		/**
		 * The UTC date and time (in RFC3339 format) that the term was updated.

		 * When the term is added, this timestamp is the same as `created_at`. The timestamp changes as AutoMod continues to deny the term.
		 */
		updated_at: string;
		/**
		 * The UTC date and time (in RFC3339 format) that the blocked term is set to expire. After the block expires, users may use the term in the broadcaster’s chat room.

		 * This field is **null** if the term was added manually or was permanently blocked by AutoMod.
		 */
		expires_at: string | null;
	}];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "moderation/blocked_terms", Main.Options.apiHelixPath);
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
			text: params.text,
		}),
	};
}

/**
 * ## [Add Blocked Term](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)
 * Adds a word or phrase to the broadcaster’s list of blocked terms. These are the terms that the broadcaster doesn’t want used in their chat room.

 * ### Response Codes
 * Code|Decription
 * -|-
 * 200 OK|Successfully retrieved the list of blocked terms.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The `text` field is required.
 * ㅤ|The length of the term in the `text` field is either too short or too long.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:blocked_terms** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}