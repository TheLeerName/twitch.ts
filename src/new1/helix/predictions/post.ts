import { Options, Helix } from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:predictions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The ID of the broadcaster that’s running the prediction. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The question that the broadcaster is asking. For example, `Will I finish this entire pizza?` The title is limited to a maximum of 45 characters. */
	title: string;
	/** The list of possible outcomes that the viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 10 choices. */
	outcomes: {
		/** The text of one of the outcomes that the viewer may select. The title is limited to a maximum of 25 characters. */
		title: string;
	}[];
	/** **Integer**. The length of time (in seconds) that the prediction will run for. The minimum is 30 seconds and the maximum is 1800 seconds (30 minutes). */
	prediction_window: number;
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the single prediction that you created. */
	data: [{
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
	}];
}

/**
 * ## [Create Prediction](https://dev.twitch.tv/docs/api/reference/#create-prediction)
 * Creates a Channel Points Prediction.

 * With a Channel Points Prediction, the broadcaster poses a question and viewers try to predict the outcome. The prediction runs as soon as it’s created. The broadcaster may run only one prediction at a time.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the Channel Points Prediction.
 * 400 Bad Request|The `broadcaster_id` field is required.
 * ㅤ|The `title` field is required.
 * ㅤ|The `outcomes` field is required.
 * ㅤ|The `prediction_window` field is required.
 * ㅤ|The value in `prediction_window` is outside the allowed range of values.
 * ㅤ|The prediction's `title` is too long.
 * ㅤ|The outcome's `title` is too long.
 * ㅤ|The outcome's `title` failed AutoMod checks.
 * ㅤ|There must be 2 outcomes in the prediction.
 * ㅤ|The broadcaster already has a prediction that's running; you may not create another prediction until the current prediction is resolved or canceled.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:predictions** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 429 Too Many Requests| 
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "predictions", Options.apiHelixPath);
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
			outcomes: params.outcomes,
			prediction_window: params.prediction_window,
		}),
	});
}