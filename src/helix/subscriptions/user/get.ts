import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:read:subscriptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of a partner or affiliate broadcaster. */
	broadcaster_id: string;
	/** The ID of the user that you’re checking to see whether they subscribe to the broadcaster in `broadcaster_id`. This ID must match the user ID in the access Token. */
	user_id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains a single object with information about the user’s subscription. */
	data: [{
		/** An ID that identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID of the user that gifted the subscription. The object includes this field only if `is_gift` is **true**. */
		gifter_id: string;
		/** The gifter’s login name. The object includes this field only if `is_gift` is **true**. */
		gifter_login: string;
		/** The gifter’s display name. The object includes this field only if `is_gift` is **true**. */
		gifter_name: string;
		/** A Boolean value that determines whether the subscription is a gift subscription. Is **true** if the subscription was gifted. */
		is_gift: boolean;
		/**
		 * The type of subscription. Possible values are:
		 * - 1000 — Tier 1
		 * - 2000 — Tier 2
		 * - 3000 — Tier 3
		 */
		tier: "1000" | "2000" | "3000";
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "subscriptions/user",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			user_id: params.user_id,
		},
		...params.config,
	};
}

/**
 * ## [Check User Subscription](https://dev.twitch.tv/docs/api/reference/#check-user-subscription)
 * Checks whether the user subscribes to the broadcaster’s channel.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|The user subscribes to the broadcaster.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `user_id` query parameter is required.
 * 401 Unauthorized|The ID in `user_id` must match the user ID found in the request’s OAuth token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:read:subscriptions** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The user in `user_id` does not subscribe to the broadcaster in `broadcaster_id`.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}