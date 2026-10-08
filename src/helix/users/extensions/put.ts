import * as Main from "../../..";
import { ComponentExtensionType, ExtensionType } from "./get";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `user:edit:broadcast`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** A dictionary that contains the data for a panel extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the panel’s data for each key. */
	panel?: Record<string, ExtensionType>;
	/** A dictionary that contains the data for a video-overlay extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the overlay’s data for each key. */
	overlay?: Record<string, ExtensionType>;
	/** A dictionary that contains the data for a video-component extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the component’s data for each key. */
	component?: Record<string, ComponentExtensionType>;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestBody;

export interface ResponseBody {
	/** The extensions that the broadcaster updated. */
	data: {
		/** A dictionary that contains the data for a panel extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the panel’s data for each key. */
		panel: Record<string, ExtensionType>;
		/** A dictionary that contains the data for a video-overlay extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the overlay’s data for each key. */
		overlay: Record<string, ExtensionType>;
		/** A dictionary that contains the data for a video-component extension. The dictionary’s key is a sequential number beginning with 1. The following fields contain the component’s data for each key. */
		component: Record<string, ComponentExtensionType>;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "users/extensions",
		method: "PUT",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		data: JSON.stringify({
			data: {
				panel: params.panel,
				overlay: params.overlay,
				component: params.component,
			},
		}),
		...params.config,
	};
}

/**
 * ## [Update User Extensions](https://dev.twitch.tv/docs/api/reference/#update-user-extensions)
 * Updates an installed extension’s information. You can update the extension’s activation state, ID, and version number. The user ID in the access token identifies the broadcaster whose extensions you’re updating.

 * NOTE: If you try to activate an extension under multiple extension types, the last write wins (and there is no guarantee of write order).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the active extensions.
 * 400 Bad Request|The JSON payload is malformed.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **user:edit:broadcast** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 404 Not Found|An extension with the specified `id` and `version` values was not found.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}