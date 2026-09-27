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
	/** The ID of the extension whose list of transactions you want to get. */
	extension_id: string;
	/** A transaction ID used to filter the list of transactions. You may specify a maximum of 100 IDs. */
	id?: string | string[];
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of transactions. */
	data: {
		/** An ID that identifies the transaction. */
		id: string;
		/** The UTC date and time (in RFC3339 format) of the transaction. */
		timestamp: string;
		/** The ID of the broadcaster that owns the channel where the transaction occurred. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID of the user that purchased the digital product. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/**
		 * The type of transaction. Possible values are:
		 * - BITS_IN_EXTENSION
		 */
		product_type: "BITS_IN_EXTENSION";
		/** Contains details about the digital product. */
		product_data: {
			/** An ID that identifies the digital product. */
			sku: string;
			/** Set to `twitch.ext.` + `<the extension's ID>`. */
			domain: string;
			/** Contains details about the digital product’s cost. */
			cost: {
				/** **Integer**. The amount exchanged for the digital product. */
				amount: number;
				/**
				 * The type of currency exchanged. Possible values are:
				 * - bits
				 */
				type: "bits";
			};
			/** A Boolean value that determines whether the product is in development. Is **true** if the digital product is in development and cannot be exchanged. */
			inDevelopment: boolean;
			/** The name of the digital product. */
			displayName: string;
			/** This field is always empty since you may purchase only unexpired products. */
			expiration: "";
			/** A Boolean value that determines whether the data was broadcast to all instances of the extension. Is **true** if the data was broadcast to all instances. */
			broadcast: boolean;
		};
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Get Extension Transactions](https://dev.twitch.tv/docs/api/reference/#get-extension-transactions)
 * Gets an extension’s list of transactions. A transaction records the exchange of a currency (for example, Bits) for a digital product.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of transactions.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * ㅤ|The request specified too many `id` query parameters.
 * ㅤ|The pagination cursor is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the `extension_id` query parameter must match the client ID in the access token.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|One or more of the transaction IDs specified using the `id` query parameter were not found.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "extensions/transactions", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		extension_id: params.extension_id,
		id: params.id,
		first: params.first,
		after: params.after,
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