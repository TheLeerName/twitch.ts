import * as AutomodMessageHold from "./automod/message/hold";
import * as AutomodMessageUpdate from "./automod/message/update";
import * as AutomodTermsUpdate from "./automod/terms/update";
import * as ChannelBitsUse from "./channel/bits/use";
import * as ChannelUpdate from "./channel/update";
import * as ChannelFollow from "./channel/follow";

import * as ChannelChatMessage from "./channel/chat/message";

export type Transport = TransportWebHook | TransportWebSocket | TransportConduit;
export interface TransportWebHook {
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
export namespace TransportWebHook {
	export function makeFromParams(callback: string, secret: string): TransportWebHook {
		return {method: "webhook", callback, secret};
	}
	export function makeFromObject(params: {callback: string, secret: string}): TransportWebHook {
		return {method: "webhook", ...params};
	}
}

export interface TransportWebSocket {
	/** The transport method. */
	method: "websocket";
	/** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message). */
	session_id: string;
}
export namespace TransportWebSocket {
	export function makeFromParams(session_id: string): TransportWebSocket {
		return {method: "websocket", session_id};
	}
	export function makeFromObject(params: {session_id: string}): TransportWebSocket {
		return {method: "websocket", ...params};
	}
}

export interface TransportConduit {
	/** The transport method. */
	method: "conduit";
	/** An ID that identifies the conduit to send notifications to. */
	conduit_id: string;
}
export namespace TransportConduit {
	export function makeFromParams(conduit_id: string): TransportConduit {
		return {method: "conduit", conduit_id};
	}
	export function makeFromObject(params: {conduit_id: string}): TransportConduit {
		return {method: "conduit", ...params};
	}
}

export type RequestBody = AutomodMessageHold.RequestBody | AutomodMessageUpdate.RequestBody | AutomodTermsUpdate.RequestBody | ChannelBitsUse.RequestBody | ChannelUpdate.RequestBody | ChannelFollow.RequestBody | ChannelChatMessage.RequestBody;
export interface _RequestBody {
	/** The subscription type name. */
	type: string;
	/** The subscription type version. */
	version: string;
	/** Subscription-specific parameters. */
	condition: object;
	/** Transport-specific parameters. */
	transport: object;
}

/** An object that contains information about the connection. */
export interface SessionConnected {
	/** An ID that uniquely identifies this WebSocket connection. Use this ID to set the `session_id` field in all subscription requests. */
	id: string;
	/** The connection’s status. */
	status: "connected";
	/** **Integer**. Number of seconds that you have to subscribe to an event after receiving the welcome message. If you don’t subscribe to an event within this window, the socket is disconnected. */
	keepalive_timeout_seconds: number;
	/** The URL to reconnect to if you get a {@link MessageReconnect | Reconnect message}. Is set to **null**. */
	reconnect_url: null;
	/** The UTC date and time that the connection was created. */
	connected_at: string;
}
/** An object that contains information about the connection. */
export interface SessionReconnecting {
	/** An ID that uniquely identifies this WebSocket connection. */
	id: string;
	/** The connection’s status. */
	status: "reconnecting";
	/** Is set to **null**. */
	keepalive_timeout_seconds: null;
	/** The URL to reconnect to. Use this URL as is; do not modify it. The connection automatically includes the subscriptions from the old connection. */
	reconnect_url: string;
	/** The UTC date and time when the connection was created. */
	connected_at: string;
}

export interface Metadata<Type extends string = string> {
	/** An ID that uniquely identifies the message. Twitch sends messages at least once, but if Twitch is unsure of whether you received a notification, it’ll resend the message. This means you may receive a notification twice. If Twitch resends the message, the message ID will be the same. */
	message_id: string;
	/** The type of message. */
	message_type: Type;
	/** The UTC date and time that the message was sent. */
	message_timestamp: string;
}
export interface MetadataWithSubscription<Type extends string = string, _PayloadSubscription extends PayloadSubscription = PayloadSubscription> extends Metadata<Type> {
	/** The type of event sent in the message. */
	subscription_type: _PayloadSubscription["type"];
	/** The version number of the subscription type’s definition. This is the same value specified in the subscription request. */
	subscription_version: _PayloadSubscription["version"];
}

export interface Payload<_PayloadSubscription extends PayloadSubscription = PayloadSubscription, Event = object> {
	subscription: _PayloadSubscription;
	event: Event;
}
export interface PayloadSubscription<_RequestBody extends RequestBody = RequestBody> {
	/** The Subscription ID of the Subscription. */
	id: string;
	/** The notification’s subscription type. */
	type: _RequestBody["type"];
	/** The version of the subscription. */
	version: _RequestBody["version"];
	/** The status of the subscription. */
	status: "enabled";
	/** **Integer**. How much the subscription counts against your limit. See [Subscription Limits](https://dev.twitch.tv/docs/eventsub/manage-subscriptions#subscription-limits) for more information. */
	cost: number;
	/** Subscription-specific parameters. */
	condition: _RequestBody["condition"];
	/** An object that contains information about the transport used for notifications. */
	transport: TransportWebSocket;
	/** The time the notification was created. */
	created_at: string;
}

export type Message = MessageWelcome | MessageSessionKeepalive | MessageNotification | MessageSessionReconnect | MessageRevocation;
/** Defines the first message that the EventSub WebSocket server sends after your client connects to the server. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message) */
export interface MessageWelcome {
	/** An object that identifies the message. */
	metadata: Metadata<"session_welcome">;
	/** An object that contains the message. */
	payload: {
		/** An object that contains information about the connection. */
		session: SessionConnected;
	};
}
export function isMessageWelcome(obj: Message): obj is MessageWelcome {
	return obj != null && obj.metadata != null && obj.metadata.message_type === "session_welcome";
}

/** Defines the message that the EventSub WebSocket server sends your client to indicate that the WebSocket connection is healthy. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#keepalive-message) */
export interface MessageSessionKeepalive {
	/** An object that identifies the message. */
	metadata: Metadata<"session_keepalive">;
	/** An empty object. */
	payload: {};
}
export function isMessageSessionKeepalive(obj: Message): obj is MessageSessionKeepalive {
	return obj != null && obj.metadata != null && obj.metadata.message_type === "session_keepalive";
}

/** Defines a message that the EventSub WebSocket server sends your client when an event that you subscribe to occurs. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#notification-message) */
export type MessageNotification =
| AutomodMessageHold.MessageNotification
| AutomodMessageUpdate.MessageNotification
| AutomodTermsUpdate.MessageNotification
| ChannelBitsUse.MessageNotification
| ChannelUpdate.MessageNotification
| ChannelFollow.MessageNotification
| ChannelChatMessage.MessageNotification;
export function isMessageNotification(obj: Message): obj is MessageNotification {
	return obj != null && obj.metadata != null && obj.metadata.message_type === "notification";
}

/** Defines the message that the EventSub WebSocket server sends if the server must drop the connection. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#reconnect-message) */
export interface MessageSessionReconnect {
	/** An object that identifies the message. */
	metadata: Metadata<"session_reconnect">;
	/** An object that contains the message. */
	payload: {
		/** An object that contains information about the connection. */
		session: SessionReconnecting;
	};
}
export function isMessageSessionReconnect(obj: Message): obj is MessageSessionReconnect {
	return obj != null && obj.metadata != null && obj.metadata.message_type === "session_reconnect";
}

/** Defines the message that the EventSub WebSocket server sends if the user no longer exists or they revoked the authorization token that the subscription relied on. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#revocation-message) */
export interface MessageRevocation<_PayloadSubscription extends PayloadSubscription = PayloadSubscription> {
	metadata: MetadataWithSubscription<"revocation", _PayloadSubscription>;
	payload: {
		subscription: Omit<_PayloadSubscription, "status"> & {
			/**
			 * The subscription's status. The following are the possible values:
			 * Value|Description
			 * -|-
			 * `authorization_revoked`|The user in the condition object revoked the authorization that let you get events on their behalf.
			 * `user_removed`|The user in the condition object is no longer a Twitch user.
			 * `version_removed`|The subscribed to subscription type and version is no longer supported.
			 */
			status: "authorization_revoked" | "user_removed" | "version_removed";
		};
	};
}
export function isMessageRevocation(obj: Message): obj is MessageRevocation {
	return obj != null && obj.metadata != null && obj.metadata.message_type === "revocation";
}

export {
	default as WebSocket,
	Session as WebSocketSession,
	Events as WebSocketEvents,
} from "./websocket";

export {
	AutomodMessageHold,
	AutomodMessageUpdate,
	AutomodTermsUpdate,
	ChannelBitsUse,
	ChannelUpdate,
	ChannelFollow,

	ChannelChatMessage,
};