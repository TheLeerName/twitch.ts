import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** A Boolean value that determines whether to include disabled or expired Bits products in the response. The default is **false**. */
	should_include_all?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of Bits products that the extension created. The list is in ascending SKU order. The list is empty if the extension hasn’t created any products or they’re all expired or disabled. */
	data: {
		/** The product’s SKU. The SKU is unique across an extension’s products. */
		sku: string;
		/** An object that contains the product’s cost information. */
		cost: {
			/** **Integer**. The product’s price. */
			amount: number;
			/**
			 * The type of currency. Possible values are:
			 * - bits
			 */
			type: "bits";
		};
		/** A Boolean value that indicates whether the product is in development. If **true**, the product is not available for public use. */
		in_development: boolean;
		/** The product’s name as displayed in the extension. */
		display_name: string;
		/** The date and time, in RFC3339 format, when the product expires. */
		expiration: string;
		/** A Boolean value that determines whether Bits product purchase events are broadcast to all instances of an extension on a channel. The events are broadcast via the `onTransactionComplete` helper callback. Is **true** if the event is broadcast to all instances. */
		is_broadcast: boolean;
	}[];
}

/**
 * ## [Get Extension Bits Products](https://dev.twitch.tv/docs/api/reference/#get-extension-bits-products)
 * Gets the list of Bits products that belongs to the extension. The client ID in the app access token identifies the extension.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of products.
 * 400 Bad Request|The ID in the Client-Id header must belong to an extension.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token; you may not specify a user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "bits/extensions", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		should_include_all: params.should_include_all,
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