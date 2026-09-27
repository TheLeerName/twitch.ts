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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:ads`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `channel:read:ads`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Provided `broadcaster_id` must match the `user_id` in the auth token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains information related to the channel’s ad schedule. */
	data: [{
		/** **Integer**. The number of snoozes available for the broadcaster. */
		snooze_count: number;
		/** The UTC timestamp when the broadcaster will gain an additional snooze, in RFC3339 format. */
		snooze_refresh_at: string;
		/** The UTC timestamp of the broadcaster’s next scheduled ad, in RFC3339 format. Empty if the channel has no ad scheduled or is not live. */
		next_ad_at: string;
		/** **Integer**. The length in seconds of the scheduled upcoming ad break. */
		duration: number;
		/** The UTC timestamp of the broadcaster’s last ad-break, in RFC3339 format. Empty if the channel has not run an ad or is not live. */
		last_ad_at: string;
		/** **Integer**. The amount of pre-roll free time remaining for the channel in seconds. Returns 0 if they are currently not pre-roll free. */
		preroll_free_time: number;
	}];
}

/**
 * ## [Get Ad Schedule](https://dev.twitch.tv/docs/api/reference/#get-ad-schedule)
 * This endpoint returns ad schedule related information, including snooze, when the last ad was run, when the next ad is scheduled, and if the channel is currently in pre-roll free time. Note that a new ad cannot be run until 8 minutes after running a previous ad.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Returns the ad schedule information for the channel.
 * 400 Bad Request|The broadcaster ID is not valid.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "channels/ads", Main.Options.apiHelixPath);
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