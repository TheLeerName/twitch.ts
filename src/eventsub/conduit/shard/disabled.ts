import * as Main from "../../..";

/**
 * ## [conduit.shard.disabled](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled)
 * Sends a notification when EventSub disables a shard due to the status of the underlying transport changing.

 * ### Authorization
 * App access token where the client ID matches the client ID in the condition. If `conduit_id` is specified, the client must be the owner of the conduit.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "conduit.shard.disabled";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "conduit.shard.disabled", version: "1", condition, transport};
}

export interface Condition {
	/** Your application’s client id. The provided client_id must match the client ID in the application access token. */
	client_id: string;
	/** The conduit ID to receive events for. If omitted, events for all of this client’s conduits are sent. */
	conduit_id?: string;
}

/**
 * ## [conduit.shard.disabled](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled)
 * Sends a notification when EventSub disables a shard due to the status of the underlying transport changing.

 * ### Authorization
 * App access token where the client ID matches the client ID in the condition. If `conduit_id` is specified, the client must be the owner of the conduit.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "conduit.shard.disabled" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the conduit. */
	conduit_id: string;
	/** The ID of the disabled shard. */
	shard_id: string;
	/** The new status of the transport. */
	status: string;
	/** The disabled transport. */
	transport: PayloadEventTransportWebSocket | PayloadEventTransportWebHook;
}

export interface PayloadEventTransportWebSocket {
	method: "websocket";
	callback: null;
	/** WebSocket session ID. */
	session_id: string;
	/** Time that the WebSocket session connected. */
	connected_at: string;
	/** Time that the WebSocket session disconnected. */
	disconnected_at: string;
}
export interface PayloadEventTransportWebHook {
	method: "webhook";
	/** Webhook callback URL. */
	callback: string;
	session_id: null;
	connected_at: null;
	disconnected_at: null;
}