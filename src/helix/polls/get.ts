import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:read:polls` or `channel:manage:polls`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that created the polls. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/**
	 * A list of IDs that identify the polls to return. You may specify a maximum of 20 IDs.

	 * Specify this parameter only if you want to filter the list that the request returns. The endpoint ignores duplicate IDs and those not owned by this broadcaster.
	 */
	id?: string | string[];
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 20 items per page. The default is 20. */
	first?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of polls. The polls are returned in descending order of start time unless you specify IDs in the request, in which case they're returned in the same order as you passed them in the request. The list is empty if the broadcaster hasn't created polls. */
	data: Poll[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request's `after` query parameter. */
		cursor?: string;
	};
}

export interface Poll {
	/** An ID that identifies the poll. */
	id: string;
	/** An ID that identifies the broadcaster that created the poll. */
	broadcaster_id: string;
	/** The broadcaster's display name. */
	broadcaster_name: string;
	/** The broadcaster's login name. */
	broadcaster_login: string;
	/** The question that viewers are voting on. For example, `What game should I play next?` The title may contain a maximum of 60 characters. */
	title: string;
	/** A list of choices that viewers can choose from. The list will contain a minimum of two choices and up to a maximum of five choices. */
	choices: {
		/** An ID that identifies this choice. */
		id: string;
		/** The choice's title. The title may contain a maximum of 25 characters. */
		title: string;
	}[];
	/** **Integer**. The total number of votes cast for this choice. */
	votes: number;
	/** **Integer**. The number of votes cast using Channel Points. */
	channel_points_votes: number;
	/** **Integer**. Not used; will be set to 0. */
	bits_votes: 0;
	/** Not used; will be set to **false**. */
	bits_voting_enabled: false;
	/** **Integer**. Not used; will be set to 0. */
	bits_per_vote: 0;
	/** A Boolean value that indicates whether viewers may cast additional votes using Channel Points. For information about Channel Points, see [Channel Points Guide](https://help.twitch.tv/s/article/channel-points-guide). */
	channel_points_voting_enabled: boolean;
	/** **Integer**. The number of points the viewer must spend to cast one additional vote. */
	channel_points_per_vote: number;
	/**
	 * The poll's status. Valid values are:
	 * - ACTIVE — The poll is running.
	 * - COMPLETED — The poll ended on schedule (see the `duration` field).
	 * - TERMINATED — The poll was terminated before its scheduled end.
	 * - ARCHIVED — The poll has been archived and is no longer visible on the channel.
	 * - MODERATED — The poll was deleted.
	 * - INVALID — Something went wrong while determining the state.
	 */
	status: "ACTIVE" | "COMPLETED" | "TERMINATED" | "ARCHIVED" | "MODERATED" | "INVALID";
	/** **Integer**. The length of time (in seconds) that the poll will run for. */
	duration: number;
	/** The UTC date and time (in RFC3339 format) of when the poll began. */
	started_at: string;
	/** The UTC date and time (in RFC3339 format) of when the poll ended. If `status` is ACTIVE, this field is set to **null**. */
	ended_at: string | null;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "polls", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		id: params.id,
		first: params.first,
		after: params.after,
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
 * ## [Get Polls](https://dev.twitch.tv/docs/api/reference/#get-polls)
 * Gets a list of polls that the broadcaster created.

 * Polls are available for 90 days after they’re created.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's polls.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token is missing the **channel:read:polls** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 404 Not Found|None of the IDs in the `id` query parameters were found.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}