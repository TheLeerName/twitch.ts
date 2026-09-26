import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:read:moderated_channels`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `user:read:moderated_channels`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** A user’s ID. Returns the list of channels that this user has moderator privileges in. This ID must match the user ID in the user OAuth token */
	user_id: string;
	/** The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value. */
	after?: string;
	/**
	 * **Integer**. The maximum number of items to return per page in the response.

	 * Minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 */
	first?: number;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of channels that the user has moderator privileges in. */
	data: {
		/** An ID that uniquely identifies the channel this user can moderate. */
		broadcaster_id: string;
		/** The channel’s login name. */
		broadcaster_login: string;
		/** The channels’ display name. */
		broadcaster_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Get Moderated Channels](https://dev.twitch.tv/docs/api/reference/#get-moderated-channels)
 * Gets a list of channels that the specified user has moderator privileges in.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "moderation/channels", Options.apiHelixPath);
	url.searchParams.appendMany({
		user_id: params.user_id,
		after: params.after,
		first: params.first,
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