import * as Main from "../..";
import { Prediction } from "./get";

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
	data: [Prediction];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "predictions", Main.Options.apiHelixPath);
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
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
	};
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
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}