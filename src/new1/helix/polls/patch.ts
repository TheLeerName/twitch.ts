import { Options, Helix } from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:polls`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The ID of the broadcaster that’s running the poll. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID of the poll to update. */
	id: string;
	/**
	 * The status to set the poll to. Possible case-sensitive values are:
	 * - TERMINATED — Ends the poll before the poll is scheduled to end. The poll remains publicly visible.
	 * - ARCHIVED — Ends the poll before the poll is scheduled to end, and then archives it so it's no longer publicly visible.
	 */
	status: "TERMINATED" | "ARCHIVED";
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the poll that you ended. */
	data: [{
		/** An ID that identifies the poll. */
		id: string;
		/** An ID that identifies the broadcaster that created the poll. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The question that viewers are voting on. For example, `What game should I play next?` The title may contain a maximum of 60 characters. */
		title: string;
		/** A list of choices that viewers can choose from. The list will contain a minimum of two choices and up to a maximum of five choices. */
		choices: {
			/** An ID that identifies this choice. */
			id: string;
			/** The choice’s title. The title may contain a maximum of 25 characters. */
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
		 * The poll’s status. Valid values are:
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
	}];
}

/**
 * ## [End Poll](https://dev.twitch.tv/docs/api/reference/#end-poll)
 * Ends an active poll. You have the option to end it or end it and archive it.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully ended the poll.
 * 400 Bad Request|The `broadcaster_id` field is required.
 * ㅤ|The `id` field is required.
 * ㅤ|The `status` field is required.
 * ㅤ|The value in the `status` field is not valid.
 * ㅤ|The poll must be active to terminate or archive it.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:polls** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "polls", Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			broadcaster_id: params.broadcaster_id,
			id: params.id,
			status: params.status,
		}),
	});
}