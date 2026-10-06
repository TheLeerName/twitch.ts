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

export interface RequestBody {
	/** The product's SKU. The SKU must be unique within an extension. The product's SKU cannot be changed. The SKU may contain only alphanumeric characters, dashes (-), underscores (_), and periods (.) and is limited to a maximum of 255 characters. No spaces. */
	sku: string;
	/** An object that contains the product's cost information. */
	cost: {
		/** **Integer**. The product's price. */
		amount: number;
		/**
		 * The type of currency. Possible values are:
		 * - bits — The minimum price is 1 and the maximum is 10000.
		 */
		type: string;
	};
	/** The product's name as displayed in the extension. The maximum length is 255 characters. */
	display_name: string;
	/** A Boolean value that indicates whether the product is in development. Set to **true** if the product is in development and not available for public use. The default is **false**. */
	in_development?: boolean;
	/** The date and time, in RFC3339 format, when the product expires. If not set, the product does not expire. To disable the product, set the expiration date to a date in the past. */
	expiration?: string;
	/** A Boolean value that determines whether Bits product purchase events are broadcast to all instances of the extension on a channel. The events are broadcast via the `onTransactionComplete` helper callback. The default is **false**. */
	is_broadcast?: boolean;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list of Bits products that the extension created. The list is in ascending SKU order. The list is empty if the extension hasn't created any products or they're all expired or disabled. */
	data: {
		/** The product's SKU. The SKU is unique across an extension's products. */
		sku: string;
		/** An object that contains the product's cost information. */
		cost: {
			/** **Integer**. The product's price. */
			amount: number;
			/**
			 * The type of currency. Possible values are:
			 * - bits
			 */
			type: string;
		};
		/** A Boolean value that indicates whether the product is in development. If **true**, the product is not available for public use. */
		in_development: boolean;
		/** The product's name as displayed in the extension. */
		display_name: string;
		/** The date and time, in RFC3339 format, when the product expires. */
		expiration: string;
		/** A Boolean value that determines whether Bits product purchase events are broadcast to all instances of an extension on a channel. The events are broadcast via the `onTransactionComplete` helper callback. Is **true** if the event is broadcast to all instances. */
		is_broadcast: boolean;
	}[];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "bits/extensions", Main.Options.apiHelixPath);
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			sku: params.sku,
			cost: params.cost,
			display_name: params.display_name,
			in_development: params.in_development,
			expiration: params.expiration,
			is_broadcast: params.is_broadcast,
		}),
	};
}

/**
 * ## [Update Extension Bits Product](https://dev.twitch.tv/docs/api/reference/#update-extension-bits-product)
 * Adds or updates a Bits product that the extension created. If the SKU doesn’t exist, the product is added. You may update all fields except the `sku` field.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the product.
 * 400 Bad Request|The `sku` field is required.
 * ㅤ|The value in the `sku` field is not valid. The SKU may contain only alphanumeric characters, dashes (-), underscores (_), and periods (.).
 * ㅤ|The `cost` object's `amount` field is required.
 * ㅤ|The value in the `cost` object's `amount` field is not valid.
 * ㅤ|The <cost>cost</cost> object's `type` field is required.
 * ㅤ|The value in the `cost` object's `type` field is not valid.
 * ㅤ|The `display_name` field is required.
 * ㅤ|The ID in the Client-Id header must belong to the extension.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token; you may not specify a user access token.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}