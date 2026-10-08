import * as Main from "../..";

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

export interface RequestQueryParameters {
	/** The name of the team to get. This parameter and the `id` parameter are mutually exclusive; you must specify the team’s name or ID but not both. */
	name: string;
	/** The ID of the team to get. This parameter and the `name` parameter are mutually exclusive; you must specify the team’s name or ID but not both. */
	id: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the single team that you requested. */
	data: [{
		/** The list of team members. */
		users: object[];
		/** An ID that identifies the team member. */
		user_id: string;
		/** The team member’s login name. */
		user_login: string;
		/** The team member’s display name. */
		user_name: string;
		/** A URL to the team’s background image. This field is **null** if the team does not have a background image set. */
		background_image_url: string | null;
		/** A URL to the team’s banner. This field is **null** if the team does not have a banner image set. */
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
	}];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "teams",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			name: params.name,
			id: params.id,
		},
		...params.config,
	};
}

/**
 * ## [Get Teams](https://dev.twitch.tv/docs/api/reference/#get-teams)
 * Gets information about the specified Twitch team. [Read More](https://help.twitch.tv/s/article/twitch-teams)

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the team's information.
 * 400 Bad Request|The `name` or `id` query parameter is required.
 * ㅤ|Specify either the `name` or `id` query parameter but not both.
 * ㅤ|The ID in the `id` query parameter is not valid.
 * 401 Unauthorized|The Authorization header must contain an app access token or user access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|The specified team was not found.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}