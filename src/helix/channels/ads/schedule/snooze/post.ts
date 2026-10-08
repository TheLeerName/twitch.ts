import * as Main from "../../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:ads`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `channel:manage:ads`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** Provided `broadcaster_id` must match the `user_id` in the auth token. */
	broadcaster_id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains information about the channel’s snoozes and next upcoming ad after successfully snoozing. */
	data: [{
		/** **Integer**. The number of snoozes available for the broadcaster. */
		snooze_count: number;
		/** The UTC timestamp when the broadcaster will gain an additional snooze, in RFC3339 format. */
		snooze_refresh_at: string;
		/** The UTC timestamp of the broadcaster’s next scheduled ad, in RFC3339 format. */
		next_ad_at: string;
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "channels/ads/schedule/snooze",
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
		},
		...params.config,
	};
}

/**
 * ## [Snooze Next Ad](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
 * If available, pushes back the timestamp of the upcoming automatic mid-roll ad by 5 minutes. This endpoint duplicates the snooze functionality in the creator dashboard’s Ads Manager.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|User’s next ad is successfully snoozed. Their `snooze_count` is decremented and `snooze_refresh_time` and `next_ad_at` are both updated.
 * 400 Bad Request|The channel is not currently live.
 * ㅤ|The broadcaster ID is not valid.
 * ㅤ|Channel does not have an upcoming scheduled ad break.
 * 429 Too Many Requests|Channel has no snoozes left.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}