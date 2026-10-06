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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:shield_mode`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:shield_mode`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster whose Shield Mode you want to activate or deactivate. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that is one of the broadcaster’s moderators. This ID must match the user ID in the access token. */
	moderator_id: string;
}

export interface RequestBody {
	/** A Boolean value that determines whether to activate Shield Mode. Set to **true** to activate Shield Mode; otherwise, **false** to deactivate Shield Mode. */
	is_active: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains a single object with the broadcaster’s updated Shield Mode status. */
	data: [{
		/** A Boolean value that determines whether Shield Mode is active. Is **true** if Shield Mode is active; otherwise, **false**. */
		is_active: boolean;
		/** An ID that identifies the moderator that last activated Shield Mode. */
		moderator_id: string;
		/** The moderator’s login name. */
		moderator_login: string;
		/** The moderator’s display name. */
		moderator_name: string;
		/** The UTC timestamp (in RFC3339 format) of when Shield Mode was last activated. */
		last_activated_at: string;
	}];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "moderation/shield_mode", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			is_active: params.is_active,
		}),
	};
}

/**
 * ## [Update Shield Mode Status](https://dev.twitch.tv/docs/api/reference/#update-shield-mode-status)
 * Activates or deactivates the broadcaster’s Shield Mode.

 * Twitch’s Shield Mode feature is like a panic button that broadcasters can push to protect themselves from chat abuse coming from one or more accounts. When activated, Shield Mode applies the overrides that the broadcaster configured in the Twitch UX. If the broadcaster hasn’t configured Shield Mode, it applies default overrides.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the broadcaster’s Shield Mode status.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `broadcaster_id` query parameter is not valid.
 * ㅤ|The `is_active` field is required.
 * ㅤ|The value in the `is_active` field is not valid.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:shield_mode** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}