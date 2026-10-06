import * as Main from "../../..";

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that owns the streaming schedule you want to get. */
	broadcaster_id: string;
}

export type RequestParameters = RequestQueryParameters;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "schedule/icalendar", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		signal: params.signal,
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
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}