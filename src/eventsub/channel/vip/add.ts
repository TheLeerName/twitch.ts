import * as Main from "../../..";

/**
 * ## [channel.vip.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd)
 * Sends a notification when a VIP is added to the channel.

 * ### Authorization
 * Must have `channel:read:vips` or `channel:manage:vips` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.vip.add";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.vip.add", version: "1", condition, transport};
}

export interface Condition {
	/** The User ID of the broadcaster (channel) Maximum: 1 */
	broadcaster_user_id: string;
}

/**
 * ## [channel.vip.add](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd)
 * Sends a notification when a VIP is added to the channel.

 * ### Authorization
 * Must have `channel:read:vips` or `channel:manage:vips` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.vip.add" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the user who was added as a VIP. */
	user_id: string;
	/** The login of the user who was added as a VIP. */
	user_login: string;
	/** The display name of the user who was added as a VIP. */
	user_name: string;
	/** The ID of the broadcaster. */
	broadcaster_user_id: string;
	/** The login of the broadcaster. */
	broadcaster_user_login: string;
	/** The display name of the broadcaster. */
	broadcaster_user_name: string;
}