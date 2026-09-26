
import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `analytics:read:extensions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The extension's client ID. If specified, the response contains a report for the specified extension. If not specified, the response includes a report for each extension that the authenticated user owns. */
	extension_id?: string;
	/**
	 * The type of analytics report to get. Possible values are:
	 * - overview_v2
	 */
	type?: "overview_v2";
	/**
	 * The reporting window's start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z).

	 * The start date must be on or after January 31, 2018. If you specify an earlier date, the API ignores it and uses January 31, 2018. If you specify a start date, you must specify an end date. If you don't specify a start and end date, the report includes all available data since January 31, 2018.

	 * The report contains one row of data for each day in the reporting window.
	 */
	started_at?: string;
	/**
	 * The reporting window's end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-27T00:00:00Z). The report is inclusive of the end date.

	 * Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that's earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
	 */
	ended_at?: string;
	/**
	 * **Integer**. The maximum number of report URLs to return per page in the response. The minimum page size is 1 URL per page and the maximum is 100 URLs per page. The default is 20.

	 * **NOTE**: While you may specify a maximum value of 100, the response will contain at most 20 URLs per page.
	 */
	first?: number;
	/**
	 * The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)

	 * This parameter is ignored if the `extension_id` parameter is set.
	 */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of reports. The reports are returned in no particular order; however, the data within each report is in ascending order by date (newest first). The report contains one row of data per day of the reporting window; the report contains rows for only those days that the extension was used. The array is empty if there are no reports. */
	data: {
		/** An ID that identifies the extension that the report was generated for. */
		extension_id: string;
		/** The URL that you use to download the report. The URL is valid for 5 minutes. */
		URL: string;
		/** The type of report. */
		type: string;
		/** The reporting window’s start and end dates, in RFC3339 format. */
		date_range: {
			/** The reporting window’s start date. */
			started_at: string;
			/** The reporting window’s end date. */
			ended_at: string;
		};
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

/**
 * ## [Get Extension Analytics](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)
 * Gets an analytics report for one or more extensions. The response contains the URLs used to download the reports (CSV files). [Learn More](https://dev.twitch.tv/docs/insights)

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's analytics reports.
 * 400 Bad Request|The start and end dates are optional but if you specify one, you must specify the other.
 * ㅤ|The end date must be equal to or later than the start date.
 * ㅤ|The cursor specified in the `after` query parameter is not valid.
 * ㅤ|The resource supports only forward pagination (use the `after` query parameter).
 * ㅤ|The `first` query parameter is outside the allowed range of values.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **analytics:read:extensions** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The Client-Id header is required.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The extension specified in the `extension_id` query parameter was not found.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "analytics/extensions", Options.apiHelixPath);
	url.searchParams.appendMany({
		extension_id: params.extension_id,
		type: params.type,
		started_at: params.started_at,
		ended_at: params.ended_at,
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