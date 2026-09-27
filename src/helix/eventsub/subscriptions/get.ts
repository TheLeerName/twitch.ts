import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - If you use [Webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events) or [Conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) to receive events, the request must specify an app access token. The request will fail if you use a user access token.
	 *   - If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

/** Use the `status`, `type`, `user_id`, `subscription_id`, and `conduit_id` query parameters to filter the list of subscriptions that are returned. The filters are mutually exclusive; the request fails if you specify more than one filter. */
export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/**
	 * Filter subscriptions by its status. Possible values are:
	 * - enabled — The subscription is enabled.
	 * - webhook_callback_verification_pending — The subscription is pending verification of the specified callback URL.
	 * - webhook_callback_verification_failed — The specified callback URL failed verification.
	 * - notification_failures_exceeded — The notification delivery failure rate was too high.
	 * - authorization_revoked — The authorization was revoked for one or more users specified in the **Condition** object.
	 * - moderator_removed — The moderator that authorized the subscription is no longer one of the broadcaster's moderators.
	 * - user_removed — One of the users specified in the **Condition** object was removed.
	 * - chat_user_banned - The user specified in the **Condition** object was banned from the broadcaster's chat.
	 * - version_removed — The subscription to subscription type and version is no longer supported.
	 * - beta_maintenance — The subscription to the beta subscription type was removed due to maintenance.
	 * - websocket_disconnected — The client closed the connection.
	 * - websocket_failed_ping_pong — The client failed to respond to a ping message.
	 * - websocket_received_inbound_traffic — The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
	 * - websocket_connection_unused — The client failed to subscribe to events within the required time.
	 * - websocket_internal_error — The Twitch WebSocket server experienced an unexpected error.
	 * - websocket_network_timeout — The Twitch WebSocket server timed out writing the message to the client.
	 * - websocket_network_error — The Twitch WebSocket server experienced a network error writing the message to the client.
	 * - websocket_failed_to_reconnect - The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
	 * - conduit_deleted - The conduit associated with the subscription was deleted.
	 */
	status?:
	| "enabled"
	| "webhook_callback_verification_pending"
	| "webhook_callback_verification_failed"
	| "notification_failures_exceeded"
	| "authorization_revoked"
	| "moderator_removed"
	| "user_removed"
	| "chat_user_banned"
	| "version_removed"
	| "beta_maintenance"
	| "websocket_disconnected"
	| "websocket_failed_ping_pong"
	| "websocket_received_inbound_traffic"
	| "websocket_connection_unused"
	| "websocket_internal_error"
	| "websocket_network_timeout"
	| "websocket_network_error"
	| "websocket_failed_to_reconnect"
	| "conduit_deleted";
	/** Filter subscriptions by subscription type. For a list of subscription types, see [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). */
	type?: string;
	/** Filter subscriptions by user ID. The response contains subscriptions where this ID matches a user ID that you specified in the **Condition** object when you {@link Helix.GetEventSubSubscriptions | created the subscription}. */
	user_id?: string;
	/** Returns an array with the subscription matching the ID (as long as it is owned by the client making the request), or an empty array if there is no matching subscription. */
	subscription_id?: string;
	/** Filter subscriptions by [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events) ID. */
	conduit_id?: string;
	/** The cursor used to get the next page of results. The `pagination` object in the response contains the cursor’s value. */
	after?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of subscriptions. The list is ordered by the oldest subscription first. The list is empty if the client hasn't created subscriptions or there are no subscriptions that match the specified filter criteria. */
	data: {
		/** An ID that identifies the subscription. */
		id: string;
		/**
		 * The subscription's status. The subscriber receives events only for **enabled** subscriptions. Possible values are:
		 * - enabled — The subscription is enabled.
		 * - webhook_callback_verification_pending — The subscription is pending verification of the specified callback URL.
		 * - webhook_callback_verification_failed — The specified callback URL failed verification.
		 * - notification_failures_exceeded — The notification delivery failure rate was too high.
		 * - authorization_revoked — The authorization was revoked for one or more users specified in the **Condition** object.
		 * - moderator_removed — The moderator that authorized the subscription is no longer one of the broadcaster's moderators.
		 * - user_removed — One of the users specified in the **Condition** object was removed.
		 * - version_removed — The subscription to subscription type and version is no longer supported.
		 * - beta_maintenance — The subscription to the beta subscription type was removed due to maintenance.
		 * - websocket_disconnected — The client closed the connection.
		 * - websocket_failed_ping_pong — The client failed to respond to a ping message.
		 * - websocket_received_inbound_traffic — The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
		 * - websocket_connection_unused — The client failed to subscribe to events within the required time.
		 * - websocket_internal_error — The Twitch WebSocket server experienced an unexpected error.
		 * - websocket_network_timeout — The Twitch WebSocket server timed out writing the message to the client.
		 * - websocket_network_error — The Twitch WebSocket server experienced a network error writing the message to the client.
		 */
		status:
		| "enabled"
		| "webhook_callback_verification_pending"
		| "webhook_callback_verification_failed"
		| "notification_failures_exceeded"
		| "authorization_revoked"
		| "moderator_removed"
		| "user_removed"
		| "version_removed"
		| "beta_maintenance"
		| "websocket_disconnected"
		| "websocket_failed_ping_pong"
		| "websocket_received_inbound_traffic"
		| "websocket_connection_unused"
		| "websocket_internal_error"
		| "websocket_network_timeout"
		| "websocket_network_error";
		/** The subscription's type. See [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). */
		type: string;
		/** The version number that identifies this definition of the subscription's data. */
		version: string;
		/** The subscription's parameter values. This is a string-encoded JSON object whose contents are determined by the subscription type. */
		condition: object;
		/** The date and time (in RFC3339 format) of when the subscription was created. */
		created_at: string;
		/** The transport details used to send the notifications. */
		transport: {
			/**
			 * The transport method. Possible values are:
			 * - webhook
			 * - websocket
			 */
			method: "webhook" | "websocket";
			/** The callback URL where the notifications are sent. Included only if `method` is set to **webhook**. */
			callback?: string;
			/** An ID that identifies the WebSocket that notifications are sent to. Included only if `method` is set to **websocket**. */
			session_id?: string;
			/** The UTC date and time that the WebSocket connection was established. Included only if `method` is set to **websocket**. */
			connected_at?: string;
			/** The UTC date and time that the WebSocket connection was lost. Included only if `method` is set to **websocket**. */
			disconnected_at?: string;
		};
		/** **Integer**. The amount that the subscription counts against your limit. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
		cost: number;
	}[];
	/** **Integer**. The total number of subscriptions that you've created. */
	total: number;
	/** **Integer**. The sum of all of your subscription costs. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
	total_cost: number;
	/** **Integer**. The maximum total cost that you're allowed to incur for all subscriptions that you create. */
	max_total_cost: number;
	/** An object that contains the cursor used to get the next page of subscriptions. The object is empty if there are no more pages to get. The number of subscriptions returned per page is undertermined. */
	pagination?: {
		/** The cursor value that you set the `after` query parameter to. */
		cursor?: string;
	};
}

/**
 * ## [Get EventSub Subscriptions](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions)
 * Gets a list of EventSub subscriptions that the client in the access token created.

 * **NOTE**: Use the `status`, `type`, `user_id`, `subscription_id`, and `conduit_id` query parameters to filter the list of subscriptions that are returned. The filters are mutually exclusive; the request fails if you specify more than one filter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the subscriptions.
 * 400 Bad Request|The request may specify only one filter query parameter. For example, either `type` or `status` or `user_id`.
 * ㅤ|The value in the `type` query parameter is not valid.
 * ㅤ|The value in the `status` query parameter is not valid.
 * ㅤ|The cursor specified in the `after` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	const url = new Main.URL(params.apiPath ?? "eventsub/subscriptions", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		status: params.status,
		type: params.type,
		user_id: params.user_id,
		subscription_id: params.subscription_id,
		conduit_id: params.conduit_id,
		after: params.after,
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