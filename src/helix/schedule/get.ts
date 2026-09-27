import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the streaming schedule you want to get. */
	broadcaster_id: string;
	/** The ID of the scheduled segment to return. You may specify a maximum of 100 IDs. */
	id?: string | string[];
	/** The UTC date and time that identifies when in the broadcaster’s schedule to start returning segments. If not specified, the request returns segments starting after the current UTC date and time. Specify the date and time in RFC3339 format (for example, `2022-09-01T00:00:00Z`). */
	start_time?: string;
	/** **Integer**. The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 25 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The broadcaster’s streaming schedule. */
	data: Schedule;
	/** The information used to page through a list of results. The object is empty if there are no more pages left to page through. [Read more](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request’s `after` query parameter to this value. */
		cursor?: string;
	};
}

export interface Schedule {
	/** The list of broadcasts in the broadcaster’s streaming schedule. */
	segments: Segment[];
	/** The ID of the broadcaster that owns the broadcast schedule. */
	broadcaster_id: string;
	/** The broadcaster’s display name. */
	broadcaster_name: string;
	/** The broadcaster’s login name. */
	broadcaster_login: string;
	/** The dates when the broadcaster is on vacation and not streaming. Is set to **null** if vacation mode is not enabled. */
	vacation: Vacation | null;
}

export interface Vacation {
	/** The UTC date and time (in RFC3339 format) of when the broadcaster’s vacation starts. */
	start_time: string;
	/** The UTC date and time (in RFC3339 format) of when the broadcaster’s vacation ends. */
	end_time: string;
}

export interface Segment {
	/** An ID that identifies this broadcast segment. */
	id: string;
	/** The UTC date and time (in RFC3339 format) of when the broadcast starts. */
	start_time: string;
	/** The UTC date and time (in RFC3339 format) of when the broadcast ends. */
	end_time: string;
	/** The broadcast segment’s title. */
	title: string;
	/** Indicates whether the broadcaster canceled this segment of a recurring broadcast. If the broadcaster canceled this segment, this field is set to the same value that’s in the  `end_time` field; otherwise, it’s set to **null**. */
	canceled_until: string | null;
	/** The type of content that the broadcaster plans to stream or **null** if not specified. */
	category: {
		/** An ID that identifies the category that best represents the content that the broadcaster plans to stream. For example, the game’s ID if the broadcaster will play a game or the Just Chatting ID if the broadcaster will host a talk show. */
		id: string;
		/** The name of the category. For example, the game’s title if the broadcaster will playing a game or Just Chatting if the broadcaster will host a talk show. */
		name: string;
	} | null;
	/** A Boolean value that determines whether the broadcast is part of a recurring series that streams at the same time each week or is a one-time broadcast. Is **true** if the broadcast is part of a recurring series. */
	is_recurring: boolean;
}

/**
 * ## [Get Channel Stream Schedule](https://dev.twitch.tv/docs/api/reference/#get-channel-stream-schedule)
 * Gets the broadcaster’s streaming schedule. You can get the entire schedule or specific segments of the schedule. [Learn More](https://help.twitch.tv/s/article/channel-page-setup#Schedule)

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s streaming schedule.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The ID in the `id` query parameter is not valid.
 * ㅤ|The format of the date and time in the `start_time` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the access token.
 * 403 Forbidden|Only partners and affiliates may add non-recurring broadcast segments.
 * 404 Not Found|The broadcaster has not created a streaming schedule.
 */
export async function fetch(params: RequestParameters): Promise<Main.Helix.Response<ResponseBody>> {
	const url = new Main.Helix.URL(params.apiPath ?? "schedule", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		id: params.id,
		start_time: params.start_time,
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