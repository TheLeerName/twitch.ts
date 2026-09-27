import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that installed the extension. This parameter is required if you set the `segment` parameter to broadcaster or developer. Do not specify this parameter if you set `segment` to global. */
	broadcaster_id?: string;
	/** The ID of the extension that contains the configuration segment you want to get. */
	extension_id: string;
	/**
	 * The type of configuration segment to get. Possible case-sensitive values are: 
	 * - broadcaster
	 * - developer
	 * - global

	 * You may specify one or more segments. Ignores duplicate segments.
	 */
	segment: "broadcaster" | "developer" | "global" | ("broadcaster" | "developer" | "global")[];
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of requested configuration segments. The list is returned in the same order that you specified the list of segments in the request. */
	data: {
		/**
		 * The type of segment. Possible values are: 
		 * - broadcaster
		 * - developer
		 * - global
		 */
		segment: "broadcaster" | "developer" | "global";
		/** The ID of the broadcaster that installed the extension. The object includes this field only if the `segment` query parameter is set to developer or broadcaster. */
		broadcaster_id: string;
		/** The contents of the segment. This string may be a plain-text string or a string-encoded JSON object. */
		content: string;
		/** The version number that identifies this definition of the segment’s data. */
		version: string;
	}[];
}

/**
 * ## [Get Extension Configuration Segment](https://dev.twitch.tv/docs/api/reference/#get-extension-configuration-segment)
 * Gets the specified configuration segment from the specified extension.

 * **Rate Limits**: You may retrieve each segment a maximum of 20 times per minute.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the configurations.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * ㅤ|The value in the `segment` query parameter is not valid.
 * ㅤ|The `broadcaster_id` query parameter is required if the `segment` query parameter is set to broadcaster or developer.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The Client-Id header is required.
 * 429 Too many requests|The app exceeded the number of requests that it may make per minute. See Rate Limits above.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "extensions/configurations", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		extension_id: params.extension_id,
		segment: params.segment,
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