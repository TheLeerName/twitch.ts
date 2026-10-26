import * as AutomodMessageHold from "./automod/message/hold";
import * as AutomodMessageUpdate from "./automod/message/update";
import * as AutomodSettingsUpdate from "./automod/settings/update";
import * as AutomodTermsUpdate from "./automod/terms/update";
import * as ChannelBitsUse from "./channel/bits/use";
import * as ChannelUpdate from "./channel/update";
import * as ChannelFollow from "./channel/follow";
import * as ChannelAdBreakBegin from "./channel/ad_break/begin";
import * as ChannelChatClear from "./channel/chat/clear";
import * as ChannelChatClearUserMessages from "./channel/chat/clear_user_messages";
import * as ChannelChatMessage from "./channel/chat/message";
import * as ChannelChatMessageDelete from "./channel/chat/message_delete";
import * as ChannelChatNotification from "./channel/chat/notification";
import * as ChannelChatSettingsUpdate from "./channel/chat_settings/update";
import * as ChannelChatUserMessageHold from "./channel/chat/user_message_hold";
import * as ChannelChatUserMessageUpdate from "./channel/chat/user_message_update";
import * as ChannelSubscribe from "./channel/subscribe";
import * as ChannelSubscriptionEnd from "./channel/subscription/end";
import * as ChannelSubscriptionGift from "./channel/subscription/gift";
import * as ChannelSubscriptionMessage from "./channel/subscription/message";
import * as ChannelCheer from "./channel/cheer";
import * as ChannelRaid from "./channel/raid";
import * as ChannelBan from "./channel/ban";
import * as ChannelUnban from "./channel/unban";
import * as ChannelUnbanRequestCreate from "./channel/unban_request/create";
import * as ChannelUnbanRequestResolve from "./channel/unban_request/resolve";
import * as ChannelModerate from "./channel/moderate";
import * as ChannelModeratorAdd from "./channel/moderator/add";
import * as ChannelModeratorRemove from "./channel/moderator/remove";
import * as ChannelGuestStarSessionBegin from "./channel/guest_star_session/begin";
import * as ChannelGuestStarSessionEnd from "./channel/guest_star_session/end";
import * as ChannelGuestStarGuestUpdate from "./channel/guest_star_guest/update";
import * as ChannelGuestStarSettingsUpdate from "./channel/guest_star_settings/update";
import * as ChannelChannelPointsAutomaticRewardRedemptionAdd from "./channel/channel_points_automatic_reward_redemption/add";
import * as ChannelChannelPointsCustomRewardAdd from "./channel/channel_points_custom_reward/add";
import * as ChannelChannelPointsCustomRewardUpdate from "./channel/channel_points_custom_reward/update";
import * as ChannelChannelPointsCustomRewardRemove from "./channel/channel_points_custom_reward/remove";
import * as ChannelChannelPointsCustomRewardRedemptionAdd from "./channel/channel_points_custom_reward_redemption/add";
import * as ChannelChannelPointsCustomRewardRedemptionUpdate from "./channel/channel_points_custom_reward_redemption/update";
import * as ChannelCustomPowerUpRedemptionAdd from "./channel/custom_power_up_redemption/add";
import * as ChannelPollBegin from "./channel/poll/begin";
import * as ChannelPollProgress from "./channel/poll/progress";
import * as ChannelPollEnd from "./channel/poll/end";
import * as ChannelPredictionBegin from "./channel/prediction/begin";
import * as ChannelPredictionProgress from "./channel/prediction/progress";
import * as ChannelPredictionLock from "./channel/prediction/lock";
import * as ChannelPredictionEnd from "./channel/prediction/end";
import * as ChannelSuspiciousUserUpdate from "./channel/suspicious_user/update";
import * as ChannelSuspiciousUserMessage from "./channel/suspicious_user/message";
import * as ChannelVipAdd from "./channel/vip/add";
import * as ChannelVipRemove from "./channel/vip/remove";
import * as ChannelWarningAcknowledge from "./channel/warning/acknowledge";
import * as ChannelWarningSend from "./channel/warning/send";
import * as ChannelHypeTrainBegin from "./channel/hype_train/begin";
import * as ChannelHypeTrainProgress from "./channel/hype_train/progress";
import * as ChannelHypeTrainEnd from "./channel/hype_train/end";
import * as ChannelCharityCampaignDonate from "./channel/charity_campaign/donate";
import * as ChannelCharityCampaignStart from "./channel/charity_campaign/start";
import * as ChannelCharityCampaignProgress from "./channel/charity_campaign/progress";
import * as ChannelCharityCampaignStop from "./channel/charity_campaign/stop";
import * as ChannelSharedChatBegin from "./channel/shared_chat/begin";
import * as ChannelSharedChatUpdate from "./channel/shared_chat/update";
import * as ChannelSharedChatEnd from "./channel/shared_chat/end";
import * as ChannelShieldModeBegin from "./channel/shield_mode/begin";
import * as ChannelShieldModeEnd from "./channel/shield_mode/end";
import * as ChannelShoutoutCreate from "./channel/shoutout/create";
import * as ChannelShoutoutReceive from "./channel/shoutout/receive";
import * as ConduitShardDisabled from "./conduit/shard/disabled";
import * as DropEntitlementGrant from "./drop/entitlement/grant";
import * as ExtensionBitsTransactionCreate from "./extension/bits_transaction/create";
import * as ChannelGoalBegin from "./channel/goal/begin";
import * as ChannelGoalProgress from "./channel/goal/progress";
import * as ChannelGoalEnd from "./channel/goal/end";
import * as StreamOnline from "./stream/online";
import * as StreamOffline from "./stream/offline";
import * as UserAuthorizationGrant from "./user/authorization/grant";
import * as UserAuthorizationRevoke from "./user/authorization/revoke";
import * as UserUpdate from "./user/update";
import * as UserWhisperMessage from "./user/whisper/message";

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

export type RequestBody =
| AutomodMessageHold.RequestBody
| AutomodMessageUpdate.RequestBody
| AutomodSettingsUpdate.RequestBody
| AutomodTermsUpdate.RequestBody
| ChannelBitsUse.RequestBody
| ChannelUpdate.RequestBody
| ChannelFollow.RequestBody
| ChannelAdBreakBegin.RequestBody
| ChannelChatClear.RequestBody
| ChannelChatClearUserMessages.RequestBody
| ChannelChatMessage.RequestBody
| ChannelChatMessageDelete.RequestBody
| ChannelChatNotification.RequestBody
| ChannelChatSettingsUpdate.RequestBody
| ChannelChatUserMessageHold.RequestBody
| ChannelChatUserMessageUpdate.RequestBody
| ChannelSubscribe.RequestBody
| ChannelSubscriptionEnd.RequestBody
| ChannelSubscriptionGift.RequestBody
| ChannelSubscriptionMessage.RequestBody
| ChannelCheer.RequestBody
| ChannelRaid.RequestBody
| ChannelBan.RequestBody
| ChannelUnban.RequestBody
| ChannelUnbanRequestCreate.RequestBody
| ChannelUnbanRequestResolve.RequestBody
| ChannelModerate.RequestBody
| ChannelModeratorAdd.RequestBody
| ChannelModeratorRemove.RequestBody
| ChannelGuestStarSessionBegin.RequestBody
| ChannelGuestStarSessionEnd.RequestBody
| ChannelGuestStarGuestUpdate.RequestBody
| ChannelGuestStarSettingsUpdate.RequestBody
| ChannelChannelPointsAutomaticRewardRedemptionAdd.RequestBody
| ChannelChannelPointsCustomRewardAdd.RequestBody
| ChannelChannelPointsCustomRewardUpdate.RequestBody
| ChannelChannelPointsCustomRewardRemove.RequestBody
| ChannelChannelPointsCustomRewardRedemptionAdd.RequestBody
| ChannelChannelPointsCustomRewardRedemptionUpdate.RequestBody
| ChannelCustomPowerUpRedemptionAdd.RequestBody
| ChannelPollBegin.RequestBody
| ChannelPollProgress.RequestBody
| ChannelPollEnd.RequestBody
| ChannelPredictionBegin.RequestBody
| ChannelPredictionProgress.RequestBody
| ChannelPredictionLock.RequestBody
| ChannelPredictionEnd.RequestBody
| ChannelSuspiciousUserUpdate.RequestBody
| ChannelSuspiciousUserMessage.RequestBody
| ChannelVipAdd.RequestBody
| ChannelVipRemove.RequestBody
| ChannelWarningAcknowledge.RequestBody
| ChannelWarningSend.RequestBody
| ChannelHypeTrainBegin.RequestBody
| ChannelHypeTrainProgress.RequestBody
| ChannelHypeTrainEnd.RequestBody
| ChannelCharityCampaignDonate.RequestBody
| ChannelCharityCampaignStart.RequestBody
| ChannelCharityCampaignProgress.RequestBody
| ChannelCharityCampaignStop.RequestBody
| ChannelSharedChatBegin.RequestBody
| ChannelSharedChatUpdate.RequestBody
| ChannelSharedChatEnd.RequestBody
| ChannelShieldModeBegin.RequestBody
| ChannelShieldModeEnd.RequestBody
| ChannelShoutoutCreate.RequestBody
| ChannelShoutoutReceive.RequestBody
| ConduitShardDisabled.RequestBody
| DropEntitlementGrant.RequestBody
| ExtensionBitsTransactionCreate.RequestBody
| ChannelGoalBegin.RequestBody
| ChannelGoalProgress.RequestBody
| ChannelGoalEnd.RequestBody
| StreamOnline.RequestBody
| StreamOffline.RequestBody
| UserAuthorizationGrant.RequestBody
| UserAuthorizationRevoke.RequestBody
| UserUpdate.RequestBody
| UserWhisperMessage.RequestBody;
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

export type Message =
| MessageWelcome
| MessageSessionKeepalive
| MessageNotification
| MessageSessionReconnect
| MessageRevocation;
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
| AutomodSettingsUpdate.MessageNotification
| AutomodTermsUpdate.MessageNotification
| ChannelBitsUse.MessageNotification
| ChannelUpdate.MessageNotification
| ChannelFollow.MessageNotification
| ChannelAdBreakBegin.MessageNotification
| ChannelChatClear.MessageNotification
| ChannelChatClearUserMessages.MessageNotification
| ChannelChatMessage.MessageNotification
| ChannelChatMessageDelete.MessageNotification
| ChannelChatNotification.MessageNotification
| ChannelChatSettingsUpdate.MessageNotification
| ChannelChatUserMessageHold.MessageNotification
| ChannelChatUserMessageUpdate.MessageNotification
| ChannelSubscribe.MessageNotification
| ChannelSubscriptionEnd.MessageNotification
| ChannelSubscriptionGift.MessageNotification
| ChannelSubscriptionMessage.MessageNotification
| ChannelCheer.MessageNotification
| ChannelRaid.MessageNotification
| ChannelBan.MessageNotification
| ChannelUnban.MessageNotification
| ChannelUnbanRequestCreate.MessageNotification
| ChannelUnbanRequestResolve.MessageNotification
| ChannelModerate.MessageNotification
| ChannelModeratorAdd.MessageNotification
| ChannelModeratorRemove.MessageNotification
| ChannelGuestStarSessionBegin.MessageNotification
| ChannelGuestStarSessionEnd.MessageNotification
| ChannelGuestStarGuestUpdate.MessageNotification
| ChannelGuestStarSettingsUpdate.MessageNotification
| ChannelChannelPointsAutomaticRewardRedemptionAdd.MessageNotification
| ChannelChannelPointsCustomRewardAdd.MessageNotification
| ChannelChannelPointsCustomRewardUpdate.MessageNotification
| ChannelChannelPointsCustomRewardRemove.MessageNotification
| ChannelChannelPointsCustomRewardRedemptionAdd.MessageNotification
| ChannelChannelPointsCustomRewardRedemptionUpdate.MessageNotification
| ChannelCustomPowerUpRedemptionAdd.MessageNotification
| ChannelPollBegin.MessageNotification
| ChannelPollProgress.MessageNotification
| ChannelPollEnd.MessageNotification
| ChannelPredictionBegin.MessageNotification
| ChannelPredictionProgress.MessageNotification
| ChannelPredictionLock.MessageNotification
| ChannelPredictionEnd.MessageNotification
| ChannelSuspiciousUserUpdate.MessageNotification
| ChannelSuspiciousUserMessage.MessageNotification
| ChannelVipAdd.MessageNotification
| ChannelVipRemove.MessageNotification
| ChannelWarningAcknowledge.MessageNotification
| ChannelWarningSend.MessageNotification
| ChannelHypeTrainBegin.MessageNotification
| ChannelHypeTrainProgress.MessageNotification
| ChannelHypeTrainEnd.MessageNotification
| ChannelCharityCampaignDonate.MessageNotification
| ChannelCharityCampaignStart.MessageNotification
| ChannelCharityCampaignProgress.MessageNotification
| ChannelCharityCampaignStop.MessageNotification
| ChannelSharedChatBegin.MessageNotification
| ChannelSharedChatUpdate.MessageNotification
| ChannelSharedChatEnd.MessageNotification
| ChannelShieldModeBegin.MessageNotification
| ChannelShieldModeEnd.MessageNotification
| ChannelShoutoutCreate.MessageNotification
| ChannelShoutoutReceive.MessageNotification
| ConduitShardDisabled.MessageNotification
| DropEntitlementGrant.MessageNotification
| ExtensionBitsTransactionCreate.MessageNotification
| ChannelGoalBegin.MessageNotification
| ChannelGoalProgress.MessageNotification
| ChannelGoalEnd.MessageNotification
| StreamOnline.MessageNotification
| StreamOffline.MessageNotification
| UserAuthorizationGrant.MessageNotification
| UserAuthorizationRevoke.MessageNotification
| UserUpdate.MessageNotification
| UserWhisperMessage.MessageNotification;
export function isMessageNotification(obj: Message): obj is MessageNotification {
	return obj != null && obj.metadata != null && obj.metadata.message_type === "notification";
}

export type MessageNotificationWebSocket = Exclude<MessageNotification, 
| ConduitShardDisabled.MessageNotification
| DropEntitlementGrant.MessageNotification
| ExtensionBitsTransactionCreate.MessageNotification
| UserAuthorizationGrant.MessageNotification
| UserAuthorizationRevoke.MessageNotification>;
export function isMessageNotificationWebSocket(obj: Message): obj is MessageNotificationWebSocket {
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
	AutomodSettingsUpdate,
	AutomodTermsUpdate,
	ChannelBitsUse,
	ChannelUpdate,
	ChannelFollow,
	ChannelAdBreakBegin,
	ChannelChatClear,
	ChannelChatClearUserMessages,
	ChannelChatMessage,
	ChannelChatMessageDelete,
	ChannelChatNotification,
	ChannelChatSettingsUpdate,
	ChannelChatUserMessageHold,
	ChannelChatUserMessageUpdate,
	ChannelSubscribe,
	ChannelSubscriptionEnd,
	ChannelSubscriptionGift,
	ChannelSubscriptionMessage,
	ChannelCheer,
	ChannelRaid,
	ChannelBan,
	ChannelUnban,
	ChannelUnbanRequestCreate,
	ChannelUnbanRequestResolve,
	ChannelModerate,
	ChannelModeratorAdd,
	ChannelModeratorRemove,
	ChannelGuestStarSessionBegin,
	ChannelGuestStarSessionEnd,
	ChannelGuestStarGuestUpdate,
	ChannelGuestStarSettingsUpdate,
	ChannelChannelPointsAutomaticRewardRedemptionAdd,
	ChannelChannelPointsCustomRewardAdd,
	ChannelChannelPointsCustomRewardUpdate,
	ChannelChannelPointsCustomRewardRemove,
	ChannelChannelPointsCustomRewardRedemptionAdd,
	ChannelChannelPointsCustomRewardRedemptionUpdate,
	ChannelCustomPowerUpRedemptionAdd,
	ChannelPollBegin,
	ChannelPollProgress,
	ChannelPollEnd,
	ChannelPredictionBegin,
	ChannelPredictionProgress,
	ChannelPredictionLock,
	ChannelPredictionEnd,
	ChannelSuspiciousUserUpdate,
	ChannelSuspiciousUserMessage,
	ChannelVipAdd,
	ChannelVipRemove,
	ChannelWarningAcknowledge,
	ChannelWarningSend,
	ChannelHypeTrainBegin,
	ChannelHypeTrainProgress,
	ChannelHypeTrainEnd,
	ChannelCharityCampaignDonate,
	ChannelCharityCampaignStart,
	ChannelCharityCampaignProgress,
	ChannelCharityCampaignStop,
	ChannelSharedChatBegin,
	ChannelSharedChatUpdate,
	ChannelSharedChatEnd,
	ChannelShieldModeBegin,
	ChannelShieldModeEnd,
	ChannelShoutoutCreate,
	ChannelShoutoutReceive,
	ConduitShardDisabled,
	DropEntitlementGrant,
	ExtensionBitsTransactionCreate,
	ChannelGoalBegin,
	ChannelGoalProgress,
	ChannelGoalEnd,
	StreamOnline,
	StreamOffline,
	UserAuthorizationGrant,
	UserAuthorizationRevoke,
	UserUpdate,
	UserWhisperMessage,
};