import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external** and the `user_id` field to the ID of the user that owns the extension.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the broadcaster that installed the extension on their channel. */
	broadcaster_id: string;
}

export interface RequestBody {
	/** The ID of the extension to update. */
	extension_id: string;
	/** The version of the extension to update. */
	extension_version: string;
	/** The required_configuration string to use with the extension. */
	required_configuration: string;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "extensions/required_configuration", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
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
			extension_id: params.extension_id,
			extension_version: params.extension_version,
			required_configuration: params.required_configuration,
		}),
	};
}

/**
 * ## [Set Extension Required Configuration](https://dev.twitch.tv/docs/api/reference/#set-extension-required-configuration)
 * Updates the extension’s required_configuration string. Use this endpoint if your extension requires the broadcaster to configure the extension before activating it (to require configuration, you must select **Custom/My Own Service** in Extension [Capabilities](https://dev.twitch.tv/docs/extensions/life-cycle/#capabilities)). For more information, see [Required Configurations](https://dev.twitch.tv/docs/extensions/building#required-configurations) and [Setting Required Configuration](https://dev.twitch.tv/docs/extensions/building#setting-required-configuration-with-the-configuration-service-optional).

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 Not Found|Successfully updated the extension’s required_configuration string.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The `extension_id` field is required.
 * ㅤ|The `extension_version` field is required.
 * ㅤ|The `required_configuration` field is required.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The Client-Id header is required.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<undefined>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}