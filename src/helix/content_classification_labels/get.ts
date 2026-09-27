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

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Locale for the Content Classification Labels. Default: "en-US".
Supported locales: "bg-BG", "cs-CZ", "da-DK", "da-DK", "de-DE", "el-GR", "en-GB", "en-US", "es-ES", "es-MX", "fi-FI", "fr-FR", "hu-HU", "it-IT", "ja-JP", "ko-KR", "nl-NL", "no-NO", "pl-PL", "pt-BT", "pt-PT", "ro-RO", "ru-RU", "sk-SK", "sv-SE", "th-TH", "tr-TR", "vi-VN", "zh-CN", "zh-TW". */
	locale?:
	| "en-US"
	| "bg-BG"
	| "cs-CZ"
	| "da-DK"
	| "de-DE"
	| "el-GR"
	| "en-GB"
	| "es-ES"
	| "es-MX"
	| "fi-FI"
	| "fr-FR"
	| "hu-HU"
	| "it-IT"
	| "ja-JP"
	| "ko-KR"
	| "nl-NL"
	| "no-NO"
	| "pl-PL"
	| "pt-BT"
	| "pt-PT"
	| "ro-RO"
	| "ru-RU"
	| "sk-SK"
	| "sv-SE"
	| "th-TH"
	| "tr-TR"
	| "vi-VN"
	| "zh-CN"
	| "zh-TW";
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains information about the available content classification labels. */
	data: {
		/** Unique identifier for the CCL. */
		id: string;
		/** Localized description of the CCL. */
		description: string;
		/** Localized name of the CCL. */
		name: string;
	}[];
}

/**
 * ## [Get Content Classification Labels](https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels)
 * Gets information about Twitch content classification labels.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "content_classification_labels", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		locale: params.locale,
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