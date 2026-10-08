import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:unban_requests`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster whose channel is approving or denying the unban request. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s unban requests. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** The ID of the Unban Request to resolve. */
	unban_request_id: string;
	/**
	 * Resolution status. 
	 * - approved
	 * - denied
	 */
	status: "approved" | "denied";
	/** Message supplied by the unban request resolver. The message is limited to a maximum of 500 characters. */
	resolution_text?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	data: [{
		/** Unban request ID. */
		id: string;
		/** User ID of broadcaster whose channel is receiving the unban request. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** User ID of moderator who approved/denied the request. */
		moderator_id: string;
		/** The moderator’s login name. */
		moderator_login: string;
		/** The moderator’s display name. */
		moderator_name: string;
		/** User ID of the requestor who is asking for an unban. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** Text of the request from the requesting user. */
		text: string;
		/**
		 * Status of the request. One of: 
		 * - approved
		 * - denied
		 */
		status: "approved" | "denied";
		/** Timestamp of when the unban request was created. */
		created_at: string;
		/** Timestamp of when moderator/broadcaster approved or denied the request. */
		resolved_at: string;
		/** Text input by the resolver (moderator) of the unban request. */
		resolution_text: string;
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/unban_requests",
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
			unban_request_id: params.unban_request_id,
			status: params.status,
			resolution_text: params.resolution_text,
		},
		...params.config,
	};
}

/**
 * ## [Resolve Unban Requests](https://dev.twitch.tv/docs/api/reference/#resolve-unban-requests)
 * Resolves an unban request by approving or denying it.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 OK|Successfully resolved the unban request.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The ID in the `moderator_id` query parameter is not valid.
 * ㅤ|The pagination cursor is not valid.
 * ㅤ|The broadcaster is not receiving unban requests
 * ㅤ|Invalid requested update
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:unban_requests** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The unban request ID was not found.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}