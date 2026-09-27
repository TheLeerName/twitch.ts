import { Options, Helix } from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:read:predictions` or `channel:manage:predictions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster whose predictions you want to get. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID of the prediction to get. You may specify a maximum of 25 IDs. The endpoint ignores duplicate IDs and those not owned by the broadcaster. */
	id?: string | string[];
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 25 items per page. The default is 20. */
	first?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The broadcaster’s list of Channel Points Predictions. The list is sorted in descending ordered by when the prediction began (the most recent prediction is first). The list is empty if the broadcaster hasn’t created predictions. */
	data: {
		/** An ID that identifies this prediction. */
		id: string;
		/** An ID that identifies the broadcaster that created the prediction. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The question that the prediction asks. For example, `Will I finish this entire pizza?` */
		title: string;
		/** The ID of the winning outcome. Is **null** unless `status` is RESOLVED. */
		winning_outcome_id: string | null;
		/** The list of possible outcomes for the prediction. */
		outcomes: {
			/** An ID that identifies this outcome. */
			id: string;
			/** The outcome’s text. */
			title: string;
			/** **Integer**. The number of unique viewers that chose this outcome. */
			users: number;
			/** **Integer**. The number of Channel Points spent by viewers on this outcome. */
			channel_points: number;
			/** A list of viewers who were the top predictors; otherwise, **null** if none. */
			top_predictors: {
				/** An ID that identifies the viewer. */
				user_id: string;
				/** The viewer’s display name. */
				user_name: string;
				/** The viewer’s login name. */
				user_login: string;
				/** **Integer**. The number of Channel Points the viewer spent. */
				channel_points_used: number;
				/** **Integer**. The number of Channel Points distributed to the viewer. */
				channel_points_won: number;
			}[] | null;
		}[];
		/**
		 * The color that visually identifies this outcome in the UX. Possible values are:
		 * - BLUE
		 * - PINK

		 * If the number of outcomes is two, the color is BLUE for the first outcome and PINK for the second outcome. If there are more than two outcomes, the color is BLUE for all outcomes.
		 */
		color: "BLUE" | "PINK";
		/** **Integer**. The length of time (in seconds) that the prediction will run for. */
		prediction_window: number;
		/**
		 * The prediction’s status. Valid values are:
		 * - ACTIVE — The Prediction is running and viewers can make predictions.
		 * - CANCELED — The broadcaster canceled the Prediction and refunded the Channel Points to the participants.
		 * - LOCKED — The broadcaster locked the Prediction, which means viewers can no longer make predictions.
		 * - RESOLVED — The winning outcome was determined and the Channel Points were distributed to the viewers who predicted the correct outcome.
		 */
		status: "ACTIVE" | "CANCELED" | "LOCKED" | "RESOLVED";
		/** The UTC date and time of when the Prediction began. */
		created_at: string;
		/** The UTC date and time of when the Prediction ended. If `status` is ACTIVE, this is set to **null**. */
		ended_at: string | null;
		/** The UTC date and time of when the Prediction was locked. If `status` is not LOCKED, this is set to **null**. */
		locked_at: string | null;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Get Predictions](https://dev.twitch.tv/docs/api/reference/#get-predictions)
 * Gets a list of Channel Points Predictions that the broadcaster created.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of predictions.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:read:predictions** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "predictions", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		id: params.id,
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