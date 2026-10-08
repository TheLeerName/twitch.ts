import * as Main from "../../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/** Conduit ID. */
	conduit_id: string;
	/** Status to filter by. */
	status?: string;
	/** The cursor used to get the next page of results. The pagination object in the response contains the cursor’s value. */
	after?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** List of information about a conduit's shards. */
	data: {
		/** Shard ID. */
		id: string;
		/**
		 * The shard status. The subscriber receives events only for enabled shards. Possible values are:
		 * - enabled — The shard is enabled.
		 * - webhook_callback_verification_pending — The shard is pending verification of the specified callback URL.
		 * - webhook_callback_verification_failed — The specified callback URL failed verification.
		 * - notification_failures_exceeded — The notification delivery failure rate was too high.
		 * - websocket_disconnected — The client closed the connection.
		 * - websocket_failed_ping_pong — The client failed to respond to a ping message.
		 * - websocket_received_inbound_traffic — The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
		 * - websocket_internal_error — The Twitch WebSocket server experienced an unexpected error.
		 * - websocket_network_timeout — The Twitch WebSocket server timed out writing the message to the client.
		 * - websocket_network_error — The Twitch WebSocket server experienced a network error writing the message to the client.
		 * - websocket_failed_to_reconnect - The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
		 */
		status:
		| "enabled"
		| "webhook_callback_verification_pending"
		| "webhook_callback_verification_failed"
		| "notification_failures_exceeded"
		| "websocket_disconnected"
		| "websocket_failed_ping_pong"
		| "websocket_received_inbound_traffic"
		| "websocket_internal_error"
		| "websocket_network_timeout"
		| "websocket_network_error"
		| "websocket_failed_to_reconnect";
		/** The transport details used to send the notifications. */
		transport: {
			/**
			 * The transport method. Possible values are:
			 * - webhook
			 * - websocket
			 */
			method: "webhook" | "websocket";
			/** The callback URL where the notifications are sent. Included only if method is set to webhook. */
			callback?: string;
			/** An ID that identifies the WebSocket that notifications are sent to. Included only if method is set to websocket. */
			session_id?: string;
			/** The UTC date and time that the WebSocket connection was established. Included only if method is set to websocket. */
			connected_at?: string;
			/** The UTC date and time that the WebSocket connection was lost. Included only if method is set to websocket. */
			disconnected_at?: string;
		};
	}[];
	/** Contains information used to page through a list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "eventsub/conduits/shards",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			conduit_id: params.conduit_id,
			status: params.status,
			after: params.after,
		},
		...params.config,
	};
}

/**
 * ## [Get Conduit Shards](https://dev.twitch.tv/docs/api/reference/#get-conduit-shards)
 * Gets a lists of all shards for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 200 OK|Successfully retrieved shards.
 * 400 Bad Request|The id query parameter is required.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 404 Not Found|Conduit not found.
 * ㅤ|Conduit’s owner must match the client ID in the access token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}