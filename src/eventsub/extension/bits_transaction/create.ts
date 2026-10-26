import * as Main from "../../..";

/**
 * ## [extension.bits_transaction.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate)
 * Sends a notification when a new transaction is created for a Twitch Extension.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * ### Authorization
 * The OAuth token client ID must match the Extension client ID.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "extension.bits_transaction.create";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "extension.bits_transaction.create", version: "1", condition, transport};
}

export interface Condition {
	/** The client ID of the extension. */
	extension_client_id: string;
}

/**
 * ## [extension.bits_transaction.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate)
 * Sends a notification when a new transaction is created for a Twitch Extension.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * ### Authorization
 * The OAuth token client ID must match the Extension client ID.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "extension.bits_transaction.create" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** Client ID of the extension. */
	extension_client_id: string;
	/** Transaction ID. */
	id: string;
	/** The transaction’s broadcaster ID. */
	broadcaster_user_id: string;
	/** The transaction’s broadcaster login. */
	broadcaster_user_login: string;
	/** The transaction’s broadcaster display name. */
	broadcaster_user_name: string;
	/** The transaction’s user ID. */
	user_id: string;
	/** The transaction’s user login. */
	user_login: string;
	/** The transaction’s user display name. */
	user_name: string;
	/** Additional extension product information. */
	product: Product;
}

/** Additional information about a product acquired via a Twitch Extension Bits transaction. */
export interface Product {
	/** Product name. */
	name: string;
	/** **Integer**. Bits involved in the transaction. */
	bits: number;
	/** Unique identifier for the product acquired. */
	sku: string;
	/** Flag indicating if the product is in development. If `in_development` is `true`, bits will be 0. */
	in_development: boolean;
}