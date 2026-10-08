import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:automod_settings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:automod_settings`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** The ID of the broadcaster whose AutoMod settings you want to update. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

/**
 * Because PUT is an overwrite operation, you must include all the fields that you want set after the operation completes. Typically, you’ll send a GET request, update the fields you want to change, and pass that object in the PUT request.

 * You may set either `overall_level` or the individual settings like `aggression`, but not both.

 * Setting `overall_level` applies default values to the individual settings. However, setting `overall_level` to 4 does not necessarily mean that it applies 4 to all the individual settings. Instead, it applies a set of recommended defaults to the rest of the settings. For example, if you set `overall_level` to 2, Twitch provides some filtering on discrimination and sexual content, but more filtering on hostility (see the first example response).

 * If `overall_level` is currently set and you update `swearing` to 3, `overall_level` will be set to **null** and all settings other than `swearing` will be set to 0. The same is true if individual settings are set and you update `overall_level` to 3 — all the individual settings are updated to reflect the default level.

 * Note that if you set all the individual settings to values that match what `overall_level` would have set them to, Twitch changes AutoMod to use the default AutoMod level instead of using the individual settings.

 * Valid values for all levels are from 0 (no filtering) through 4 (most aggressive filtering). These levels affect how aggressively AutoMod holds back messages for moderators to review before they appear in chat or are denied (not shown).
 */
export interface RequestBody {
	/** **Integer**. The Automod level for hostility involving aggression. */
	aggression?: number;
	/** **Integer**. The Automod level for hostility involving name calling or insults. */
	bullying?: number;
	/** **Integer**. The Automod level for discrimination against disability. */
	disability?: number;
	/** **Integer**. The Automod level for discrimination against women. */
	misogyny?: number;
	/** **Integer**. The default AutoMod level for the broadcaster. */
	overall_level?: number;
	/** **Integer**. The Automod level for racial discrimination. */
	race_ethnicity_or_religion?: number;
	/** **Integer**. The Automod level for sexual content. */
	sex_based_terms?: number;
	/** **Integer**. The AutoMod level for discrimination based on sexuality, sex, or gender. */
	sexuality_sex_or_gender?: number;
	/** **Integer**. The Automod level for profanity. */
	swearing?: number;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters & RequestBody;

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

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "moderation/automod/settings",
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		params: {
			broadcaster_id: params.broadcaster_id,
			moderator_id: params.moderator_id,
		},
		data: JSON.stringify({
			aggression: params.aggression,
			bullying: params.bullying,
			disability: params.disability,
			misogyny: params.misogyny,
			overall_level: params.overall_level,
			race_ethnicity_or_religion: params.race_ethnicity_or_religion,
			sex_based_terms: params.sex_based_terms,
			sexuality_sex_or_gender: params.sexuality_sex_or_gender,
			swearing: params.swearing,
		}),
		...params.config,
	};
}

/**
 * ## [Update AutoMod Settings](https://dev.twitch.tv/docs/api/reference/#update-automod-settings)
 * Updates the broadcaster’s AutoMod settings. The settings are used to automatically block inappropriate or harassing messages from appearing in the broadcaster’s chat room.

 * ### Request Body
 * Because PUT is an overwrite operation, you must include all the fields that you want set after the operation completes. Typically, you’ll send a GET request, update the fields you want to change, and pass that object in the PUT request.

 * You may set either `overall_level` or the individual settings like `aggression`, but not both.

 * Setting `overall_level` applies default values to the individual settings. However, setting `overall_level` to 4 does not necessarily mean that it applies 4 to all the individual settings. Instead, it applies a set of recommended defaults to the rest of the settings. For example, if you set `overall_level` to 2, Twitch provides some filtering on discrimination and sexual content, but more filtering on hostility (see the first example response).

 * If `overall_level` is currently set and you update `swearing` to 3, `overall_level` will be set to **null** and all settings other than `swearing` will be set to 0. The same is true if individual settings are set and you update `overall_level` to 3 — all the individual settings are updated to reflect the default level.

 * Note that if you set all the individual settings to values that match what `overall_level` would have set them to, Twitch changes AutoMod to use the default AutoMod level instead of using the individual settings.

 * Valid values for all levels are from 0 (no filtering) through 4 (most aggressive filtering). These levels affect how aggressively AutoMod holds back messages for moderators to review before they appear in chat or are denied (not shown).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 Ok|Successfully updated the broadcaster’s AutoMod settings.
 * 400 Bad Request|The `broadcaster_id` is required.
 * ㅤ|The `moderator_id` is required.
 * ㅤ|The `overall_level` setting or one or more individual settings like `aggression` is required; the overall and individual settings are mutually exclusive, so don't set both.
 * ㅤ|The value of one or more AutoMod settings is not valid.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:automod_settings** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}