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

export interface RequestBody {
	/** A list of IDs that identify the entitlements to update. You may specify a maximum of 100 IDs. */
	entitlement_ids?: string[];
	/**
	 * The fulfillment status to set the entitlements to. Possible values are:
	 * - CLAIMED — The user claimed the benefit.
	 * - FULFILLED — The developer granted the benefit that the user claimed.
	 */
	fulfillment_status?: "CLAIMED" | "FULFILLED";
}

export type RequestParameters = Main.RequestParameters & Authentication & Main.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that indicates which entitlements were successfully updated and those that weren’t. */
	data: {
		/**
		 * A string that indicates whether the status of the entitlements in the `ids` field were successfully updated. Possible values are:
		 * - INVALID_ID — The entitlement IDs in the `ids` field are not valid.
		 * - NOT_FOUND — The entitlement IDs in the `ids` field were not found.
		 * - SUCCESS — The status of the entitlements in the `ids` field were successfully updated.
		 * - UNAUTHORIZED — The user or organization identified by the user access token is not authorized to update the entitlements.
		 * - UPDATE_FAILED — The update failed. These are considered transient errors and the request should be retried later.
		 */
		status: "INVALID_ID" | "NOT_FOUND" | "SUCCESS" | "UNAUTHORIZED" | "UPDATE_FAILED";
		/** The list of entitlements that the status in the `status` field applies to. */
		ids: string[];
	}[];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "entitlements/drops",
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		data: JSON.stringify({
			entitlement_ids: params.entitlement_ids,
			fulfillment_status: params.fulfillment_status,
		}),
		...params.config,
	};
}

/**
 * ## [Update Drops Entitlements](https://dev.twitch.tv/docs/api/reference/#update-drops-entitlements)
 * Updates the Drop entitlement’s fulfillment status.

 * The following table identifies which entitlements are updated based on the type of access token used.
 * Access token type|Data that’s updated
 * -|-
 * App|Updates all entitlements with benefits owned by the organization in the access token.
 * User|Updates all entitlements owned by the user in the access token and where the benefits are owned by the organization in the access token.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully requested the updates. Check the response to determine which updates succeeded.
 * 400 Bad Request|The value in the `fulfillment_status` field is not valid.
 * ㅤ|The client in the access token is not associated with a known organization.
 * ㅤ|The owner of the client in the access token is not a member of the organization.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}