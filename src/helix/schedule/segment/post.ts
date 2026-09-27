import * as Main from "../../..";
import { Segment, Vacation } from "../get";

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
	/** The ID of the broadcaster that owns the schedule to add the broadcast segment to. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
}

export interface RequestBody {
	/** The date and time that the broadcast segment starts. Specify the date and time in RFC3339 format (for example, 2021-07-01T18:00:00Z). */
	start_time: string;
	/** The time zone where the broadcast takes place. Specify the time zone using [IANA time zone database](https://www.iana.org/time-zones) format (for example, America/New_York). */
	timezone: string;
	/** The length of time, in minutes, that the broadcast is scheduled to run. The duration must be in the range 30 through 1380 (23 hours). */
	duration: string;
	/** A Boolean value that determines whether the broadcast recurs weekly. Is **true** if the broadcast recurs weekly. Only partners and affiliates may add non-recurring broadcasts. */
	is_recurring?: boolean;
	/** The ID of the category that best represents the broadcast’s content. To get the category ID, use the {@link Helix.SearchCategories | Search Categories} endpoint. */
	category_id?: string;
	/** The broadcast’s title. The title may contain a maximum of 140 characters. */
	title?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** The broadcaster’s streaming scheduled. */
	data: {
		/** A list that contains the single broadcast segment that you added. */
		segments: [Segment];
		/** The ID of the broadcaster that owns the broadcast schedule. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The dates when the broadcaster is on vacation and not streaming. Is set to **null** if vacation mode is not enabled. */
		vacation: Vacation;
	};
}

/**
 * ## [Create Channel Stream Schedule Segment](https://dev.twitch.tv/docs/api/reference/#create-channel-stream-schedule-segment)
 * Adds a single or recurring broadcast to the broadcaster’s streaming schedule. For information about scheduling broadcasts, see [Stream Schedule](https://help.twitch.tv/s/article/channel-page-setup#Schedule).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 Ok|Successfully added the broadcast segment.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The format of the date and time in the `start_time` field is not valid.
 * ㅤ|The value in the `timezone` field is not valid.
 * ㅤ|The value in the `duration` field is not valid.
 * ㅤ|The ID in the `category_id` field is not valid.
 * ㅤ|The string in the `title` field is too long.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:schedule** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 403 Forbidden|Only partners and affiliates may add non-recurring broadcast segments.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "schedule/segment", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			start_time: params.start_time,
			timezone: params.timezone,
			duration: params.duration,
			is_recurring: params.is_recurring,
			category_id: params.category_id,
			title: params.title,
		}),
	});
}