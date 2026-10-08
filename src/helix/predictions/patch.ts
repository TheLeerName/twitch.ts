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
	/** The ID of the prediction to update. */
	id: string;
	/**
	 * The status to set the prediction to. Possible case-sensitive values are:
	 * - RESOLVED — The winning outcome is determined and the Channel Points are distributed to the viewers who predicted the correct outcome.
	 * - CANCELED — The broadcaster is canceling the prediction and sending refunds to the participants.
	 * - LOCKED — The broadcaster is locking the prediction, which means viewers may no longer make predictions.

	 * The broadcaster can update an active prediction to LOCKED, RESOLVED, or CANCELED; and update a locked prediction to RESOLVED or CANCELED.

	 * The broadcaster has up to 24 hours after the prediction window closes to resolve the prediction. If not, Twitch sets the status to CANCELED and returns the points.
	 */
	status: "RESOLVED" | "CANCELED" | "LOCKED";
	/** The ID of the winning outcome. You must set this parameter if you set `status` to RESOLVED. */
	winning_outcome_id?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestBody;

export interface ResponseBody {
	/** A list that contains the single prediction that you updated. */
	data: [Prediction];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "predictions",
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		data: JSON.stringify({
			broadcaster_id: params.broadcaster_id,
			id: params.id,
			status: params.status,
			winning_outcome_id: params.winning_outcome_id,
		}),
		...params.config,
	};
}

/**
 * ## [End Prediction](https://dev.twitch.tv/docs/api/reference/#end-prediction)
 * Locks, resolves, or cancels a Channel Points Prediction.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully ended the prediction.
 * 400 Bad Request|The `broadcaster_id` field is required.
 * ㅤ|The `id` field is required.
 * ㅤ|The `status` field is required.
 * ㅤ|The `winning_outcome_id` field is required if `status` is RESOLVED.
 * ㅤ|The value in the `status` field is not valid.
 * ㅤ|To update the prediction's status to RESOLVED or CANCELED, its current status must be ACTIVE or LOCKED.
 * ㅤ|To update the prediction's status to LOCKED, its current status must be ACTIVE.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID in the OAuth token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:predictions** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The prediction in the `id` field was not found.
 * ㅤ|The outcome in the `winning_outcome_id` field was not found.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}