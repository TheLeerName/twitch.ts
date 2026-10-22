import * as Main from "../../..";

/**
 * ## [channel.ad_break.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin)
 * Sends a notification when a user runs a midroll commercial break, either manually or automatically via ads manager.

 * ### Authorization
 * Must have `channel:read:ads` scope.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "channel.ad_break.begin";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "channel.ad_break.begin", version: "1", condition, transport};
}

export interface Condition {
	/** The ID of the broadcaster that you want to get Channel Ad Break begin notifications for. */
	broadcaster_user_id: string;
}

/**
 * ## [channel.ad_break.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin)
 * Sends a notification when a user runs a midroll commercial break, either manually or automatically via ads manager.

 * ### Authorization
 * Must have `channel:read:ads` scope.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "channel.ad_break.begin" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** **Integer**. Length in seconds of the mid-roll ad break requested */
	duration_seconds: number;
	/** The UTC timestamp of when the ad break began, in RFC3339 format. Note that there is potential delay between this event, when the streamer requested the ad break, and when the viewers will see ads. */
	started_at: string;
	/** Indicates if the ad was automatically scheduled via Ads Manager */
	is_automatic: boolean;
	/** The broadcaster’s user ID for the channel the ad was run on. */
	broadcaster_user_id: string;
	/** The broadcaster’s user login for the channel the ad was run on. */
	broadcaster_user_login: string;
	/** The broadcaster’s user display name for the channel the ad was run on. */
	broadcaster_user_name: string;
	/** The ID of the user that requested the ad. For automatic ads, this will be the ID of the broadcaster. */
	requester_user_id: string;
	/** The login of the user that requested the ad. */
	requester_user_login: string;
	/** The display name of the user that requested the ad. */
	requester_user_name: string;
}