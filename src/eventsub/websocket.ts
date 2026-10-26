import { EventEmitter } from "node:stream";
import * as Main from "..";
import ReconnectingWebSocket, { Options } from "reconnecting-websocket";

/** An object that contains information about the connection. */
export interface Session {
	/** An ID that uniquely identifies this WebSocket connection. Use this ID to set the `session_id` field in all subscription requests. */
	id: string;
	/** The connection’s status. */
	status: "connected" | "reconnecting";
	/** **Integer**. Number of seconds that you have to subscribe to an event after receiving the welcome message. If you don’t subscribe to an event within this window, the socket is disconnected. */
	keepalive_timeout_seconds: number;
	/** The UTC date and time when the connection was created. */
	connected_at: string;
}

export interface Events {
	/**
	 * Calls on closing WebSocket
	 * @param listener.code WebSocket connection close code
	 * @param listener.reason WebSocket connection close reason
	 */
	close: (code: number, reason: string) => void;
	/**
	 * Calls on getting `session_welcome` message. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#welcome-message)

	 * **NOTE**: For subscribing to events with `Request.CreateEventSubSubscription`, you must use it **only** if `isReconnectedByTwitch` is `false`, because after reconnecting new connection will include the same subscriptions that the old connection had
	 * @param isReconnectedByTwitch Is `true`, if {@link session_keepalive} event was emitted before
	 */
	session_welcome: (message: Main.EventSub.MessageWelcome, isReconnectedByTwitch: boolean) => void;
	/** Calls on getting `session_keepalive` message, these messages indicates that the WebSocket connection is healthy. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#keepalive-message) */
	session_keepalive: (message: Main.EventSub.MessageSessionKeepalive) => void;
	/** Calls on getting `session_reconnect` message, these messages are sent if the edge server that the client is connected to needs to be swapped. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#reconnect-message) */
	session_reconnect: (message: Main.EventSub.MessageSessionReconnect) => void;
	/** Calls on getting `revocation` message, these messages are sent if Twitch revokes a subscription. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#revocation-message) */
	revocation: (message: Main.EventSub.MessageRevocation) => void;

	/** Calls on getting any `notification` message, these messages are sent when an event that you subscribe to occurs. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#notification-message) */
	notification: (message: Main.EventSub.MessageNotificationWebSocket) => void;

	"automod.message.hold": (message: Main.EventSub.AutomodMessageHold.MessageNotification) => void;
	"automod.message.update": (message: Main.EventSub.AutomodMessageUpdate.MessageNotification) => void;
	"automod.settings.update": (message: Main.EventSub.AutomodSettingsUpdate.MessageNotification) => void;
	"automod.terms.update": (message: Main.EventSub.AutomodTermsUpdate.MessageNotification) => void;
	"channel.bits.use": (message: Main.EventSub.ChannelBitsUse.MessageNotification) => void;
	"channel.update": (message: Main.EventSub.ChannelUpdate.MessageNotification) => void;
	"channel.follow": (message: Main.EventSub.ChannelFollow.MessageNotification) => void;
	"channel.ad_break.begin": (message: Main.EventSub.ChannelAdBreakBegin.MessageNotification) => void;
	"channel.chat.clear": (message: Main.EventSub.ChannelChatClear.MessageNotification) => void;
	"channel.chat.clear_user_messages": (message: Main.EventSub.ChannelChatClearUserMessages.MessageNotification) => void;
	"channel.chat.message": (message: Main.EventSub.ChannelChatMessage.MessageNotification) => void;
	"channel.chat.message_delete": (message: Main.EventSub.ChannelChatMessageDelete.MessageNotification) => void;
	"channel.chat.notification": (message: Main.EventSub.ChannelChatNotification.MessageNotification) => void;
	"channel.chat_settings.update": (message: Main.EventSub.ChannelChatSettingsUpdate.MessageNotification) => void;
	"channel.chat.user_message_hold": (message: Main.EventSub.ChannelChatUserMessageHold.MessageNotification) => void;
	"channel.chat.user_message_update": (message: Main.EventSub.ChannelChatUserMessageUpdate.MessageNotification) => void;
	"channel.subscribe": (message: Main.EventSub.ChannelSubscribe.MessageNotification) => void;
	"channel.subscription.end": (message: Main.EventSub.ChannelSubscriptionEnd.MessageNotification) => void;
	"channel.subscription.gift": (message: Main.EventSub.ChannelSubscriptionGift.MessageNotification) => void;
	"channel.subscription.message": (message: Main.EventSub.ChannelSubscriptionMessage.MessageNotification) => void;
	"channel.raid": (message: Main.EventSub.ChannelRaid.MessageNotification) => void;
	"channel.ban": (message: Main.EventSub.ChannelBan.MessageNotification) => void;
	"channel.unban": (message: Main.EventSub.ChannelUnban.MessageNotification) => void;
	"channel.unban_request.create": (message: Main.EventSub.ChannelUnbanRequestCreate.MessageNotification) => void;
	"channel.unban_request.resolve": (message: Main.EventSub.ChannelUnbanRequestResolve.MessageNotification) => void;
	"channel.moderate": (message: Main.EventSub.ChannelModerate.MessageNotification) => void;
	"channel.moderator.add": (message: Main.EventSub.ChannelModeratorAdd.MessageNotification) => void;
	"channel.moderator.remove": (message: Main.EventSub.ChannelModeratorRemove.MessageNotification) => void;
	"channel.guest_star_session.begin": (message: Main.EventSub.ChannelGuestStarSessionBegin.MessageNotification) => void;
	"channel.guest_star_session.end": (message: Main.EventSub.ChannelGuestStarSessionEnd.MessageNotification) => void;
	"channel.guest_star_guest.update": (message: Main.EventSub.ChannelGuestStarGuestUpdate.MessageNotification) => void;
	"channel.guest_star_settings.update": (message: Main.EventSub.ChannelGuestStarSettingsUpdate.MessageNotification) => void;
	"channel.channel_points_automatic_reward_redemption.add": (message: Main.EventSub.ChannelChannelPointsAutomaticRewardRedemptionAdd.MessageNotification) => void;
	"channel.channel_points_custom_reward.add": (message: Main.EventSub.ChannelChannelPointsCustomRewardAdd.MessageNotification) => void;
	"channel.channel_points_custom_reward.update": (message: Main.EventSub.ChannelChannelPointsCustomRewardUpdate.MessageNotification) => void;
	"channel.channel_points_custom_reward.remove": (message: Main.EventSub.ChannelChannelPointsCustomRewardRemove.MessageNotification) => void;
	"channel.channel_points_custom_reward_redemption.add": (message: Main.EventSub.ChannelChannelPointsCustomRewardRedemptionAdd.MessageNotification) => void;
	"channel.channel_points_custom_reward_redemption.update": (message: Main.EventSub.ChannelChannelPointsCustomRewardRedemptionUpdate.MessageNotification) => void;
	"channel.custom_power_up_redemption.add": (message: Main.EventSub.ChannelCustomPowerUpRedemptionAdd.MessageNotification) => void;
	"channel.poll.begin": (message: Main.EventSub.ChannelPollBegin.MessageNotification) => void;
	"channel.poll.progress": (message: Main.EventSub.ChannelPollProgress.MessageNotification) => void;
	"channel.poll.end": (message: Main.EventSub.ChannelPollEnd.MessageNotification) => void;
	"channel.prediction.begin": (message: Main.EventSub.ChannelPredictionBegin.MessageNotification) => void;
	"channel.prediction.progress": (message: Main.EventSub.ChannelPredictionProgress.MessageNotification) => void;
	"channel.prediction.lock": (message: Main.EventSub.ChannelPredictionLock.MessageNotification) => void;
	"channel.prediction.end": (message: Main.EventSub.ChannelPredictionEnd.MessageNotification) => void;
	"channel.suspicious_user.update": (message: Main.EventSub.ChannelSuspiciousUserUpdate.MessageNotification) => void;
	"channel.suspicious_user.message": (message: Main.EventSub.ChannelSuspiciousUserMessage.MessageNotification) => void;
	"channel.vip.add": (message: Main.EventSub.ChannelVipAdd.MessageNotification) => void;
	"channel.vip.remove": (message: Main.EventSub.ChannelVipRemove.MessageNotification) => void;
	"channel.warning.acknowledge": (message: Main.EventSub.ChannelWarningAcknowledge.MessageNotification) => void;
	"channel.warning.send": (message: Main.EventSub.ChannelWarningSend.MessageNotification) => void;
	"channel.hype_train.begin": (message: Main.EventSub.ChannelHypeTrainBegin.MessageNotification) => void;
	"channel.hype_train.progress": (message: Main.EventSub.ChannelHypeTrainProgress.MessageNotification) => void;
	"channel.charity_campaign.donate": (message: Main.EventSub.ChannelCharityCampaignDonate.MessageNotification) => void;
	"channel.charity_campaign.start": (message: Main.EventSub.ChannelCharityCampaignStart.MessageNotification) => void;
	"channel.charity_campaign.progress": (message: Main.EventSub.ChannelCharityCampaignProgress.MessageNotification) => void;
	"channel.charity_campaign.stop": (message: Main.EventSub.ChannelCharityCampaignStop.MessageNotification) => void;
	"channel.shared_chat.begin": (message: Main.EventSub.ChannelSharedChatBegin.MessageNotification) => void;
	"channel.shared_chat.update": (message: Main.EventSub.ChannelSharedChatUpdate.MessageNotification) => void;
	"channel.shared_chat.end": (message: Main.EventSub.ChannelSharedChatEnd.MessageNotification) => void;
	"channel.shield_mode.begin": (message: Main.EventSub.ChannelShieldModeBegin.MessageNotification) => void;
	"channel.shield_mode.end": (message: Main.EventSub.ChannelShieldModeEnd.MessageNotification) => void;
	"channel.shoutout.create": (message: Main.EventSub.ChannelShoutoutCreate.MessageNotification) => void;
	"channel.shoutout.receive": (message: Main.EventSub.ChannelShoutoutReceive.MessageNotification) => void;
	"channel.goal.begin": (message: Main.EventSub.ChannelGoalBegin.MessageNotification) => void;
	"channel.goal.progress": (message: Main.EventSub.ChannelGoalProgress.MessageNotification) => void;
	"channel.goal.end": (message: Main.EventSub.ChannelGoalEnd.MessageNotification) => void;
	"stream.online": (message: Main.EventSub.StreamOnline.MessageNotification) => void;
	"stream.offline": (message: Main.EventSub.StreamOffline.MessageNotification) => void;
	"user.update": (message: Main.EventSub.UserUpdate.MessageNotification) => void;
	"user.whisper.message": (message: Main.EventSub.UserWhisperMessage.MessageNotification) => void;
}

/**
 * EventSub WebSocket connection using {@link ReconnectingWebSocket} class
 * - `session_reconnect` and `session_keepalive` messages are already handled here
 */
export default class WebSocket extends EventEmitter {
	readonly ws!: ReconnectingWebSocket;
	/** EventSub session, do not use it **before** first `session_welcome` message. */
	readonly session!: Session;

	/** Returns connected timestamp of this websocket in ISO format (`session_reconnect` will reset this) */
	getConnectedTimestampISO(): string {
		return this.session.connected_at;
	}
	/** Returns connected timestamp of this websocket (`session_reconnect` will reset this) */
	getConnectedTimestamp(): number {
		return new Date(this.getConnectedTimestampISO()).getTime();
	}
	/** Returns connected timestamp of this entire session in ISO format (`session_reconnect` will NOT reset this) */
	readonly firstConnectedTimestampISO!: string;
	/** Returns connected timestamp of this entire session in ISO format (`session_reconnect` will NOT reset this) */
	readonly firstConnectedTimestamp!: number;

	constructor(protocols?: string | string[], options?: Options) {
		super();
		this.protocols = protocols;
		this.options = options;
		this.setupWebSocket();
		this.ws.onopen = _ => this.storeFirstConnectedTimestamp();
	}

	/** Closes the connection with code `1000` */
	close() {
		this.emit("close", 1000, `client closed the connection`);
		this.ws.onclose = _ => {};
		this.ws.onmessage = _ => {};
		this.ws.close();
	}

	private keepaliveTimeout?: NodeJS.Timeout | number;
	private protocols?: string | string[];
	private options?: Options;
	private prevMessageIDs: Record<Main.EventSub.Message["metadata"]["message_type"], string | null> = {
		session_welcome: null,
		session_keepalive: null,
		session_reconnect: null,
		notification: null,
		revocation: null,
	};
	private wsOld?: ReconnectingWebSocket;

	private setupWebSocket(url?: string) {
		(this.ws as ReconnectingWebSocket) = new ReconnectingWebSocket(url ?? Main.Options.eventSubWSPath, this.protocols, this.options);
		this.ws.onmessage = e => {
			if (this.keepaliveTimeout) {
				clearTimeout(this.keepaliveTimeout);
				delete this.keepaliveTimeout;
			}

			const message: Main.EventSub.Message = JSON.parse(e.data);
			if (this.prevMessageIDs[message.metadata.message_type] === message.metadata.message_id)
				return;
			this.prevMessageIDs[message.metadata.message_type] = message.metadata.message_id;
			if (Main.EventSub.isMessageWelcome(message)) {
				const isReconnected = url != null;
				if (this.wsOld) {
					// old ws connection must be closed after session_welcome message of new connection
					this.wsOld.close();
					delete this.wsOld;
				}
				(this.session as Session) = {...message.payload.session};
				this.emit("session_welcome", message, isReconnected);
			}
			else if (Main.EventSub.isMessageSessionKeepalive(message)) {
				// if we not getting any message in about 11 seconds, ws connection must be reconnected
				this.keepaliveTimeout = setTimeout(() => this.giveCloseCodeToClient(4005, `client doesn't received any message within ${this.session.keepalive_timeout_seconds} seconds`), (this.session.keepalive_timeout_seconds + 1) * 1000);
				this.emit("session_keepalive", message);
			}
			else if (Main.EventSub.isMessageSessionReconnect(message)) {
				this.session.id = message.payload.session.id;
				this.session.status = message.payload.session.status;
				this.session.connected_at = message.payload.session.connected_at;

				this.wsOld = this.ws;
				this.wsOld.onmessage = () => {};
				this.wsOld.onclose = () => {};

				this.setupWebSocket(message.payload.session.reconnect_url);

				this.emit("session_reconnect", message);
			}
			else if (Main.EventSub.isMessageNotificationWebSocket(message)) {
				this.emit("notification", message);
				this.emit(message.payload.subscription.type, message as any);
			}
			else if (Main.EventSub.isMessageRevocation(message))
				this.emit("revocation", message);
		};
		this.ws.onclose = e => {
			this.emit("close", e.code, e.reason);
		};
	}

	private giveCloseCodeToClient(code: number = 1000, reason: string = "client disconnected") {
		this.ws.onclose?.({ code, reason } as any);
		this.ws.onclose = () => {};
		this.ws.close();
	}

	private storeFirstConnectedTimestamp() {
		const date = new Date();
		(this.firstConnectedTimestampISO as string) = date.toISOString();
		(this.firstConnectedTimestamp as number) = date.getTime();
	}

	override once<EventName extends keyof Events>(eventName: EventName, listener: Events[EventName]) {
		return super.once(eventName, listener);
	}
	override prependOnceListener<EventName extends keyof Events>(eventName: EventName, listener: Events[EventName]) {
		return super.prependOnceListener(eventName, listener);
	}
	override on<EventName extends keyof Events>(eventName: EventName, listener: Events[EventName]) {
		return super.on(eventName, listener);
	}
	override prependListener<EventName extends keyof Events>(eventName: EventName, listener: Events[EventName]) {
		return super.prependListener(eventName, listener);
	}
	override off<EventName extends keyof Events>(eventName: EventName, listener: Events[EventName]) {
		return super.off(eventName, listener);
	}
	override emit<EventName extends keyof Events>(eventName: EventName, ...args: Parameters<Events[EventName]>) {
		return super.emit(eventName, ...args);
	}
}