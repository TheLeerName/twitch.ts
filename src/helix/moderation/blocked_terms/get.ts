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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `moderator:read:blocked_terms` or `moderator:manage:blocked_terms`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `moderator:read:blocked_terms` or `moderator:manage:blocked_terms`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster whose blocked terms you’re getting. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. */
	after?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of blocked terms. The list is in descending order of when they were created (see the `created_at` timestamp). */
	data: {
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
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/blocked_terms",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			first: params.first,
			after: params.after,
		},
		...params.config,
	};
}

/**
 * ## [Get Blocked Terms](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)
 * Gets the broadcaster’s list of non-private, blocked words or phrases. These are the terms that the broadcaster or moderator added manually or that were denied by AutoMod.

 * ### Response Codes
 * Code|Decription
 * -|-
 * 200 OK|Successfully retrieved the list of blocked terms.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header must contain a user access token.
 * ㅤ|The user access token must include the **moderator:read:blocked_terms** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}