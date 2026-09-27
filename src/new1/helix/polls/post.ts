import { Options, Helix } from "../..";
import { Poll } from "./get";

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
	/** The question that viewers will vote on. For example, `What game should I play next?` The question may contain a maximum of 60 characters. */
	title: string;
	/** A list of choices that viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 5 choices. */
	choices: {
		/** One of the choices the viewer may select. The choice may contain a maximum of 25 characters. */
		title: string;
	}[];
	/** **Integer**. The length of time (in seconds) that the poll will run for. The minimum is 15 seconds and the maximum is 1800 seconds (30 minutes). */
	duration: number;
	/** A Boolean value that indicates whether viewers may cast additional votes using Channel Points. If **true**, the viewer may cast more than one vote but each additional vote costs the number of Channel Points specified in `channel_points_per_vote`. The default is **false** (viewers may cast only one vote). For information about Channel Points, see [Channel Points Guide](https://help.twitch.tv/s/article/channel-points-guide). */
	channel_points_voting_enabled?: boolean;
	/** **Integer**. The number of points that the viewer must spend to cast one additional vote. The minimum is 1 and the maximum is 1000000. Set only if `ChannelPointsVotingEnabled` is **true**. */
	channel_points_per_vote?: number;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the single poll that you created. */
	data: [Poll];
}

/**
 * ## [Create Poll](https://dev.twitch.tv/docs/api/reference/#create-poll)
 * Creates a poll that viewers in the broadcaster’s channel can vote on.

 * The poll begins as soon as it’s created. You may run only one poll at a time.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the poll.
 * 400 Bad Request|The `broadcaster_id` field is required.
 * ㅤ|The `title` field is required.
 * ㅤ|The `choices` field is required.
 * ㅤ|The `duration` field is required.
 * ㅤ|The value in `duration` is outside the allowed range of values.
 * ㅤ|The value in `channel_points_per_vote` is outside the allowed range of values.
 * ㅤ|The value in `bits_per_vote` is outside the allowed range of values.
 * ㅤ|The poll's `title` is too long.
 * ㅤ|The choice's `title` is too long.
 * ㅤ|The choice's `title` failed AutoMod checks.
 * ㅤ|The number of choices in the poll may not be less than 2 or greater that 5.
 * ㅤ|The broadcaster already has a poll that's running; you may not create another poll until the current poll completes.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token is missing the **channel:manage:polls** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "polls", Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			broadcaster_id: params.broadcaster_id,
			title: params.title,
			choices: params.choices,
			duration: params.duration,
			channel_points_voting_enabled: params.channel_points_voting_enabled,
			channel_points_per_vote: params.channel_points_per_vote,
		}),
	});
}