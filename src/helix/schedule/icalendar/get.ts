import * as Main from "../../..";

export interface RequestQueryParameters {
	/** The ID of the broadcaster that owns the streaming schedule you want to get. */
	broadcaster_id: string;
}

export type RequestParameters = Main.RequestParameters & RequestQueryParameters;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "schedule/icalendar",
		method: "GET",
		params: {
			broadcaster_id: params.broadcaster_id,
		},
		...params.config,
	};
}

/**
 * ## [Get Channel iCalendar](https://dev.twitch.tv/docs/api/reference/#get-channel-icalendar)
 * Gets the broadcaster’s streaming schedule as an [iCalendar](https://datatracker.ietf.org/doc/html/rfc5545).

 * ### Response Body
 * The response body contains the iCalendar data (see [RFC5545](https://datatracker.ietf.org/doc/html/rfc5545)).

 * The Content-Type response header is set to `text/calendar`.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s schedule as an iCalendar.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}