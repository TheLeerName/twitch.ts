import { Options, Helix } from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `moderator:read:automod_settings` or `moderator:manage:automod_settings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scopes `moderator:read:automod_settings` or `moderator:manage:automod_settings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster whose AutoMod settings you want to get. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of AutoMod settings. The list contains a single object that contains all the AutoMod settings. */
	data: [{
		/** The broadcaster’s ID. */
		broadcaster_id: string;
		/** The moderator’s ID. */
		moderator_id: string;
		/** **Integer**. The default AutoMod level for the broadcaster. This field is **null** if the broadcaster has set one or more of the individual settings. */
		overall_level: number | null;
		/** **Integer**. The Automod level for discrimination against disability. */
		disability: number;
		/** **Integer**. The Automod level for hostility involving aggression. */
		aggression: number;
		/** **Integer**. The AutoMod level for discrimination based on sexuality, sex, or gender. */
		sexuality_sex_or_gender: number;
		/** **Integer**. The Automod level for discrimination against women. */
		misogyny: number;
		/** **Integer**. The Automod level for hostility involving name calling or insults. */
		bullying: number;
		/** **Integer**. The Automod level for profanity. */
		swearing: number;
		/** **Integer**. The Automod level for racial discrimination. */
		race_ethnicity_or_religion: number;
		/** **Integer**. The Automod level for sexual content. */
		sex_based_terms: number;
	}];
}

/**
 * ## [Get AutoMod Settings](https://dev.twitch.tv/docs/api/reference/#get-automod-settings)
 * Gets the broadcaster’s AutoMod settings. The settings are used to automatically block inappropriate or harassing messages from appearing in the broadcaster’s chat room.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s AutoMod settings.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `moderator_id` query parameter is required.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:read:automod_settings** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "moderation/automod/settings", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		moderator_id: params.moderator_id,
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