
import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `bits:read`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** **Integer**. The number of results to return. The minimum count is 1 and the maximum is 100. The default is 10. */
	count?: number;
	/**
	 * The time period over which data is aggregated (uses the PST time zone). Possible values are:
	 * - day — A day spans from 00:00:00 on the day specified in `started_at` and runs through 00:00:00 of the next day.
	 * - week — A week spans from 00:00:00 on the Monday of the week specified in `started_at` and runs through 00:00:00 of the next Monday.
	 * - month — A month spans from 00:00:00 on the first day of the month specified in `started_at` and runs through 00:00:00 of the first day of the next month.
	 * - year — A year spans from 00:00:00 on the first day of the year specified in `started_at` and runs through 00:00:00 of the first day of the next year.
	 * - all — Default. The lifetime of the broadcaster's channel.
	 */
	period?: string;
	/**
	 * The start date, in RFC3339 format, used for determining the aggregation period. Specify this parameter only if you specify the `period` query parameter. The start date is ignored if `period` is all.

	 * Note that the date is converted to PST before being used, so if you set the start time to `2022-01-01T00:00:00.0Z` and `period` to month, the actual reporting period is December 2021, not January 2022. If you want the reporting period to be January 2022, you must set the start time to `2022-01-01T08:00:00.0Z` or `2022-01-01T00:00:00.0-08:00`.

	 * If your start date uses the ‘+’ offset operator (for example, `2022-01-01T00:00:00.0+05:00`), you must URL encode the start date.
	 */
	started_at?: string;
	/** An ID that identifies a user that cheered bits in the channel. If `count` is greater than 1, the response may include users ranked above and below the specified user. To get the leaderboard’s top leaders, don’t specify a user ID. */
	user_id?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of leaderboard leaders. The leaders are returned in rank order by how much they’ve cheered. The array is empty if nobody has cheered bits. */
	data: {
		/** An ID that identifies a user on the leaderboard. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** **Integer**. The user’s position on the leaderboard. */
		rank: number;
		/** **Integer**. The number of Bits the user has cheered. */
		score: number;
	}[];
	/** The reporting window’s start and end dates, in RFC3339 format. The dates are calculated by using the `started_at` and `period` query parameters. If you don’t specify the `started_at` query parameter, the fields contain empty strings. */
	date_range: {
		/** The reporting window’s start date. */
		started_at: string;
		/** The reporting window’s end date. */
		ended_at: string;
	};
	/** **Integer**. The number of ranked users in `data`. This is the value in the `count` query parameter or the total number of entries on the leaderboard, whichever is less. */
	total: number;
}

/**
 * ## [Get Bits Leaderboard](https://dev.twitch.tv/docs/api/reference/#get-bits-leaderboard)
 * Gets the Bits leaderboard for the authenticated broadcaster.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s Bits leaderboard.
 * 400 Bad Request|The time period specified in the `period` query parameter is not valid.
 * ㅤ|The `started_at` query parameter is required if `period` is not set to `all`.
 * ㅤ|The value in the `count` query parameter is outside the range of allowed values.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * ㅤ|The user access token must include the the **bits:read** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "bits/leaderboard", Options.apiHelixPath);
	url.searchParams.appendMany({
		count: params.count,
		period: params.period,
		started_at: params.started_at,
		user_id: params.user_id,
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