import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:read:hype_train`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The User ID of the channel broadcaster. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains information related to the channel’s Hype Train. */
	data: [{
		/** An object describing the current Hype Train. Null if a Hype Train is not active. */
		current: {
			/** The Hype Train ID. */
			id: string;
			/** The broadcaster ID. */
			broadcaster_user_id: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** **Integer**. The current level of the Hype Train. */
			level: number;
			/** **Integer**. Total points contributed to the Hype Train. */
			total: number;
			/** **Integer**. The number of points contributed to the Hype Train at the current level. */
			progress: number;
			/** **Integer**. The number of points required to reach the next level. */
			goal: number;
			/** The contributors with the most points contributed. */
			top_contributions: {
				/** The ID of the user that made the contribution. */
				user_id: string;
				/** The user’s login name. */
				user_login: string;
				/** The user’s display name. */
				user_name: string;
				/**
				 * The contribution method used. Possible values are: 
				 * - **bits** - Cheering with Bits. 
				 * - **subscription** - Subscription activity like subscribing or gifting subscriptions. 
				 * - **other** - Covers other contribution methods not listed.
				 */
				type: "bits" | "subscription" | "other";
				/** **Integer**. The total number of points contributed for the type. */
				total: number;
			}[];
			/** A list containing the broadcasters participating in the shared Hype Train. Null if the Hype Train is not shared. */
			shared_train_participants: {
				/** The broadcaster ID. */
				broadcaster_user_id: string;
				/** The broadcaster login. */
				broadcaster_user_login: string;
				/** The broadcaster display name. */
				broadcaster_user_name: string;
			}[];
			/** The time when the Hype Train started. */
			started_at: string;
			/** The time when the Hype Train expires. The expiration is extended when the Hype Train reaches a new level. */
			expires_at: string;
			/**
			 * The type of the Hype Train. Possible values are: 
			 * - **treasure**
			 * - **golden_kappa**
			 * - **regular**

			 * [Learn More](https://help.twitch.tv/s/article/hype-train-guide#special)
			 */
			type: "treasure" | "golden_kappa" | "regular";
			/** Indicates if the Hype Train is shared. When true, shared_train_participants will contain the list of broadcasters the train is shared with. */
			is_shared_train: boolean;
		} | null;
		/** An object with information about the channel’s Hype Train records. Null if a Hype Train has not occurred. */
		all_time_high: {
			/** **Integer**. The level of the record Hype Train. */
			level: number;
			/** **Integer**. Total points contributed to the record Hype Train. */
			total: number;
			/** The time when the record was achieved. */
			achieved_at: string;
		} | null;
		/** An object with information about the channel’s shared Hype Train records. Null if a Hype Train has not occurred. */
		shared_all_time_high: {
			/** **Integer**. The level of the record Hype Train. */
			level: number;
			/** **Integer**. Total points contributed to the record Hype Train. */
			total: number;
			/** The time when the record was achieved. */
			achieved_at: string;
		} | null;
	}];
}

/**
 * ## [Get Hype Train Status](https://dev.twitch.tv/docs/api/reference/#get-hype-train-status)
 * Get the status of a Hype Train for the specified broadcaster.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the status object.
 * 400 Bad Request|The ID in the `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The OAuth token is not valid.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * 500 Internal Error|Internal Server Error.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "hypetrain/status", Options.apiHelixPath);
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