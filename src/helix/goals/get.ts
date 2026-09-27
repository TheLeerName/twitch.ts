import { Options, Helix } from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:goals`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster that created the goals. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of goals. The list is empty if the broadcaster hasn’t created goals. */
	data: {
		/** An ID that identifies this goal. */
		id: string;
		/** An ID that identifies the broadcaster that created the goal. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/**
		 * The type of goal. Possible values are: 
		 * - follower — The goal is to increase followers.
		 * - subscription — The goal is to increase subscriptions. This type shows the net increase or decrease in tier points associated with the subscriptions.
		 * - subscription_count — The goal is to increase subscriptions. This type shows the net increase or decrease in the number of subscriptions.
		 * - new_subscription — The goal is to increase subscriptions. This type shows only the net increase in tier points associated with the subscriptions (it does not account for users that unsubscribed since the goal started).
		 * - new_subscription_count — The goal is to increase subscriptions. This type shows only the net increase in the number of subscriptions (it does not account for users that unsubscribed since the goal started).
		 * - new_bit — The goal is to increase the amount of Bits used on the channel.
		 * - new_cheerer — The goal is to increase the amount of unique Cheerers on to Cheer on the channel.
		 */
		type: "follower" | "subscription" | "subscription_count" | "new_subscription" | "new_subscription_count" | "new_bit" | "new_cheerer";
		/** A description of the goal. Is an empty string if not specified. */
		description: string;
		/**
		 * **Integer**. The goal’s current value.

		 * The goal’s `type` determines how this value is increased or decreased. 
		 * - If `type` is follower, this field is set to the broadcaster's current number of followers. This number increases with new followers and decreases when users unfollow the broadcaster.
		 * - If `type` is subscription, this field is increased and decreased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased or decreased by 2, not 1.
		 * - If `type` is subscription_count, this field is increased by 1 for each new subscription and decreased by 1 for each user that unsubscribes.
		 * - If `type` is new_subscription, this field is increased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased by 2, not 1.
		 * - If `type` is new_subscription_count, this field is increased by 1 for each new subscription.
		 */
		current_amount: number;
		/** **Integer**. The goal’s target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
		target_amount: number;
		/** The UTC date and time (in RFC3339 format) that the broadcaster created the goal. */
		created_at: string;
	}[];
}

/**
 * ## [Get Creator Goals](https://dev.twitch.tv/docs/api/reference/#get-creator-goals)
 * Gets the broadcaster’s list of active goals. Use this endpoint to get the current progress of each goal.

 * Instead of polling for the progress of a goal, consider [subscribing](https://dev.twitch.tv/docs/eventsub/manage-subscriptions) to receive notifications when a goal makes progress using the [channel.goal.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelgoalprogress) subscription type. [Read More](https://dev.twitch.tv/docs/api/goals#requesting-event-notifications)

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s goals.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:goals** scope.
 * ㅤ|The ID in `broadcaster_id` must match the user ID in the user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "goals", Options.apiHelixPath);
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