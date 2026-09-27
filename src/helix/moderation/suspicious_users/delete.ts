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
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:suspicious_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:suspicious_users`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The user ID of the broadcaster, indicating the channel where the status is being removed. */
	broadcaster_id: string;
	/** The user ID of the moderator who is removing the status. */
	moderator_id: string;
	/** The ID of the user having the suspicious status removed. */
	user_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** An array with one object containing information about the suspicious user action. */
	data: [{
		/** The ID of the user having the suspicious status removed. */
		user_id: string;
		/** The user ID of the broadcaster indicating in which channel the status is being removed. */
		broadcaster_id: string;
		/** The user ID of the moderator who modified the last status. */
		moderator_id: string;
		/** The timestamp of the last time this user’s status was updated. */
		updated_at: string;
		/** The type of suspicious status. Possible values are: NO_TREATMENT */
		status: "NO_TREATMENT";
		/** An array of strings representing the type(s) of suspicious user this is. Possible values are: MANUALLY_ADDED, DETECTED_BAN_EVADER, DETECTED_SUS_CHATTER, BANNED_IN_SHARED_CHANNEL */
		types: ("MANUALLY_ADDED" | "DETECTED_BAN_EVADER" | "DETECTED_SUS_CHATTER" | "BANNED_IN_SHARED_CHANNEL")[];
	}];
}

/**
 * ## [Remove Suspicious Status From Chat User](https://dev.twitch.tv/docs/api/reference/#remove-suspicious-status-from-chat-user)
 * Remove a suspicious user status from a chatter on broadcaster’s channel.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully removed a suspicious user status.
 * 400 Bad Request|        
 * ㅤ|Validation errors: Missing required fields.        
 * ㅤ|The ID in the broadcaster_id query parameter was not found.        
 * ㅤ|The status update is not allowed for this user.      
 * 401 Unauthorized|        
 * ㅤ|The Authorization header is required and must specify user access token.        
 * ㅤ|The user access token must include the **moderator:manage:suspicious_users** scope.        
 * ㅤ|The OAuth token is not valid.        
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.      
 * 403 Forbidden|        
 * ㅤ|The user in the moderator_id query parameter is not one of the broadcaster's moderators.      
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "moderation/suspicious_users", Options.apiHelixPath);
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