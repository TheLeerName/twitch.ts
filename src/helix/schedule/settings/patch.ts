import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:schedule`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose schedule settings you want to update. The ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** A Boolean value that indicates whether the broadcaster has scheduled a vacation. Set to **true** to enable Vacation Mode and add vacation dates, or **false** to cancel a previously scheduled vacation. */
	is_vacation_enabled?: boolean;
	/** The UTC date and time of when the broadcaster’s vacation starts. Specify the date and time in RFC3339 format (for example, 2021-05-16T00:00:00Z). Required if `is_vacation_enabled` is **true**. */
	vacation_start_time?: string;
	/** The UTC date and time of when the broadcaster’s vacation ends. Specify the date and time in RFC3339 format (for example, 2021-05-30T23:59:59Z). Required if `is_vacation_enabled` is **true**. */
	vacation_end_time?: string;
	/** The time zone that the broadcaster broadcasts from. Specify the time zone using [IANA time zone database](https://www.iana.org/time-zones) format (for example, America/New_York). Required if `is_vacation_enabled` is **true**. */
	timezone?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Update Channel Stream Schedule](https://dev.twitch.tv/docs/api/reference/#update-channel-stream-schedule)
 * Updates the broadcaster’s schedule settings, such as scheduling a vacation.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the broadcaster’s schedule settings.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The format of the string in `vacation_start_time` is not valid.
 * ㅤ|The format of the string in `vacation_end_time` is not valid.
 * ㅤ|The date in `vacation_end_time` must be later than the date in `vacation_start_time`.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:schedule** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|The broadcaster's schedule was not found.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	const url = new Main.URL(params.apiPath ?? "schedule/settings", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		is_vacation_enabled: params.is_vacation_enabled,
		vacation_start_time: params.vacation_start_time,
		vacation_end_time: params.vacation_end_time,
		timezone: params.timezone,
	});
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}