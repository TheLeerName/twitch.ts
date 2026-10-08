import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `moderator:read:unban_requests` or `moderator:manage:unban_requests`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster whose channel is receiving unban requests. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s unban requests. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/**
	 * Filter by a status.
	 * - pending
	 * - approved
	 * - denied
	 * - acknowledged
	 * - canceled
	 */
	status:
	| "pending"
	| "approved"
	| "denied"
	| "acknowledged"
	| "canceled";
	/** The ID used to filter what unban requests are returned. */
	user_id?: string;
	/** Cursor used to get next page of results. Pagination object in response contains cursor value. */
	after?: string;
	/** **Integer**. The maximum number of items to return per page in response */
	first?: number;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains information about the channel's unban requests. */
	data: {
		/** Unban request ID. */
		id: string;
		/** User ID of broadcaster whose channel is receiving the unban request. */
		broadcaster_id: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** User ID of moderator who approved/denied the request. */
		moderator_id: string;
		/** The moderator's login name. */
		moderator_login: string;
		/** The moderator's display name. */
		moderator_name: string;
		/** User ID of the requestor who is asking for an unban. */
		user_id: string;
		/** The user's login name. */
		user_login: string;
		/** The user's display name. */
		user_name: string;
		/** Text of the request from the requesting user. */
		text: string;
		/**
		 * Status of the request. One of:
		 * - pending
		 * - approved
		 * - denied
		 * - acknowledged
		 * - canceled
		 */
		status:
		| "pending"
		| "approved"
		| "denied"
		| "acknowledged"
		| "canceled";
		/** Timestamp of when the unban request was created. */
		created_at: string;
		/** Timestamp of when moderator/broadcaster approved or denied the request. */
		resolved_at: string;
		/** Text input by the resolver (moderator) of the unban. request */
		resolution_text: string;
	}[];
	/** Contains information used to page through a list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/unban_requests",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			status: params.status,
			user_id: params.user_id,
			after: params.after,
			first: params.first,
		},
		...params.config,
	};
}

/**
 * ## [Get Unban Requests](https://dev.twitch.tv/docs/api/reference/#get-unban-requests)
 * Gets a list of unban requests for a broadcaster’s channel.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of unban requests.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The ID in the `moderator_id` query parameter is not valid.
 * ㅤ|The pagination cursor is not valid.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:read:unban_requests** or **moderator:manage:unban_requests** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}