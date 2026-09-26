import { Options, Helix } from "../../..";

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

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster that’s currently running a charity campaign. This ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the charity campaign that the broadcaster is currently running. The list is empty if the broadcaster is not running a charity campaign; the campaign information is not available after the campaign ends. */
	data: {
		/** An ID that identifies the charity campaign. */
		id: string;
		/** An ID that identifies the broadcaster that’s running the campaign. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The charity’s name. */
		charity_name: string;
		/** A description of the charity. */
		charity_description: string;
		/** A URL to an image of the charity’s logo. The image’s type is PNG and its size is 100px X 100px. */
		charity_logo: string;
		/** A URL to the charity’s website. */
		charity_website: string;
		/** The current amount of donations that the campaign has received. */
		current_amount: {
			/** **Integer**. The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
			value: number;
			/**
			 * **Integer**. The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula:

			* `value / 10^decimal_places`
			*/
			decimal_places: number;
			/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
			currency: string;
		};
		/** The campaign’s fundraising goal. This field is **null** if the broadcaster has not defined a fundraising goal. */
		target_amount: {
			/** **Integer**. The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
			value: number;
			/** **Integer**. The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
			decimal_places: number;
			/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
			currency: string;
		} | null;
	}[];
}

/**
 * ## [Get Charity Campaign](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign)
 * Gets information about the charity campaign that a broadcaster is running. For example, the campaign’s fundraising goal and the current amount of donations.

 * To receive events when progress is made towards the campaign’s goal or the broadcaster changes the fundraising goal, subscribe to the [channel.charity_campaign.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelcharity_campaignprogress) subscription type.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved information about the broadcaster’s active charity campaign.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:charity** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "charity/campaigns", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
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