import * as Main from "../..";

/**
 * ## [channel.raid](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid)
 * Sends a notification when a broadcaster raids another broadcaster’s channel.

 * ### Authorization
 * No authorization required.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.raid";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.raid", version: "1", condition, transport};
}

export type Condition = ConditionFromBroadcaster | ConditionToBroadcaster;
export interface _Condition {
	/** The broadcaster user ID that created the channel raid you want to get notifications for. Use this parameter if you want to know when a specific broadcaster raids another broadcaster. The channel raid condition must include either from_broadcaster_user_id or to_broadcaster_user_id. */
	from_broadcaster_user_id?: string;
	/** The broadcaster user ID that received the channel raid you want to get notifications for. Use this parameter if you want to know when a specific broadcaster is raided by another broadcaster. The channel raid condition must include either from_broadcaster_user_id or to_broadcaster_user_id. */
	to_broadcaster_user_id?: string;
}
export interface ConditionFromBroadcaster {
	/** The broadcaster user ID that created the channel raid you want to get notifications for. Use this parameter if you want to know when a specific broadcaster raids another broadcaster. */
	from_broadcaster_user_id: string;
}
export interface ConditionToBroadcaster {
	/** The broadcaster user ID that received the channel raid you want to get notifications for. Use this parameter if you want to know when a specific broadcaster is raided by another broadcaster. */
	to_broadcaster_user_id: string;
}

/**
 * ## [channel.raid](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid)
 * Sends a notification when a broadcaster raids another broadcaster’s channel.

 * ### Authorization
 * No authorization required.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.raid" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The broadcaster ID that created the raid. */
	from_broadcaster_user_id: string;
	/** The broadcaster login that created the raid. */
	from_broadcaster_user_login: string;
	/** The broadcaster display name that created the raid. */
	from_broadcaster_user_name: string;
	/** The broadcaster ID that received the raid. */
	to_broadcaster_user_id: string;
	/** The broadcaster login that received the raid. */
	to_broadcaster_user_login: string;
	/** The broadcaster display name that received the raid. */
	to_broadcaster_user_name: string;
	/** **Integer**. The number of viewers in the raid. */
	viewers: number;
}