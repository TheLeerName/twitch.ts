import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose teams you want to get. */
	broadcaster_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of teams that the broadcaster is a member of. Returns an empty array if the broadcaster is not a member of a team. */
	data: {
		/** An ID that identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** A URL to the team’s background image. This field is **null** if the team does not have a background image set. */
		background_image_url: string | null;
		/** A URL to the team’s banner. This field is **null** if the team does not have a banner set. */
		banner: string | null;
		/** The UTC date and time (in RFC3339 format) of when the team was created. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) of the last time the team was updated. */
		updated_at: string;
		/** The team’s description. The description may contain formatting such as Markdown, HTML, newline (\n) characters, etc. */
		info: string;
		/** A URL to a thumbnail image of the team’s logo. */
		thumbnail_url: string;
		/** The team’s name. */
		team_name: string;
		/** The team’s display name. */
		team_display_name: string;
		/** An ID that identifies the team. */
		id: string;
	}[];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "teams/channel", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Get Channel Teams](https://dev.twitch.tv/docs/api/reference/#get-channel-teams)
 * Gets the list of Twitch teams that the broadcaster is a member of.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of teams.
 * 400 Bad Request|The `broadcaster_id` query parameter is missing or invalid.
 * 401 Unauthorized|The Authorization header must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The broadcaster was not found.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}