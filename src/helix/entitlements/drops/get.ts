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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id} and owned by a user who is a member of the [organization](https://dev.twitch.tv/docs/docs/companies/) that holds ownership of the game.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id} and owned by a user who is a member of the [organization](https://dev.twitch.tv/docs/docs/companies/) that holds ownership of the game.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** An ID that identifies the entitlement to get. You may specify a maximum of 100 IDs. */
	id?: string | string[];
	/** An ID that identifies a user that was granted entitlements. */
	user_id?: string;
	/** An ID that identifies a game that offered entitlements. */
	game_id?: string;
	/**
	 * The entitlement’s fulfillment status. Used to filter the list to only those with the specified status. Possible values are: 
	 * - CLAIMED
	 * - FULFILLED
	 */
	fulfillment_status?: "CLAIMED" | "FULFILLED";
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** **Integer**. The maximum number of entitlements to return per page in the response. The minimum page size is 1 entitlement per page and the maximum is 1000. The default is 20. */
	first?: number;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of entitlements. */
	data: {
		/** An ID that identifies the entitlement. */
		id: string;
		/** An ID that identifies the benefit (reward). */
		benefit_id: string;
		/** The UTC date and time (in RFC3339 format) of when the entitlement was granted. */
		timestamp: string;
		/** An ID that identifies the user who was granted the entitlement. */
		user_id: string;
		/** An ID that identifies the game the user was playing when the reward was entitled. */
		game_id: string;
		/**
		 * The entitlement’s fulfillment status. Possible values are: 
		 * - CLAIMED
		 * - FULFILLED
		 */
		fulfillment_status: "CLAIMED" | "FULFILLED";
		/** The UTC date and time (in RFC3339 format) of when the entitlement was last updated. */
		last_updated: string;
	}[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request’s `after` query parameter to this value to page forward through the results. */
		cursor?: string;
	};
}

/**
 * ## [Get Drops Entitlements](https://dev.twitch.tv/docs/api/reference/#get-drops-entitlements)
 * Gets an organization’s list of entitlements that have been granted to a game, a user, or both.

 * **NOTE:** Entitlements returned in the response body data are not guaranteed to be sorted by any field returned by the API. To retrieve **CLAIMED** or **FULFILLED** entitlements, use the `fulfillment_status` query parameter to filter results. To retrieve entitlements for a specific game, use the `game_id` query parameter to filter results.

 * The following table identifies the request parameters that you may specify based on the type of access token used.
 * Access token type|Parameter|Description
 * -|-|-
 * App|None|If you don’t specify request parameters, the request returns all entitlements that your organization owns.
 * App|user_id|The request returns all entitlements for any game that the organization granted to the specified user.
 * App|user_id, game_id|The request returns all entitlements that the specified game granted to the specified user.
 * App|game_id|The request returns all entitlements that the specified game granted to all entitled users.
 * User|None|If you don’t specify request parameters, the request returns all entitlements for any game that the organization granted to the user identified in the access token.
 * User|user_id|Invalid.
 * User|user_id, game_id|Invalid.
 * User|game_id|The request returns all entitlements that the specified game granted to the user identified in the access token.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the entitlements.
 * 400 Bad Request|The value in the `fulfillment_status` query parameter is not valid.
 * ㅤ|The ID in the `user_id` query parameter must match the user ID in the user access token.
 * ㅤ|The client in the access token is not associated with a known organization.
 * ㅤ|The owner of the client in the access token is not a member of the organization.
 * 401 Unauthorized|The ID in the Client-Id header must match the Client ID in the access token.
 * ㅤ|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The access token is not valid.
 * 403 Fobidden|The organization associated with the client in the access token must own the game specified in the `game_id` query parameter.
 * ㅤ|The organization associated with the client in the access token must own the entitlements specified in the `id` query parameter.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "entitlements/drops", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		id: params.id,
		user_id: params.user_id,
		game_id: params.game_id,
		fulfillment_status: params.fulfillment_status,
		after: params.after,
		first: params.first,
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