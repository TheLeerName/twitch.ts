import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:redemptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** A list of IDs that identify the redemptions to update. You may specify a maximum of 50 IDs. */
	id: string | string[];
	/** The ID of the broadcaster that’s updating the redemption. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID that identifies the reward that’s been redeemed. */
	reward_id: string;
}

export interface RequestBody {
	/**
	 * The status to set the redemption to. Possible values are:
	 * - CANCELED
	 * - FULFILLED

	 * Setting the status to CANCELED refunds the user’s channel points.
	 */
	status: "CANCELED" | "FULFILLED";
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** The list contains the single redemption that you updated. */
	data: [{
		/** The ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID that uniquely identifies this redemption.. */
		id: string;
		/** The ID of the user that redeemed the reward. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
		/** An object that describes the reward that the user redeemed. */
		reward: {
			/** The ID that uniquely identifies the reward. */
			id: string;
			/** The reward’s title. */
			title: string;
			/** The prompt displayed to the viewer if user input is required. */
			prompt: string;
			/** **64-bit Integer**. The reward’s cost, in Channel Points. */
			cost: number;
		};
		/** The text that the user entered at the prompt when they redeemed the reward; otherwise, an empty string if user input was not required. */
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
	}];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "channel_points/custom_rewards/redemptions", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		id: params.id,
		broadcaster_id: params.broadcaster_id,
		reward_id: params.reward_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			status: params.status,
		}),
	};
}

/**
 * ## [Update Redemption Status](https://dev.twitch.tv/docs/api/reference/#update-redemption-status)
 * Updates a redemption’s status. You may update a redemption only if its status is UNFULFILLED. The app used to create the reward is the only app that may update the redemption.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 OK|Successfully updated the redemption’s status.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `reward_id` query parameter is required.
 * ㅤ|The `id` query parameter is required.
 * ㅤ|The value in the `status` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * ㅤ|The user access token must include the **channel:manage:redemptions** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to create the custom reward.
 * ㅤ|The broadcaster is not a partner or affiliate.
 * 404 Not Found|The custom reward specified in the `reward_id` query parameter was not found.
 * ㅤ|The redemptions specified using the `id` query parameter were not found or their statuses weren't marked as UNFULFILLED.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}