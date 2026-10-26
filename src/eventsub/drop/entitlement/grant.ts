import * as Main from "../../..";

/**
 * ## [drop.entitlement.grant](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant)
 * Sends a notification when an entitlement for a Drop is granted to a user.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * **NOTE**: Payload structure is different from other subscription types. Events bound for these subscriptions are batched. Developers can expect to receive roughly 0-5 HTTP requests per second. HTTP request bodies will not exceed 250KB.

 * ### Authorization
 * App access token required. The client ID associated with the access token must be owned by a user who is part of the specified organization.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "drop.entitlement.grant";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
	/** Needs to be `"true"` for this subscription type. */
	is_batching_enabled: "true";
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "drop.entitlement.grant", version: "1", condition, transport, is_batching_enabled: "true"};
}

export interface Condition {
	/** The organization ID of the organization that owns the game on the developer portal. */
	organization_id: string;
	/** The category (or game) ID of the game for which entitlement notifications will be received. */
	category_id?: string;
	/** The campaign ID for a specific campaign for which entitlement notifications will be received. */
	campaign_id?: string;
}

/**
 * ## [drop.entitlement.grant](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant)
 * Sends a notification when an entitlement for a Drop is granted to a user.

 * **NOTE**: This subscription type is only supported by webhooks and conduits, and cannot be used with WebSockets.

 * **NOTE**: Payload structure is different from other subscription types. Events bound for these subscriptions are batched. Developers can expect to receive roughly 0-5 HTTP requests per second. HTTP request bodies will not exceed 250KB.

 * ### Authorization
 * App access token required. The client ID associated with the access token must be owned by a user who is part of the specified organization.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "drop.entitlement.grant" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** Individual event ID, as assigned by EventSub. Use this for de-duplicating messages. */
	id: string;
	data: Entitlement[];
}

export interface Entitlement {
	/** The ID of the organization that owns the game that has Drops enabled. */
	organization_id: string;
	/** Twitch category ID of the game that was being played when this benefit was entitled. */
	category_id: string;
	/** The category name. */
	category_name: string;
	/** The campaign this entitlement is associated with. */
	campaign_id: string;
	/** Twitch user ID of the user who was granted the entitlement. */
	user_id: string;
	/** The user display name of the user who was granted the entitlement. */
	user_name: string;
	/** The user login of the user who was granted the entitlement. */
	user_login: string;
	/** Unique identifier of the entitlement. Use this to de-duplicate entitlements. */
	entitlement_id: string;
	/** Identifier of the Benefit. */
	benefit_id: string;
	/** UTC timestamp in ISO format when this entitlement was granted on Twitch. */
	created_at: string;
}