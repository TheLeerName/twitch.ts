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

export interface RequestBody {
	/** Conduit ID. */
	conduit_id: string;
	/** List of shards to update. */
	shards: {
		/** Shard ID. */
		id: string;
		/** The transport details that you want Twitch to use when sending you notifications. */
		transport: {
			/**
			 * The transport method. Possible values are: 
			 * - webhook
			 * - websocket
			 */
			method?: "webhook" | "websocket";
			/** The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. See Processing an event. Specify this field only if method is set to webhook. **NOTE:** Redirects are not followed. */
			callback?: string;
			/** The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. For information about how the secret is used, see Verifying the event message. Specify this field only if method is set to webhook. */
			secret?: string;
			/** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the Welcome message. Specify this field only if method is set to websocket. */
			session_id?: string;
		};
	}[];
}

export type RequestParameters = Authentication & Helix.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** List of successful shard updates. */
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
		 * - websocket_failed_to_reconnect — The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
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
	/** List of unsuccessful updates. */
	errors: {
		/** Shard ID. */
		id: string;
		/**
		 * The error that occurred while updating the shard. Possible errors: 
		 * - The length of the string in the secret field is not valid.
		 * - The URL in the transport's callback field is not valid. The URL must use the HTTPS protocol and the 443 port number.
		 * - The value specified in the method field is not valid.
		 * - The callback field is required if you specify the webhook transport method.
		 * - The session_id field is required if you specify the WebSocket transport method.
		 * - The websocket session is not connected.
		 * - The shard id is outside of the conduit's range.
		 */
		message: string;
		/** Error codes used to represent a specific error condition while attempting to update shards. */
		code: string;
	}[];
}

/**
 * ## [Update Conduit Shards](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
 * Updates shard(s) for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/). You can update up to 100 shards in a single request.

 * **NOTE:** Shard IDs are indexed starting at 0, so a conduit with a `shard_count` of 5 will have shards with IDs 0 through 4.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 202 Accepted|Successfully updated shards.
 * 400 Bad Request|The `conduit_id` query parameter is required.
 * 401 Unauthenticated|Authorization header requires using an App Access Token for this request.
 * 404 Not Found|The specified `conduit_id` does not exist.
 * ㅤ|Conduit's owner must match the Client ID in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "eventsub/conduits/shards", Main.Options.apiHelixPath);
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			conduit_id: params.conduit_id,
			shards: params.shards
		}),
	});
}