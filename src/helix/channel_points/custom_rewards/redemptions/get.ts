import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:read:redemptions` or `channel:manage:redemptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the custom reward. This ID must match the user ID found in the user OAuth token. */
	broadcaster_id: string;
	/** The ID that identifies the custom reward whose redemptions you want to get. */
	reward_id: string;
	/**
	 * The status of the redemptions to return. The possible case-sensitive values are:
	 * - CANCELED
	 * - FULFILLED
	 * - UNFULFILLED

	 * **NOTE**: This field is required only if you don’t specify the `id` query parameter.

	 * **NOTE**: Canceled and fulfilled redemptions are returned for only a few days after they’re canceled or fulfilled.
	 */
	status: "CANCELED" | "FULFILLED" | "UNFULFILLED";
	/**
	 * A list of IDs to filter the redemptions by. You may specify a maximum of 50 IDs.

	 * Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
	 */
	id?: string;
	/**
	 * The order to sort redemptions by. The possible case-sensitive values are:
	 * - OLDEST
	 * - NEWEST

	 * The default is OLDEST.
	 */
	sort?: "OLDEST" | "NEWEST";
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read more](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** **Integer**. The maximum number of redemptions to return per page in the response. The minimum page size is 1 redemption per page and the maximum is 50. The default is 20. */
	first?: number;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of redemptions for the specified reward. The list is empty if there are no redemptions that match the redemption criteria. */
	data: object[];
		/** The ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID that uniquely identifies this redemption. */
		id: string;
		/** The user’s login name. */
		user_login: string;
		/** The ID that uniquely identifies the user that redeemed the reward. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The text the user entered at the prompt when they redeemed the reward; otherwise, an empty string if user input was not required. */
		user_input: string;
		/**
		 * The state of the redemption. Possible values are:
		 * - CANCELED
		 * - FULFILLED
		 * - UNFULFILLED
		 */
		status: "CANCELED" | "FULFILLED" | "UNFULFILLED";
		/** The date and time of when the reward was redeemed, in RFC3339 format. */
		redeemed_at: string;
		/** The reward that the user redeemed. */
		reward: {
			/** The ID that uniquely identifies the redeemed reward. */
			id: string;
			/** The reward’s title. */
			title: string;
			/** The prompt displayed to the viewer if user input is required. */
			prompt: string;
			/** **64-bit Integer**. The reward’s cost, in Channel Points. */
			cost: number;
		};
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "channel_points/custom_rewards/redemptions", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		reward_id: params.reward_id,
		status: params.status,
		id: params.id,
		sort: params.sort,
		after: params.after,
		first: params.first,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Get Custom Reward Redemption](https://dev.twitch.tv/docs/api/reference/#get-custom-reward-redemption)
 * Gets a list of redemptions for the specified custom reward. The app used to create the reward is the only app that may get the redemptions.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 Ok|Successfully retrieved the list of redeemed custom rewards.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `reward_id` query parameter is required.
 * ㅤ|The `status` query parameter is required if you didn't specify the `id` query parameter.
 * ㅤ|The value in the `status` query parameter is not valid.
 * ㅤ|The value in the `sort` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * ㅤ|The user access token must include the **channel:read:redemptions** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to create the custom reward.
 * ㅤ|The broadcaster is not a partner or affiliate.
 * 404 Not Found|All of the redemptions specified using the `id` query parameter were not found.
 * 500 Internal Server Error| 
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}