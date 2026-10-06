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
	 *   - If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token. If the subscription type requires user authorization, the user must have granted your app (client ID) permissions to receive those events before you subscribe to them. For example, to subscribe to [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe) events, your app must get a user access token that includes the `channel:read:subscriptions` scope, which adds the required permission to your app access token’s client ID.
	 *   - If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. If the subscription type requires user authorization, the token must include the required scope. However, if the subscription type doesn’t include user authorization, the token may include any scopes or no scopes.
	 *   - If you use [Conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) to receive events, the request must specify an app access token. The request will fail if you use a user access token.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestBody {
	/** The type of subscription to create. For a list of subscriptions that you can create, see [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). Set this field to the value in the **Name** column of the Subscription Types table. */
	type: string;
	/** The version number that identifies the definition of the subscription type that you want the response to use. */
	version: string;
	/** A JSON object that contains the parameter values that are specific to the specified subscription type. For the object’s required and optional fields, see the subscription type’s documentation. */
	condition: object;
	/** The transport details that you want Twitch to use when sending you notifications. */
	transport: {
		/**
		 * The transport method. Possible values are:
		 * - webhook
		 * - websocket
		 * - conduit
		 */
		method: "webhook" | "websocket" | "conduit";
		/** The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. See [Processing an event](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#processing-an-event). Specify this field only if `method` is set to **webhook**.**NOTE**: Redirects are not followed. */
		callback?: string;
		/** The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. For information about how the secret is used, see [Verifying the event message](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#verifying-the-event-message). Specify this field only if `method` is set to **webhook**. */
		secret?: string;
		/** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the Welcome message. Specify this field only if `method` is set to **websocket**. */
		session_id?: string;
		/** An ID that identifies the conduit to send notifications to. When you create a conduit, the server returns the conduit ID. Specify this field only if `method` is set to **conduit**. */
		conduit_id?: string;
	};
}

export type RequestParameters = Authentication & Main.RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the single subscription that you created. */
	data: [{
		/** An ID that identifies the subscription. */
		id: string;
		/**
		 * The subscription’s status. The subscriber receives events only for enabled subscriptions. Possible values are:
		 * - enabled — The subscription is enabled.
		 * - webhook_callback_verification_pending — The subscription is pending verification of the specified callback URL (see [Responding to a challenge request](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#responding-to-a-challenge-request)).
		 */
		status: "enabled" | "webhook_callback_verification_pending";
		/** The subscription’s type. See [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). */
		type: string;
		/** The version number that identifies this definition of the subscription’s data. */
		version: string;
		/** The subscription’s parameter values. This is a string-encoded JSON object whose contents are determined by the subscription type. */
		condition: object;
		/** The date and time (in RFC3339 format) of when the subscription was created. */
		created_at: string;
		/** The transport details used to send the notifications. */
		transport: {
			/**
			 * The transport method. Possible values are:
			 * - webhook
			 * - websocket
			 * - conduit
			 */
			method: "webhook" | "websocket" | "conduit";
			/** The callback URL where the notifications are sent. Included only if `method` is set to **webhook**. */
			callback?: string;
			/** An ID that identifies the WebSocket that notifications are sent to. Included only if `method` is set to **websocket**. */
			session_id?: string;
			/** The UTC date and time that the WebSocket connection was established. Included only if `method` is set to **websocket**. */
			connected_at?: string;
			/** An ID that identifies the conduit to send notifications to. Included only if `method` is set to **conduit**. */
			conduit_id?: string;
		};
		/** **Integer**. The amount that the subscription counts against your limit. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
		cost: number;
	}];
	/** **Integer**. The total number of subscriptions you’ve created. */
	total: number;
	/** **Integer**. The sum of all of your subscription costs. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
	total_cost: number;
	/** **Integer**. The maximum total cost that you’re allowed to incur for all subscriptions you create. */
	max_total_cost: number;
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "eventsub/subscriptions", Main.Options.apiHelixPath);
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
			"content-type": "application/json",
		},
		signal: params.signal,
		body: JSON.stringify({
			type: params.type,
			version: params.version,
			condition: params.condition,
			transport: params.transport,
		}),
	};
}

/**
 * ## [Create EventSub Subscription](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
 * Creates an EventSub subscription.

 * ### Response Codes
 * Code|Meaning
 * -|-
 * 202 Accepted|Successfully accepted the subscription request.
 * 400 Bad Request|The `condition` field is required.
 * ㅤ|The user specified in the `condition` object does not exist.
 * ㅤ|The `condition` object is missing one or more required fields.
 * ㅤ|The combination of values in the `version` and `type` fields is not valid.
 * ㅤ|The length of the string in the `secret` field is not valid.
 * ㅤ|The URL in the transport's `callback` field is not valid. The URL must use the HTTPS protocol and the 443 port number.
 * ㅤ|The value specified in the `method` field is not valid.
 * ㅤ|The `callback` field is required if you specify the webhook transport method.
 * ㅤ|The `session_id` field is required if you specify the WebSocket transport method.
 * ㅤ|The combination of subscription type and version is not valid.
 * ㅤ|The `conduit_id` field is required if you specify the Conduit transport method.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token if the transport method is webhook.
 * ㅤ|The Authorization header is required and must specify a user access token if the transport method is WebSocket.
 * ㅤ|The access token is not valid.
 * ㅤ|The ID in the Client-Id header must match the client ID in the access token.
 * 403 Forbidden|The access token is missing the required scopes.
 * 409 Conflict|A subscription already exists for the specified event type and `condition` combination. The `id` value in the error response represents the existing EventSub subscription.
 * 410 Gone|The subscription type and version combination has been removed and can no longer be subscribed to.
 * 429 Too Many Requests|The request exceeds the number of subscriptions that you may create with the same combination of `type` and `condition` values.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}