import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:charity`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster that’s currently running a charity campaign. This ID must match the user ID in the access token. */
	broadcaster_id: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the donations that users have made to the broadcaster’s charity campaign. The list is empty if the broadcaster is not currently running a charity campaign; the donation information is not available after the campaign ends. */
	data: {
		/** An ID that identifies the donation. The ID is unique across campaigns. */
		id: string;
		/** An ID that identifies the charity campaign that the donation applies to. */
		campaign_id: string;
		/** An ID that identifies a user that donated money to the campaign. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** An object that contains the amount of money that the user donated. */
		amount: object;
		/** **Integer**. The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
		value: number;
		/** **Integer**. The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
		decimal_places: number;
		/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
		currency: string;
	}[];
	/** An object that contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "charity/donations",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			first: params.first,
			after: params.after,
		},
		...params.config,
	};
}

/**
 * ## [Get Charity Campaign Donations](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations)
 * Gets the list of donations that users have made to the broadcaster’s active charity campaign.

 * To receive events as donations occur, subscribe to the [channel.charity_campaign.donate](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelcharity_campaigndonate) subscription type.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of donations that users contributed to the broadcaster’s charity campaign.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:charity** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}