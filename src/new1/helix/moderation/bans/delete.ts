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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:banned_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:banned_users` and `user:bot`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster whose chat room the user is banned from chatting in. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** The ID of the user to remove the ban or timeout from. */
	user_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Unban User](https://dev.twitch.tv/docs/api/reference/#unban-user)
 * Removes the ban or timeout that was placed on the specified user.

 * To ban a user, see {@link Helix.BanUser | Ban user}.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully removed the ban or timeout.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * ㅤ|The `user_id` query parameter is required.
 * ㅤ|The user specified in the `user_id` query parameter is not banned.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:banned_users** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 * 409 Conflict|You may not update the user's ban state while someone else is updating the state. For example, someone else is currently removing the ban or timeout, or they're moving the user from a timeout to a ban. Please retry your request.
 * 429 Too Many Requests|The app has exceeded the number of requests it may make per minute for this broadcaster.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<undefined>> {
	const url = new Helix.URL(params.apiPath ?? "moderation/bans", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
		user_id: params.user_id,
	});
	return global.fetch(url as any, {
		method: "DELETE",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}