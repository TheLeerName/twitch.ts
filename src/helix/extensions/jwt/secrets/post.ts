import * as Main from "../../../..";

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
	/** The ID of the extension to apply the shared secret to. */
	extension_id: string;
	/** **Integer**. The amount of time, in seconds, to delay activating the secret. The delay should provide enough time for instances of the extension to gracefully switch over to the new secret. The minimum delay is 300 seconds (5 minutes). The default is 300 seconds. */
	delay?: number;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the newly added secrets. */
	data: {
		/** **Integer**. The version number that identifies this definition of the secret’s data. */
		format_version: number;
		/** The list of secrets. */
		secrets: {
			/** The raw secret that you use with JWT encoding. */
			content: string;
			/** The UTC date and time (in RFC3339 format) that you may begin using this secret to sign a JWT. */
			active_at: string;
			/** The UTC date and time (in RFC3339 format) that you must stop using this secret to decode a JWT. */
			expires_at: string;
		}[];
	}[];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "extensions/jwt/secrets", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		extension_id: params.extension_id,
		delay: params.delay,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Create Extension Secret](https://dev.twitch.tv/docs/api/reference/#create-extension-secret)
 * Creates a shared secret used to sign and verify JWT tokens. Creating a new secret removes the current secrets from service. Use this function only when you are ready to use the new secret it returns.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the new secret.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * ㅤ|The delay specified in the `delay` query parameter is too short.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The Client-Id header is required.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}