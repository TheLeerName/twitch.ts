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

export interface RequestBody {
	/** The ID of the extension to update. */
	extension_id: string;
	/**
	 * The configuration segment to update. Possible case-sensitive values are:
	 * - broadcaster
	 * - developer
	 * - global
	 */
	segment: "broadcaster" | "developer" | "global";
	/** The ID of the broadcaster that installed the extension. Include this field only if the `segment` is set to developer or broadcaster. */
	broadcaster_id?: string;
	/** The contents of the segment. This string may be a plain-text string or a string-encoded JSON object. */
	content?: string;
	/** The version number that identifies this definition of the segment’s data. If not specified, the latest definition is updated. */
	version?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & Main.RequestQueryParameters & RequestBody;

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "extensions/configurations",
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		data: JSON.stringify({
			extension_id: params.extension_id,
			segment: params.segment,
			broadcaster_id: params.broadcaster_id,
			content: params.content,
			version: params.version,
		}),
		...params.config,
	};
}

/**
 * ## [Set Extension Configuration Segment](https://dev.twitch.tv/docs/api/reference/#set-extension-configuration-segment)
 * Updates a configuration segment. The segment is limited to 5 KB. Extensions that are active on a channel do not receive the updated configuration.

 * **Rate Limits**: You may update the configuration a maximum of 20 times per minute.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the configuration.
 * 400 Bad Request|The `broadcaster_id` field is required if `segment` is set to developer or broadcaster.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The Client-Id header is required.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<{}, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}