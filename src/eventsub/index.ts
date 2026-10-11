export type Transport = Transport.WebHook | Transport.WebSocket;
export namespace Transport {
	export interface WebHook {
		/** The transport method. */
		method: "webhook";
		/**
		 * The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. See [Processing an event](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#processing-an-event).
		 * 
		 * **NOTE**: Redirects are not followed.
		 */
		callback: string;
		/** The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. For information about how the secret is used, see [Verifying the event message](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#verifying-the-event-message). */
		secret: string;
	}
	export namespace WebHook {
		export function makeFromParams(callback: string, secret: string): WebHook {
			return {method: "webhook", callback, secret};
		}
		export function makeFromObject(params: {callback: string, secret: string}): WebHook {
			return {method: "webhook", ...params};
		}
	}

	export interface WebSocket {
		/** The transport method. */
		method: "websocket";
		/** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message). */
		session_id: string;
	}
	export namespace WebSocket {
		export function makeFromParams(session_id: string): WebSocket {
			return {method: "websocket", session_id};
		}
		export function makeFromObject(params: {session_id: string}): WebSocket {
			return {method: "websocket", ...params};
		}
	}
}

export namespace RequestBody {
	export interface Subscription {
		/** The subscription type name. */
		type: string;
		/** The subscription type version. */
		version: string;
		/** Subscription-specific parameters. */
		condition: object;
		/** Transport-specific parameters. */
		transport: object;
	}
}

export namespace ResponseBody {
	export interface Subscription<RequestBody extends RequestBody.Subscription = RequestBody.Subscription> {
		/** The Subscription ID of the Subscription. */
		id: string;
		/** The notification’s subscription type. */
		type: RequestBody["type"];
		/** The version of the subscription. */
		version: RequestBody["version"];
		/** The status of the subscription. */
		status: string;
		/** **Integer**. How much the subscription counts against your limit. See [Subscription Limits](https://dev.twitch.tv/docs/eventsub/manage-subscriptions#subscription-limits) for more information. */
		cost: number;
		/** Subscription-specific parameters. */
		condition: RequestBody["condition"];
		/** The time the notification was created. */
		created_at: string;
	}
}

export * as AutomodMessageHold from "./automod/message/hold";
export * as AutomodMessageUpdate from "./automod/message/update";
