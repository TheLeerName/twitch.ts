import { Options, Helix } from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:raids`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster that’s sending the raiding party. This ID must match the user ID in the user access token. */
	from_broadcaster_id: string;
	/** The ID of the broadcaster to raid. */
	to_broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains a single object with information about the pending raid. */
	data: [{
		/** The UTC date and time, in RFC3339 format, of when the raid was requested. */
		created_at: string;
		/**
		 * **IMPORTANT** This field is deprecated and returns only `false`.

		 * A Boolean value that indicates whether the channel being raided contains mature content.
		 */
		is_mature: boolean;
	}];
}

/**
 * ## [Start Raid](https://dev.twitch.tv/docs/api/reference/#start-a-raid)
 * Raid another channel by sending the broadcaster’s viewers to the targeted channel.

 * When you call the API from a chat bot or extension, the Twitch UX pops up a window at the top of the chat room that identifies the number of viewers in the raid. The raid occurs when the broadcaster clicks **Raid Now** or after the 90-second countdown expires.

 * To determine whether the raid successfully occurred, you must subscribe to the [Channel Raid](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelraid) event. For more information, see [Get notified when a raid begins](https://dev.twitch.tv/docs/api/raids#get-notified-when-a-raid-begins).

 * To cancel a pending raid, use the {@link Helix.CancelRaid | Cancel a raid} endpoint.

 * **Rate Limit**: The limit is 10 requests within a 10-minute window.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully requested to start a raid. To determine whether the raid successfully occurred (that is, the broadcaster clicked **Raid Now** or the countdown expired), you must subscribe to the [Channel Raid](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelraid) event.
 * 400 Bad Request|The raiding broadcaster is blocked from the targeted channel.
 * ㅤ|The targeted channel doesn't accept raids from this broadcaster.
 * ㅤ|There are too many viewers in the raiding party.
 * ㅤ|The IDs in `from_broadcaster_id` and `to_broadcaster_id` cannot be the same ID.
 * ㅤ|The ID in the `from_broadcaster_id` query parameter is not valid.
 * ㅤ|The ID in the `to_broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in `from_broadcaster_id` must match the user ID found in the request’s OAuth token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **channel:manage:raids** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The targeted channel was not found.
 * 409 Conflict|The broadcaster is already in the process of raiding another channel.
 * 429 Too Many Requests|The broadcaster exceeded the number of raid requests that they may make. The limit is 10 requests within a 10-minute window.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "raids", Options.apiHelixPath);
	url.searchParams.appendMany({
		from_broadcaster_id: params.from_broadcaster_id,
		to_broadcaster_id: params.to_broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}