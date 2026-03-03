import { Authorization, Paths } from ".";

/**
 * Starts WebSocket for subscribing and getting EventSub events
 * - Reconnects in `reconnect_ms`, if WebSocket was closed
 * - Reconnects immediately, if gets `session_reconnect` message
 * - When getting not first `session_welcome` message when `reconnect_url` is `false` or when recreating ws session (if your app is reopened or internet was down), please delete old events via `Request.DeleteEventSubSubscription`, you will need a id of subscription, store it somewhere
 * @param reconnect_ms If less then `1`, WebSocket will be not reconnected after `onClose()`, default value is `500`
 */
export function startWebSocket<S extends Authorization.Scope[]>(token_data: Authorization.User<S>, reconnect_ms?: number) {
	if (!reconnect_ms) reconnect_ms = 500;

	const connection = new Connection(new WebSocket(Paths.eventSubWS), token_data);
	var previous_message_id: string | undefined;

	function giveCloseCodeToClient(code: number = 1000, reason: string = "client disconnected") {
		connection.ws.onclose?.({ code, reason } as any);
		connection.ws.onclose = () => {};
		connection.ws.close();
	}

	function storeFirstConnectedTimestamp(e: Event) {
		const date = new Date();
		connection.first_connected_timestamp_iso = date.toISOString();
		connection.first_connected_timestamp = date.getTime();
	}
	async function onMessage(e: MessageEvent) {
		if (connection.keepalive_timeout) {
			clearTimeout(connection.keepalive_timeout);
			delete connection.keepalive_timeout;
		}

		const message: Message = JSON.parse(e.data);

		// do not handle same message, twitch can be unsure if you got the message smh
		if (previous_message_id && message.metadata.message_id === previous_message_id)
			return;
		previous_message_id = message.metadata.message_id;

		await connection.onMessage(message);
		if (Message.isSessionWelcome(message)) {
			if (connection.network_timeout) {
				clearTimeout(connection.network_timeout);
				connection.network_timeout = undefined;
			}
			const is_reconnected = connection.session?.status === "reconnecting";
			if (connection.ws_old) {
				// old ws connection must be closed after session_welcome message of new connection
				connection.ws_old.close();
				connection.ws_old = undefined;
			}
			connection.session = message.payload.session;
			connection.transport = Transport.WebSocket(message.payload.session.id);
			connection.onSessionWelcome(message, is_reconnected);
		}
		else if (Message.isSessionKeepalive(message)) {
			// if we not getting any message in about 12 seconds, ws connection must be reconnected
			connection.keepalive_timeout = setTimeout(() => giveCloseCodeToClient(4005, `client doesn't received any message within ${connection.session.keepalive_timeout_seconds} seconds`), (connection.session.keepalive_timeout_seconds! + 2) * 1000);
			connection.onSessionKeepalive(message);
		}
		else if (Message.isSessionReconnect(message)) {
			connection.session = message.payload.session;
			connection.ws_old = connection.ws;
			connection.ws_old.onmessage = () => {};
			connection.ws_old.onclose = () => {};

			connection.ws = new WebSocket(message.payload.session.reconnect_url);
			connection.ws.onmessage = onMessage;
			connection.ws.onclose = onClose;

			connection.onSessionReconnect(message);
		}
		else if (Message.isNotification(message)) {
			connection.onNotification(message);
		}
		else if (Message.isRevocation(message)) {
			connection.onRevocation(message);
		}
	}
	async function onClose(e: CloseEvent) {
		setTimeout(() => {
			connection.ws = new WebSocket(Paths.eventSubWS);
			connection.network_timeout = setTimeout(() => giveCloseCodeToClient(4005, `client doesnt received session_welcome message within 10 seconds`), 10000);
			connection.ws.onmessage = onMessage;
			connection.ws.onclose = onClose;
		}, reconnect_ms);

		connection.onClose(e.code, e.reason);
	}

	connection.network_timeout = setTimeout(() => giveCloseCodeToClient(4005, `client doesnt received session_welcome message within 10 seconds`), 10000);
	connection.ws.onopen = storeFirstConnectedTimestamp;
	connection.ws.onmessage = onMessage;
	connection.ws.onclose = onClose;

	return connection;
}

export type SubscriptionType =
	'enabled' | 'webhook_callback_verification_pending' | 'webhook_callback_verification_failed' |
	'notification_failures_exceeded' | 'authorization_revoked' | 'moderator_removed' |
	'user_removed' | 'chat_user_banned' | 'version_removed' | 'beta_maintenance' |
	'websocket_disconnected' | 'websocket_failed_ping_pong' | 'websocket_received_inbound_traffic' |
	'websocket_connection_unused' | 'websocket_internal_error' | 'websocket_network_timeout' |
	'websocket_network_error' | 'websocket_failed_to_reconnect';

export class Connection<S extends Authorization.Scope[] = Authorization.Scope[]> {
	ws: WebSocket;
	ws_old: WebSocket | undefined;
	/** User access token data */
	authorization: Authorization.User<S>;
	/** EventSub session, do not use it **before** first `onSessionWelcome()` message */
	session!: Session;
	/** Defines the transport details that you want Twitch to use when sending you event notifications. */
	transport!: Transport.WebSocket;

	/** Returns connected timestamp of this websocket in ISO format (session_reconnect will reset this) */
	getConnectedTimestampISO(): string {
		return this.session.connected_at;
	}
	/** Returns connected timestamp of this websocket (session_reconnect will reset this) */
	getConnectedTimestamp(): number {
		return new Date(this.getConnectedTimestampISO()).getTime();
	}
	/** Returns connected timestamp of this entire session in ISO format (session_reconnect will NOT reset this)  */
	first_connected_timestamp_iso!: string;
	/** Returns connected timestamp of this entire session in ISO format (session_reconnect will NOT reset this)  */
	first_connected_timestamp!: number;

	/** ID of timer which closes connection if WebSocket isn't received any message within `session.keepalive_timeout_seconds`, becomes `undefined` if any message was received */
	keepalive_timeout?: NodeJS.Timeout | number;
	network_timeout?: NodeJS.Timeout | number;

	constructor(ws: WebSocket, authorization: Authorization.User<S>) {
		this.ws = ws;
		this.authorization = authorization;
	}

	/**
	 * Calls on closing WebSocket
	 * @param code WebSocket connection close code
	 * @param reason WebSocket connection close reason
	 */
	async onClose(code: number, reason: string) {}
	/** Calls on getting any EventSub message, any specified message callback will be called **after** this callback */
	async onMessage(message: Message) {}
	/**
	 * Calls on getting `session_welcome` message. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#welcome-message)
	 * - For subscribing to events with `Request.CreateEventSubSubscription`, you must use it **only** if `is_reconnected` is `false`, because after reconnecting new connection will include the same subscriptions that the old connection had
	 * @param is_reconnected **DO NOT** subscribe to events if its `true`!
	 */
	async onSessionWelcome(message: Message.SessionWelcome, is_reconnected: boolean) {}
	/** Calls on getting `session_keepalive` message, these messages indicates that the WebSocket connection is healthy. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#keepalive-message) */
	async onSessionKeepalive(message: Message.SessionKeepalive) {}
	/** Calls on getting `notification` message, these messages are sent when an event that you subscribe to occurs. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#notification-message) */
	async onNotification(message: Message.Notification) {}
	/** Calls on getting `session_reconnect` message, these messages are sent if the edge server that the client is connected to needs to be swapped. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#reconnect-message) */
	async onSessionReconnect(message: Message.SessionReconnect) {}
	/** Calls on getting `revocation` message, these messages are sent if Twitch revokes a subscription. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#revocation-message) */
	async onRevocation(message: Message.Revocation) {}

	/** Closes the connection with code `1000` */
	async close() {
		await this.onClose(1000, `client closed the connection`);
		this.ws.onclose = _ => {};
		this.ws.onmessage = _ => {};
		this.ws.close();
	}
}
export namespace Connection {
	export function is<S extends Authorization.Scope[]>(connection: any): connection is Connection<S> {
		return connection.ws != null && connection.authorization != null;
	}
}

/** Definition of the subscription. */
export type Version = "1" | "2" | "beta";

/** Parameters under which the event subscription fires. */
export type Condition = {};
export namespace Condition {
	export interface AutomodMessageHold extends Condition {
		/** User ID of the broadcaster (channel). */
		broadcaster_user_id: string;
		/** User ID of the moderator. */
		moderator_user_id: string;
	}
	export interface AutomodMessageUpdate extends Condition {
		/** User ID of the broadcaster (channel). Maximum: 1. */
		broadcaster_user_id: string;
		/** User ID of the moderator. */
		moderator_user_id: string;
	}
	export interface AutomodSettingsUpdate extends Condition {
		/** User ID of the broadcaster (channel). Maximum: 1. */
		broadcaster_user_id: string;
		/** User ID of the moderator. */
		moderator_user_id: string;
	}
	export interface AutomodTermsUpdate extends Condition {
		/** User ID of the broadcaster (channel). Maximum: 1. */
		broadcaster_user_id: string;
		/** User ID of the moderator creating the subscription. Maximum: 1. */
		moderator_user_id: string;
	}
	export interface ChannelBitsUse extends Condition {
		/** The user ID of the channel broadcaster. Maximum: 1. */
		broadcaster_user_id: string;
	}
	export interface ChannelUpdate extends Condition {
		/** The broadcaster user ID for the channel you want to get updates for. */
		broadcaster_user_id: string;
	}
	export interface ChannelFollow extends Condition {
		/** The broadcaster user ID for the channel you want to get follow notifications for. */
		broadcaster_user_id: string;
		/** The ID of the moderator of the channel you want to get follow notifications for. If you have authorization from the broadcaster rather than a moderator, specify the broadcaster’s user ID here. */
		moderator_user_id: string;
	}
	export interface ChannelAdBreakBegin extends Condition {
		/** The ID of the broadcaster that you want to get Channel Ad Break begin notifications for. Maximum: 1 */
		broadcaster_id: string;
	}
	export interface ChannelChatClear extends Condition {
		/** User ID of the channel to receive chat clear events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatClearUserMessages extends Condition {
		/** User ID of the channel to receive chat clear user messages events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatMessage extends Condition {
		/** The User ID of the channel to receive chat message events for. */
		broadcaster_user_id: string;
		/** The User ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatMessageDelete extends Condition {
		/** User ID of the channel to receive chat message delete events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatNotification extends Condition {
		/** User ID of the channel to receive chat notification events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatSettingsUpdate extends Condition {
		/** User ID of the channel to receive chat settings update events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatUserMessageHold extends Condition {
		/** User ID of the channel to receive chat message events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelChatUserMessageUpdate extends Condition {
		/** User ID of the channel to receive chat message events for. */
		broadcaster_user_id: string;
		/** The user ID to read chat as. */
		user_id: string;
	}
	export interface ChannelSharedChatSessionBegin extends Condition {
		/** The User ID of the channel to receive shared chat session begin events for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSharedChatSessionUpdate extends Condition {
		/** The User ID of the channel to receive shared chat session update events for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSharedChatSessionEnd extends Condition {
		/** The User ID of the channel to receive shared chat session end events for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSubscribe extends Condition {
		/** The broadcaster user ID for the channel you want to get subscribe notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSubscriptionEnd extends Condition {
		/** The broadcaster user ID for the channel you want to get subscription end notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSubscriptionGift extends Condition {
		/** The broadcaster user ID for the channel you want to get subscription gift notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSubscriptionMessage extends Condition {
		/** The broadcaster user ID for the channel you want to get resubscription chat message notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelCheer extends Condition {
		/** The broadcaster user ID for the channel you want to get cheer notifications for. */
		broadcaster_user_id: string;
	}
	export type ChannelRaid = ChannelRaid.From | ChannelRaid.To;
	export namespace ChannelRaid {
		export interface From extends Condition {
			/** The broadcaster user ID that created the channel raid you want to get notifications for. Use this parameter if you want to know when a specific broadcaster raids another broadcaster. */
			from_broadcaster_user_id: string;
		}
		export interface To extends Condition {
			/** The broadcaster user ID that received the channel raid you want to get notifications for. Use this parameter if you want to know when a specific broadcaster is raided by another broadcaster. */
			to_broadcaster_user_id: string;
		}
	}
	export interface ChannelBan extends Condition {
		/** The broadcaster user ID for the channel you want to get ban notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelUnban extends Condition {
		/** The broadcaster user ID for the channel you want to get unban notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelUnbanRequestCreate extends Condition {
		/** The ID of the user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
		moderator_user_id: string;
		/** The ID of the broadcaster you want to get chat unban request notifications for. Maximum: 1. */
		broadcaster_user_id: string;
	}
	export interface ChannelUnbanRequestResolve extends Condition {
		/** The ID of the user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
		moderator_user_id: string;
		/** The ID of the broadcaster you want to get unban request resolution notifications for. Maximum: 1. */
		broadcaster_user_id: string;
	}
	export interface ChannelModerate extends Condition {
		/** The user ID of the broadcaster. */
		broadcaster_user_id: string;
		/** The user ID of the moderator. */
		moderator_user_id: string;
	}
	export interface ChannelModeratorAdd extends Condition {
		/** The broadcaster user ID for the channel you want to get moderator addition notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelModeratorRemove extends Condition {
		/** The broadcaster user ID for the channel you want to get moderator removal notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelGuestStarSessionBegin extends Condition {
		/** The broadcaster user ID of the channel hosting the Guest Star Session */
		broadcaster_user_id: string;
		/** The user ID of the moderator or broadcaster of the specified channel. */
		moderator_user_id: string;
	}
	export interface ChannelGuestStarSessionEnd extends Condition {
		/** The broadcaster user ID of the channel hosting the Guest Star Session */
		broadcaster_user_id: string;
		/** The user ID of the moderator or broadcaster of the specified channel. */
		moderator_user_id: string;
	}
	export interface ChannelGuestStarGuestUpdate extends Condition {
		/** The broadcaster user ID of the channel hosting the Guest Star Session */
		broadcaster_user_id: string;
		/** The user ID of the moderator or broadcaster of the specified channel. */
		moderator_user_id: string;
	}
	export interface ChannelGuestStarSettingsUpdate extends Condition {
		/** The broadcaster user ID of the channel hosting the Guest Star Session */
		broadcaster_user_id: string;
		/** The user ID of the moderator or broadcaster of the specified channel. */
		moderator_user_id: string;
	}
	export interface ChannelPointsAutomaticRewardRedemptionAdd extends Condition {
		/** The broadcaster user ID for the channel you want to receive channel points reward add notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelPointsCustomRewardAdd extends Condition {
		/** The broadcaster user ID for the channel you want to receive channel points custom reward add notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelPointsCustomRewardUpdate extends Condition {
		/** The broadcaster user ID for the channel you want to receive channel points custom reward update notifications for. */
		broadcaster_user_id: string;
		/** Optional. Specify a reward id to only receive notifications for a specific reward. */
		reward_id?: string;
	}
	export interface ChannelPointsCustomRewardRemove extends Condition {
		/** The broadcaster user ID for the channel you want to receive channel points custom reward remove notifications for. */
		broadcaster_user_id: string;
		/** Optional. Specify a reward id to only receive notifications for a specific reward. */
		reward_id?: string;
	}
	export interface ChannelPointsCustomRewardRedemptionAdd extends Condition {
		/** The broadcaster user ID for the channel you want to receive channel points custom reward redemption add notifications for. */
		broadcaster_user_id: string;
		/** Optional. Specify a reward id to only receive notifications for a specific reward. */
		reward_id?: string;
	}
	export interface ChannelPointsCustomRewardRedemptionUpdate extends Condition {
		/** The broadcaster user ID for the channel you want to receive channel points custom reward redemption update notifications for. */
		broadcaster_user_id: string;
		/** Optional. Specify a reward id to only receive notifications for a specific reward. */
		reward_id?: string;
	}
	export interface ChannelPollBegin extends Condition {
		/** The broadcaster user ID of the channel for which “poll begin” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelPollProgress extends Condition {
		/** The broadcaster user ID of the channel for which “poll progress” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelPollEnd extends Condition {
		/** The broadcaster user ID of the channel for which “poll end” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelPredictionBegin extends Condition {
		/** The broadcaster user ID of the channel for which “prediction begin” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelPredictionProgress extends Condition {
		/** The broadcaster user ID of the channel for which “prediction progress” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelPredictionLock extends Condition {
		/** The broadcaster user ID of the channel for which “prediction lock” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelPredictionEnd extends Condition {
		/** The broadcaster user ID of the channel for which “prediction end” notifications will be received. */
		broadcaster_user_id: string;
	}
	export interface ChannelSuspiciousUserUpdate extends Condition {
		/** The ID of a user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
		moderator_user_id: string;
		/** The broadcaster you want to get chat unban request notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelSuspiciousUserMessage extends Condition {
		/** The ID of a user that has permission to moderate the broadcaster’s channel and has granted your app permission to subscribe to this subscription type. */
		moderator_user_id: string;
		/** User ID of the channel to receive chat message events for. */
		broadcaster_user_id: string;
	}
	export interface ChannelVipAdd extends Condition {
		/** The User ID of the broadcaster (channel) Maximum: 1 */
		broadcaster_user_id: string;
	}
	export interface ChannelVipRemove extends Condition {
		/** The User ID of the broadcaster (channel) Maximum: 1 */
		broadcaster_user_id: string;
	}
	export interface ChannelWarningAcknowledge extends Condition {
		/** The User ID of the broadcaster. */
		broadcaster_user_id: string;
		/** The User ID of the moderator. */
		moderator_user_id: string;
	}
	export interface ChannelWarningSend extends Condition {
		/** The User ID of the broadcaster. */
		broadcaster_user_id: string;
		/** The User ID of the moderator. */
		moderator_user_id: string;
	}
	export interface ChannelCharityCampaignDonate extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when users donate to their campaign. */
		broadcaster_user_id: string;
	}
	export interface ChannelCharityCampaignStart extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when they start a charity campaign. */
		broadcaster_user_id: string;
	}
	export interface ChannelCharityCampaignProgress extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when their campaign makes progress or is updated. */
		broadcaster_user_id: string;
	}
	export interface ChannelCharityCampaignStop extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when they stop a charity campaign. */
		broadcaster_user_id: string;
	}
	export interface ConduitShardDisabled extends Condition {
		/** Your application’s client id. The provided client_id must match the client ID in the application access token. */
		client_id: string;
		/** The conduit ID to receive events for. If specified, events are sent only for this conduit. */
		conduit_id?: string;
	}
	export interface DropEntitlementGrant extends Condition {
		/** The organization ID of the organization that owns the game on the developer portal. */
		organization_id: string;
		/** The category (or game) ID of the game for which entitlement notifications will be received. */
		category_id?: string;
		/** The campaign ID for a specific campaign for which entitlement notifications will be received. */
		campaign_id?: string;
	}
	export interface ExtensionBitsTransactionCreate extends Condition {
		/** The client ID of the extension. */
		extension_client_id: string;
	}
	export interface ChannelGoalBegin extends Condition {
		/** The ID of the broadcaster to get notified about. The ID must match the `user_id` in the OAuth access token. */
		broadcaster_user_id: string;
	}
	export type ChannelGoalProgress = ChannelGoalBegin;
	export type ChannelGoalEnd = ChannelGoalBegin;
	export interface ChannelHypeTrainBegin extends Condition {
		/** The ID of the broadcaster that you want to get Hype Train begin notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelHypeTrainProgress extends Condition {
		/** The ID of the broadcaster that you want to get Hype Train progress notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelHypeTrainEnd extends Condition {
		/** The ID of the broadcaster that you want to get Hype Train end notifications for. */
		broadcaster_user_id: string;
	}
	export interface ChannelShieldModeBegin extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when they activate Shield Mode. */
		broadcaster_user_id: string;
		/** The ID of the broadcaster or one of the broadcaster’s moderators. */
		moderator_user_id: string;
	}
	export interface ChannelShieldModeEnd extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when they deactivate Shield Mode. */
		broadcaster_user_id: string;
		/** The ID of the broadcaster or one of the broadcaster’s moderators. */
		moderator_user_id: string;
	}
	export interface ChannelShoutoutCreate extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when they send a Shoutout. */
		broadcaster_user_id: string;
		/** The ID of the broadcaster that gave the Shoutout or one of the broadcaster’s moderators. */
		moderator_user_id: string;
	}
	export interface ChannelShoutoutReceive extends Condition {
		/** The ID of the broadcaster that you want to receive notifications about when they receive a Shoutout. */
		broadcaster_user_id: string;
		/** The ID of the broadcaster that received the Shoutout or one of the broadcaster’s moderators. */
		moderator_user_id: string;
	}
	export interface StreamOnline extends Condition {
		/** The broadcaster user ID you want to get stream online notifications for. */
		broadcaster_user_id: string;
	}
	export interface StreamOffline extends Condition {
		/** The broadcaster user ID you want to get stream offline notifications for. */
		broadcaster_user_id: string;
	}
	export interface UserAuthorizationGrant extends Condition {
		/** Your application’s client id. The provided `client_id` must match the client id in the application access token. */
		client_id: string;
	}
	export interface UserAuthorizationRevoke extends Condition {
		/** Your application’s client id. The provided `client_id` must match the client id in the application access token. */
		client_id: string;
	}
	export interface UserUpdate extends Condition {
		/** The user ID for the user you want update notifications for. */
		user_id: string;
	}
	export interface UserWhisperMessage extends Condition {
		/** The user_id of the person receiving whispers. */
		user_id: string;
	}
}

/** Defines the transport details that you want Twitch to use when sending you event notifications. */
export type Transport = Transport.Conduit | Transport.WebHook | Transport.WebSocket;
export namespace Transport {
	interface Base<Method extends string = "webhook" | "websocket" | "conduit"> {
		/** The transport method. */
		method: Method;
	};
	/** Defines the transport details that you want Twitch to use when sending you event notifications. */
	export interface WebHook extends Base<"webhook"> {
		/**
		 * The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. See [Processing an event](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#processing-an-event).
		 * 
		 * **NOTE**: Redirects are not followed.
		 */
		callback: string;
		/** The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. For information about how the secret is used, see [Verifying the event message](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#verifying-the-event-message). */
		secret: string;
	}
	/**
	 * @param callback The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. See [Processing an event](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#processing-an-event). **NOTE**: Redirects are not followed.
	 * @param secret The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. For information about how the secret is used, see [Verifying the event message](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#verifying-the-event-message).
	 */
	export function WebHook(callback: string, secret: string): WebHook {return {method: "webhook", callback, secret}}

	/** Defines the transport details that you want Twitch to use when sending you event notifications. */
	export interface WebSocket extends Base<"websocket"> {
		/** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message). */
		session_id: string;
	}
	/** @param session_id An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message) */
	export function WebSocket(session_id: string): WebSocket {return {method: "websocket", session_id}}
	export namespace WebSocket {
		/** Defines the transport details that you want Twitch to use when sending you event notifications. */
		export interface Connected extends WebSocket {
			/** The UTC date and time that the WebSocket connection was established. */
			connected_at: string;
		}
		/** Defines the transport details that you want Twitch to use when sending you event notifications. */
		export interface ConnectedAndDisconnected extends Connected {
			/** The UTC date and time that the WebSocket connection was lost. */
			disconnected_at: string;
		}
	}

	/** Defines the transport details that you want Twitch to use when sending you event notifications. */
	export interface Conduit extends Base<"conduit"> {
		/** An ID that identifies the conduit to send notifications to. When you create a conduit, the server returns the conduit ID. */
		conduit_id: string;
	}
	/** @param conduit_id An ID that identifies the conduit to send notifications to. When you create a conduit, the server returns the conduit ID. */
	export function Conduit(conduit_id: string): Conduit {return {method: "conduit", conduit_id}}
}

/** Subscription-related parameters */
export type Subscription = Subscription.AutomodMessageHold | Subscription.AutomodMessageHoldV2 | Subscription.AutomodMessageUpdate | Subscription.AutomodMessageUpdateV2 | Subscription.AutomodSettingsUpdate | Subscription.AutomodTermsUpdate | Subscription.ChannelAdBreakBegin | Subscription.ChannelBan | Subscription.ChannelBitsUse | Subscription.ChannelCharityCampaignDonate | Subscription.ChannelCharityCampaignProgress | Subscription.ChannelCharityCampaignStart | Subscription.ChannelCharityCampaignStop | Subscription.ChannelChatClear | Subscription.ChannelChatClearUserMessages | Subscription.ChannelChatMessage | Subscription.ChannelChatMessageDelete | Subscription.ChannelChatNotification | Subscription.ChannelChatSettingsUpdate | Subscription.ChannelChatUserMessageHold | Subscription.ChannelChatUserMessageUpdate | Subscription.ChannelCheer | Subscription.ChannelFollow | Subscription.ChannelGoalBegin | Subscription.ChannelGoalEnd | Subscription.ChannelGoalProgress | Subscription.ChannelGuestStarGuestUpdate | Subscription.ChannelGuestStarSessionBegin | Subscription.ChannelGuestStarSessionEnd | Subscription.ChannelGuestStarSettingsUpdate | Subscription.ChannelHypeTrainBegin | Subscription.ChannelHypeTrainEnd | Subscription.ChannelHypeTrainProgress | Subscription.ChannelModerate | Subscription.ChannelModerateV2 | Subscription.ChannelModeratorAdd | Subscription.ChannelModeratorRemove | Subscription.ChannelPointsAutomaticRewardRedemptionAdd | Subscription.ChannelPointsAutomaticRewardRedemptionAddV2 | Subscription.ChannelPointsCustomRewardAdd | Subscription.ChannelPointsCustomRewardRedemptionAdd | Subscription.ChannelPointsCustomRewardRedemptionUpdate | Subscription.ChannelPointsCustomRewardRemove | Subscription.ChannelPointsCustomRewardUpdate | Subscription.ChannelPollBegin | Subscription.ChannelPollEnd | Subscription.ChannelPollProgress | Subscription.ChannelPredictionBegin | Subscription.ChannelPredictionEnd | Subscription.ChannelPredictionLock | Subscription.ChannelPredictionProgress | Subscription.ChannelRaid | Subscription.ChannelSharedChatSessionBegin | Subscription.ChannelSharedChatSessionEnd | Subscription.ChannelSharedChatSessionUpdate | Subscription.ChannelShieldModeBegin | Subscription.ChannelShieldModeEnd | Subscription.ChannelShoutoutCreate | Subscription.ChannelShoutoutReceive | Subscription.ChannelSubscribe | Subscription.ChannelSubscriptionEnd | Subscription.ChannelSubscriptionGift | Subscription.ChannelSubscriptionMessage | Subscription.ChannelSuspiciousUserMessage | Subscription.ChannelSuspiciousUserUpdate | Subscription.ChannelUnban | Subscription.ChannelUnbanRequestCreate | Subscription.ChannelUnbanRequestResolve | Subscription.ChannelUpdate | Subscription.ChannelVipAdd | Subscription.ChannelVipRemove | Subscription.ChannelWarningAcknowledge | Subscription.ChannelWarningSend | Subscription.ConduitShardDisabled | Subscription.DropEntitlementGrant | Subscription.ExtensionBitsTransactionCreate | Subscription.StreamOffline | Subscription.StreamOnline | Subscription.UserAuthorizationGrant | Subscription.UserAuthorizationRevoke | Subscription.UserUpdate | Subscription.UserWhisperMessage;
export namespace Subscription {
	type Base<Type extends string = string, Version_ extends Version = Version, Condition_ extends Condition = Condition, Transport_ extends Transport = Transport> = {
		/** The subscription type name. */
		type: Type;
		/** The subscription version. */
		version: Version_;
		/** Subscription-specific parameters. */
		condition: Condition_;
		/** Transport-specific parameters. */
		transport: Transport_;
	};
	/** 
	 * The `automod.message.hold` subscription type notifies a user if a message was caught by automod for review. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold)
	 * 
	 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.
	 * 
	 * The moderator must be a moderator or broadcaster for the specified broadcaster.
	 */
	export type AutomodMessageHold = Base<"automod.message.hold", "1", Condition.AutomodMessageHold, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the broadcaster (channel).
	 */
	export function AutomodMessageHold(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): AutomodMessageHold {
		if (Connection.is(connection)) return { transport: connection.transport, type: "automod.message.hold", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "automod.message.hold", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `automod.message.hold` subscription type notifies a user if a message was caught by automod for review. Only public blocked terms trigger notifications, not private ones. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold-v2)
	 * 
	 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.
	 * 
	 * The moderator must be a moderator or broadcaster for the specified broadcaster.
	*/
	export type AutomodMessageHoldV2 = Base<"automod.message.hold", "2", Condition.AutomodMessageHold, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the broadcaster (channel).
	 */
	export function AutomodMessageHoldV2(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): AutomodMessageHoldV2 {
		if (Connection.is(connection)) return { transport: connection.transport, type: "automod.message.hold", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "automod.message.hold", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `automod.message.update` subscription type sends notification when a message in the automod queue has its status changed. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate)
	 * 
	 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.
	 * 
	 * The moderator must be a moderator or broadcaster for the specified broadcaster.
	*/
	export type AutomodMessageUpdate = Base<"automod.message.update", "1", Condition.AutomodMessageUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the broadcaster (channel). Maximum: 1.
	 */
	export function AutomodMessageUpdate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): AutomodMessageUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "automod.message.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "automod.message.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `automod.message.update` subscription type sends notification when a message in the automod queue has its status changed. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate-v2)
	 * 
	 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.
	 * 
	 * The moderator must be a moderator or broadcaster for the specified broadcaster.
	*/
	export type AutomodMessageUpdateV2 = Base<"automod.message.update", "2", Condition.AutomodMessageUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the broadcaster (channel). Maximum: 1.
	 */
	export function AutomodMessageUpdateV2(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): AutomodMessageUpdateV2 {
		if (Connection.is(connection)) return { transport: connection.transport, type: "automod.message.update", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "automod.message.update", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `automod.settings.update` subscription type sends a notification when a broadcaster’s automod settings are updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodsettingsupdate)
	 * 
	 * Requires a user access token that includes the `moderator:read:automod_settings` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:read:automod_settings` scope for the moderator.
	 * 
	 * The moderator must be a moderator or broadcaster for the specified broadcaster.
	*/
	export type AutomodSettingsUpdate = Base<"automod.settings.update", "1", Condition.AutomodSettingsUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the broadcaster (channel). Maximum: 1.
	 */
	export function AutomodSettingsUpdate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): AutomodSettingsUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "automod.settings.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "automod.settings.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `automod.terms.update` subscription type sends a notification when a broadcaster’s automod settings are updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate)
	 * 
	 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.
	 * 
	 * The moderator must be a moderator or broadcaster for the specified broadcaster.
	*/
	export type AutomodTermsUpdate = Base<"automod.terms.update", "1", Condition.AutomodTermsUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the broadcaster (channel).
	 */
	export function AutomodTermsUpdate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): AutomodTermsUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "automod.terms.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "automod.terms.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `channel.bits.use` subscription type sends a notification when a broadcaster’s automod settings are updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse)
	 * 
	 * This event is designed to be an all-purpose event for when Bits are used in a channel and might be updated in the future as more Twitch features use Bits.
	 * 
	 * Currently, this event will be sent when a user:
	 * 1. Cheers in a channel
	 * 2. Uses a Power-up
	 * 	- Will not emit when a streamer uses a Power-up for free in their own channel.
	 * 
	 * Bits transactions via Twitch Extensions are not included in this subscription type.
	 * 
	 * Requires a user access token that includes the `bits:read` scope.
	*/
	export type ChannelBitsUse = Base<"channel.bits.use", "1", Condition.ChannelBitsUse, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The user ID of the channel broadcaster. Maximum: 1.
	 */
	export function ChannelBitsUse(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelBitsUse {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.bits.use", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.bits.use", version: "1", condition: { broadcaster_user_id } };
	}

	/** 
	 * The `channel.update` subscription type sends notifications when a broadcaster updates the category, title, [content classification labels](https://safety.twitch.tv/s/article/Content-Classification-Guidelines), or broadcast language for their channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate)
	 * 
	 * No authorization required.
	 */
	export type ChannelUpdate = Base<"channel.update", "2", Condition.ChannelUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get updates for.
	 */
	export function ChannelUpdate(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.update", version: "2", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.update", version: "2", condition: { broadcaster_user_id } };
	}

	/** 
	 * The `channel.follow` subscription type sends a notification when a specified channel receives a follow. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow)
	 * 
	 * Must have `moderator:read:followers` scope.
	 */
	export type ChannelFollow = Base<"channel.follow", "2", Condition.ChannelFollow, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get follow notifications for.
	 */
	export function ChannelFollow(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelFollow {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.follow", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.follow", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/** 
	 * The `channel.ad_break.begin` subscription type sends a notification when a user runs a midroll commercial break, either manually or automatically via ads manager. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin)
	 * 
	 * Must have `channel:read:ads` scope.
	 */
	export type ChannelAdBreakBegin = Base<"channel.ad_break.begin", "1", Condition.ChannelAdBreakBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_id The ID of the broadcaster that you want to get Channel Ad Break begin notifications for. Maximum: 1
	 */
	export function ChannelAdBreakBegin(connection: Connection | {transport: Transport}, broadcaster_id: string): ChannelAdBreakBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.ad_break.begin", version: "1", condition: { broadcaster_id } };
		else return { transport: connection.transport, type: "channel.ad_break.begin", version: "1", condition: { broadcaster_id } };
	}

	/** 
	 * The `channel.chat.clear` subscription type sends a notification when a moderator or bot clears all messages from the chat room. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear)
	 * 
	 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
	 */
	export type ChannelChatClear = Base<"channel.chat.clear", "1", Condition.ChannelChatClear, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat clear events for.
	 */
	export function ChannelChatClear(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatClear {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.clear", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.clear", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/** 
	 * The `channel.chat.clear_user_messages` subscription type sends a notification when a moderator or bot clears all messages for a specific user. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear)
	 * 
	 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
	 */
	export type ChannelChatClearUserMessages = Base<"channel.chat.clear_user_messages", "1", Condition.ChannelChatClearUserMessages, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat clear user messages events for.
	 */
	export function ChannelChatClearUserMessages(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatClearUserMessages {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.clear_user_messages", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.clear_user_messages", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * The `channel.chat.message` subscription type sends a notification when any user sends a message to a channel’s chat room. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage)
	 * 
	 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
	 */
	export type ChannelChatMessage = Base<"channel.chat.message", "1", Condition.ChannelChatMessage, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id The User ID of the channel to receive chat message events for.
	 */
	export function ChannelChatMessage(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatMessage {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.message", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.message", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * The `channel.chat.message_delete` subscription type sends a notification when a moderator removes a specific message. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete)
	 * 
	 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
	 */
	export type ChannelChatMessageDelete = Base<"channel.chat.message_delete", "1", Condition.ChannelChatMessageDelete, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat message delete events for.
	 */
	export function ChannelChatMessageDelete(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatMessageDelete {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.message_delete", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.message_delete", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * The `channel.chat.notification` subscription type sends a notification when an event that appears in chat occurs, such as someone subscribing to the channel or a subscription is gifted. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification)
	 * 
	 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
	 */
	export type ChannelChatNotification = Base<"channel.chat.notification", "1", Condition.ChannelChatNotification, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat notification events for.
	 */
	export function ChannelChatNotification(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatNotification {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.notification", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.notification", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * This event sends a notification when a broadcaster’s chat settings are updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate)
	 * 
	 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status.
	 */
	export type ChannelChatSettingsUpdate = Base<"channel.chat_settings.update", "1", Condition.ChannelChatSettingsUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat settings update events for.
	 */
	export function ChannelChatSettingsUpdate(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatSettingsUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat_settings.update", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat_settings.update", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * The `channel.chat.user_message_hold` subscription type notifies a user if their message is caught by automod. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold)
	 * 
	 * Requires `user:read:chat` scope from chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user.
	 */
	export type ChannelChatUserMessageHold = Base<"channel.chat.user_message_hold", "1", Condition.ChannelChatUserMessageHold, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat message events for.
	 */
	export function ChannelChatUserMessageHold(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatUserMessageHold {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.user_message_hold", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.user_message_hold", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * The `channel.chat.user_message_update` subscription type notifies a user if their message’s automod status is updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_update)
	 * 
	 * Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from the chatting user.
	 */
	export type ChannelChatUserMessageUpdate = Base<"channel.chat.user_message_update", "1", Condition.ChannelChatUserMessageUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `user_id` — The user ID to read chat as.
	 * @param broadcaster_user_id User ID of the channel to receive chat message events for.
	 */
	export function ChannelChatUserMessageUpdate(connection: Connection | {transport: Transport, user_id: string}, broadcaster_user_id: string): ChannelChatUserMessageUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.chat.user_message_update", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.chat.user_message_update", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
	}

	/**
	 * The `channel.shared_chat.begin` subscription type sends a notification when a channel becomes active in an active shared chat session. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatbegin)
	 * 
	 * No authorization required.
	 */
	export type ChannelSharedChatSessionBegin = Base<"channel.shared_chat.begin", "1", Condition.ChannelSharedChatSessionBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The User ID of the channel to receive shared chat session begin events for.
	 */
	export function ChannelSharedChatSessionBegin(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSharedChatSessionBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shared_chat.begin", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.shared_chat.begin", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.shared_chat.update` subscription type sends a notification when the active shared chat session the channel is in changes. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatupdate)
	 * 
	 * No authorization required.
	 */
	export type ChannelSharedChatSessionUpdate = Base<"channel.shared_chat.update", "1", Condition.ChannelSharedChatSessionUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The User ID of the channel to receive shared chat session update events for.
	 */
	export function ChannelSharedChatSessionUpdate(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSharedChatSessionUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shared_chat.update", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.shared_chat.update", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.shared_chat.end` subscription type sends a notification when a channel leaves a shared chat session or the session ends. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend)
	 * 
	 * No authorization required.
	 */
	export type ChannelSharedChatSessionEnd = Base<"channel.shared_chat.end", "1", Condition.ChannelSharedChatSessionEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The User ID of the channel to receive shared chat session end events for.
	 */
	export function ChannelSharedChatSessionEnd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSharedChatSessionEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shared_chat.end", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.shared_chat.end", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.subscribe` subscription type sends a notification when a specified channel receives a subscriber. This does not include resubscribes. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe)
	 * 
	 * Must have `channel:read:subscriptions` scope.
	 */
	export type ChannelSubscribe = Base<"channel.subscribe", "1", Condition.ChannelSubscribe, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get subscribe notifications for.
	 */
	export function ChannelSubscribe(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSubscribe {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.subscribe", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.subscribe", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.subscription.end` subscription type sends a notification when a subscription to the specified channel expires. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend)
	 * 
	 * Must have `channel:read:subscriptions` scope.
	 */
	export type ChannelSubscriptionEnd = Base<"channel.subscription.end", "1", Condition.ChannelSubscriptionEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get subscription end notifications for.
	 */
	export function ChannelSubscriptionEnd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSubscriptionEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.subscription.end", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.subscription.end", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.subscription.gift` subscription type sends a notification when a user gives one or more gifted subscriptions in a channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift)
	 * 
	 * Must have `channel:read:subscriptions` scope.
	 */
	export type ChannelSubscriptionGift = Base<"channel.subscription.gift", "1", Condition.ChannelSubscriptionGift, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get subscription gift notifications for.
	 */
	export function ChannelSubscriptionGift(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSubscriptionGift {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.subscription.gift", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.subscription.gift", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.subscription.message` subscription type sends a notification when a user sends a resubscription chat message in a specific channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage)
	 * 
	 * Must have `channel:read:subscriptions` scope.
	 */
	export type ChannelSubscriptionMessage = Base<"channel.subscription.message", "1", Condition.ChannelSubscriptionMessage, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get resubscription chat message notifications for.
	 */
	export function ChannelSubscriptionMessage(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelSubscriptionMessage {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.subscription.message", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.subscription.message", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.cheer` subscription type sends a notification when a user cheers on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer)
	 * 
	 * Must have `bits:read` scope.
	 */
	export type ChannelCheer = Base<"channel.cheer", "1", Condition.ChannelCheer, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get cheer notifications for.
	 */
	export function ChannelCheer(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelCheer {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.cheer", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.cheer", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.raid` subscription type sends a notification when a broadcaster raids another broadcaster’s channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid)
	 * 
	 * No authorization required.
	 */
	export type ChannelRaid = Base<"channel.raid", "1", Condition.ChannelRaid, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param condition The condition of this subscription type.
	 */
	export function ChannelRaid(connection: Connection | {transport: Transport}, condition: Condition.ChannelRaid): ChannelRaid {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.raid", version: "1", condition };
		else return { transport: connection.transport, type: "channel.raid", version: "1", condition };
	}

	/**
	 * The `channel.ban` subscription type sends a notification when a viewer is timed out or banned from the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban)
	 * 
	 * Must have `channel:moderate` scope.
	 */
	export type ChannelBan = Base<"channel.ban", "1", Condition.ChannelBan, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get ban notifications for.
	 */
	export function ChannelBan(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelBan {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.ban", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.ban", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.unban` subscription type sends a notification when a viewer is unbanned from the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban)
	 * 
	 * Must have `channel:moderate` scope.
	 */
	export type ChannelUnban = Base<"channel.unban", "1", Condition.ChannelUnban, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get unban notifications for.
	 */
	export function ChannelUnban(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelUnban {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.unban", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.unban", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.unban_request.create` subscription type sends a notification when a user creates an unban request. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate)
	 * 
	 * Must have `moderator:read:unban_requests` or `moderator:manage:unban_requests` scope.
	 */
	export type ChannelUnbanRequestCreate = Base<"channel.unban_request.create", "1", Condition.ChannelUnbanRequestCreate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The ID of the broadcaster you want to get chat unban request notifications for. Maximum: 1.
	 */
	export function ChannelUnbanRequestCreate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelUnbanRequestCreate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.unban_request.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.unban_request.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.unban_request.resolve` subscription type sends a notification when an unban request has been resolved. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve)
	 * 
	 * Must have `moderator:read:unban_requests` or `moderator:manage:unban_requests` scope.
	 * 
	 * If you use webhooks, the user in `moderator_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the [Authentication section](/docs/authentication/) of Create EventSub Subscription.
	 * 
	 * If you use WebSockets, the ID in `moderator_id` must match the user ID in the user access token.
	 */
	export type ChannelUnbanRequestResolve = Base<"channel.unban_request.resolve", "1", Condition.ChannelUnbanRequestResolve, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The ID of the broadcaster you want to get unban request resolution notifications for. Maximum: 1.
	 */
	export function ChannelUnbanRequestResolve(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelUnbanRequestResolve {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.unban_request.resolve", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.unban_request.resolve", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.moderate` subscription type sends a notification when a moderator performs a moderation action in a channel. Some of these actions affect chatters in other channels during Shared Chat. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate)
	 * 
	 * Must have all of the following scopes:
	 * - `moderator:read:blocked_terms` OR `moderator:manage:blocked_terms`
	 * - `moderator:read:chat_settings` OR `moderator:manage:chat_settings`
	 * - `moderator:read:unban_requests` OR `moderator:manage:unban_requests`
	 * - `moderator:read:banned_users` OR `moderator:manage:banned_users`
	 * - `moderator:read:chat_messages` OR `moderator:manage:chat_messages`
	 * - `moderator:read:moderators`
	 * - `moderator:read:vips`
	 */
	export type ChannelModerate = Base<"channel.moderate", "1", Condition.ChannelModerate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The user ID of the broadcaster.
	 */
	export function ChannelModerate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelModerate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.moderate", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.moderate", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.moderate` subscription type sends a notification when a moderator performs a moderation action in a channel. Some of these actions affect chatters in other channels during Shared Chat. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate)
	 * 
	 * This is the second version of `channel.moderate` with warnings added.
	 * 
	 * Must have all of the following scopes:
	 * - `moderator:read:blocked_terms` OR `moderator:manage:blocked_terms`
	 * - `moderator:read:chat_settings` OR `moderator:manage:chat_settings`
	 * - `moderator:read:unban_requests` OR `moderator:manage:unban_requests`
	 * - `moderator:read:banned_users` OR `moderator:manage:banned_users`
	 * - `moderator:read:chat_messages` OR `moderator:manage:chat_messages`
	 * - `moderator:read:warnings` OR `moderator:manage:warnings`
	 * - `moderator:read:moderators`
	 * - `moderator:read:vips`
	 */
	export type ChannelModerateV2 = Base<"channel.moderate", "2", Condition.ChannelModerate, Transport>;

	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The user ID of the broadcaster.
	 */
	export function ChannelModerateV2(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelModerateV2 {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.moderate", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.moderate", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.moderator.add` subscription type sends a notification when a user is given moderator privileges on a specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatoradd)
	 * 
	 * Must have `moderation:read` scope.
	 */
	export type ChannelModeratorAdd = Base<"channel.moderator.add", "1", Condition.ChannelModeratorAdd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get moderator addition notifications for.
	 */
	export function ChannelModeratorAdd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelModeratorAdd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.moderator.add", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.moderator.add", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.moderator.remove` subscription type sends a notification when a user has moderator privileges removed on a specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove)
	 * 
	 * Must have `moderation:read` scope.
	 */
	export type ChannelModeratorRemove = Base<"channel.moderator.remove", "1", Condition.ChannelModeratorRemove, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to get moderator removal notifications for.
	 */
	export function ChannelModeratorRemove(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelModeratorRemove {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.moderator.remove", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.moderator.remove", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.guest_star_session.begin` subscription type sends a notification when the host begins a new Guest Star session. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin)
	 * 
	 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
	 */
	export type ChannelGuestStarSessionBegin = Base<"channel.guest_star_session.begin", "beta", Condition.ChannelGuestStarSessionBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
	 */
	export function ChannelGuestStarSessionBegin(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelGuestStarSessionBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.guest_star_session.begin", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.guest_star_session.begin", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.guest_star_session.end` subscription type sends a notification when a running Guest Star session is ended by the host, or automatically by the system. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionend)
	 * 
	 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
	 */
	export type ChannelGuestStarSessionEnd = Base<"channel.guest_star_session.end", "beta", Condition.ChannelGuestStarSessionEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
	 */
	export function ChannelGuestStarSessionEnd(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelGuestStarSessionEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.guest_star_session.end", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.guest_star_session.end", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.guest_star_guest.update` subscription type sends a notification when a guest or a slot is updated in an active Guest Star session. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate)
	 * 
	 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
	 */
	export type ChannelGuestStarGuestUpdate = Base<"channel.guest_star_guest.update", "beta", Condition.ChannelGuestStarGuestUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
	 */
	export function ChannelGuestStarGuestUpdate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelGuestStarGuestUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.guest_star_guest.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.guest_star_guest.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.guest_star_settings.update` subscription type sends a notification when the host preferences for Guest Star have been updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_settingsupdate)
	 * 
	 * Must have `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star` scope.
	 */
	export type ChannelGuestStarSettingsUpdate = Base<"channel.guest_star_settings.update", "beta", Condition.ChannelGuestStarSettingsUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
	 */
	export function ChannelGuestStarSettingsUpdate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelGuestStarSettingsUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.guest_star_settings.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.guest_star_settings.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.channel_points_automatic_reward_redemption.add` subscription type sends a notification when a viewer has redeemed an automatic channel points reward on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsAutomaticRewardRedemptionAdd = Base<"channel.channel_points_automatic_reward_redemption.add", "1", Condition.ChannelPointsAutomaticRewardRedemptionAdd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points reward add notifications for.
	 */
	export function ChannelPointsAutomaticRewardRedemptionAdd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPointsAutomaticRewardRedemptionAdd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.channel_points_automatic_reward_redemption.add` subscription type sends a notification when a viewer has redeemed an automatic channel points reward on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsAutomaticRewardRedemptionAddV2 = Base<"channel.channel_points_automatic_reward_redemption.add", "2", Condition.ChannelPointsAutomaticRewardRedemptionAdd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points reward add notifications for.
	 */
	export function ChannelPointsAutomaticRewardRedemptionAddV2(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPointsAutomaticRewardRedemptionAddV2 {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "2", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "2", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.channel_points_custom_reward.add` subscription type sends a notification when a custom channel points reward has been created for the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardadd)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsCustomRewardAdd = Base<"channel.channel_points_custom_reward.add", "1", Condition.ChannelPointsCustomRewardAdd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward add notifications for.
	 */
	export function ChannelPointsCustomRewardAdd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPointsCustomRewardAdd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_custom_reward.add", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.channel_points_custom_reward.add", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.channel_points_custom_reward.update` subscription type sends a notification when a custom channel points reward has been updated for the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsCustomRewardUpdate = Base<"channel.channel_points_custom_reward.update", "1", Condition.ChannelPointsCustomRewardUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward update notifications for.
	 * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
	 */
	export function ChannelPointsCustomRewardUpdate(connection: Connection | {transport: Transport}, broadcaster_user_id: string, reward_id?: string): ChannelPointsCustomRewardUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_custom_reward.update", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.channel_points_custom_reward.update", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.channel_points_custom_reward.remove` subscription type sends a notification when a custom channel points reward has been removed from the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsCustomRewardRemove = Base<"channel.channel_points_custom_reward.remove", "1", Condition.ChannelPointsCustomRewardRemove, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward remove notifications for.
	 * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
	 */
	export function ChannelPointsCustomRewardRemove(connection: Connection | {transport: Transport}, broadcaster_user_id: string, reward_id?: string): ChannelPointsCustomRewardRemove {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_custom_reward.remove", version: "1", condition: { broadcaster_user_id, reward_id } };
		else return { transport: connection.transport, type: "channel.channel_points_custom_reward.remove", version: "1", condition: { broadcaster_user_id, reward_id } };
	}

	/**
	 * The `channel.channel_points_custom_reward_redemption.add` subscription type sends a notification when a viewer has redeemed a custom channel points reward on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsCustomRewardRedemptionAdd = Base<"channel.channel_points_custom_reward_redemption.add", "1", Condition.ChannelPointsCustomRewardRedemptionAdd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward redemption add notifications for.
	 * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
	 */
	export function ChannelPointsCustomRewardRedemptionAdd(connection: Connection | {transport: Transport}, broadcaster_user_id: string, reward_id?: string): ChannelPointsCustomRewardRedemptionAdd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition: { broadcaster_user_id, reward_id } };
		else return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition: { broadcaster_user_id, reward_id } };
	}

	/**
	 * The `channel.channel_points_custom_reward_redemption.update` subscription type sends a notification when a redemption of a channel points custom reward has been updated for the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionupdate)
	 * 
	 * Must have `channel:read:redemptions` or `channel:manage:redemptions` scope.
	 */
	export type ChannelPointsCustomRewardRedemptionUpdate = Base<"channel.channel_points_custom_reward_redemption.update", "1", Condition.ChannelPointsCustomRewardRedemptionUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward redemption update notifications for.
	 * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
	 */
	export function ChannelPointsCustomRewardRedemptionUpdate(connection: Connection | {transport: Transport}, broadcaster_user_id: string, reward_id?: string): ChannelPointsCustomRewardRedemptionUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.update", version: "1", condition: { broadcaster_user_id, reward_id } };
		else return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.update", version: "1", condition: { broadcaster_user_id, reward_id } };
	}

	/**
	 * The `channel.poll.begin` subscription type sends a notification when a poll begins on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin)
	 * 
	 * Must have `channel:read:polls` or `channel:manage:polls` scope.
	 */
	export type ChannelPollBegin = Base<"channel.poll.begin", "1", Condition.ChannelPollBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “poll begin” notifications will be received.
	 */
	export function ChannelPollBegin(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPollBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.poll.begin", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.poll.begin", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.poll.progress` subscription type sends a notification when users respond to a poll on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress)
	 * 
	 * Must have `channel:read:polls` or `channel:manage:polls` scope.
	 */
	export type ChannelPollProgress = Base<"channel.poll.progress", "1", Condition.ChannelPollProgress, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “poll progress” notifications will be received.
	 */
	export function ChannelPollProgress(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPollProgress {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.poll.progress", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.poll.progress", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.poll.end` subscription type sends a notification when a poll ends on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend)
	 * 
	 * Must have `channel:read:polls` or `channel:manage:polls` scope.
	 */
	export type ChannelPollEnd = Base<"channel.poll.end", "1", Condition.ChannelPollEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “poll end” notifications will be received.
	 */
	export function ChannelPollEnd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPollEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.poll.end", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.poll.end", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.prediction.begin` subscription type sends a notification when a Prediction begins on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin)
	 * 
	 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
	 */
	export type ChannelPredictionBegin = Base<"channel.prediction.begin", "1", Condition.ChannelPredictionBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction begin” notifications will be received.
	 */
	export function ChannelPredictionBegin(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPredictionBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.prediction.begin", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.prediction.begin", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.prediction.progress` subscription type sends a notification when users participate in a Prediction on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress)
	 * 
	 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
	 */
	export type ChannelPredictionProgress = Base<"channel.prediction.progress", "1", Condition.ChannelPredictionProgress, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction progress” notifications will be received.
	 */
	export function ChannelPredictionProgress(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPredictionProgress {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.prediction.progress", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.prediction.progress", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.prediction.lock` subscription type sends a notification when a Prediction is locked on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionlock)
	 * 
	 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
	 */
	export type ChannelPredictionLock = Base<"channel.prediction.lock", "1", Condition.ChannelPredictionLock, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction lock” notifications will be received.
	 */
	export function ChannelPredictionLock(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPredictionLock {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.prediction.lock", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.prediction.lock", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.prediction.end` subscription type sends a notification when a Prediction ends on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionend)
	 * 
	 * Must have `channel:read:predictions` or `channel:manage:predictions` scope.
	 */
	export type ChannelPredictionEnd = Base<"channel.prediction.end", "1", Condition.ChannelPredictionEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction end” notifications will be received.
	 */
	export function ChannelPredictionEnd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelPredictionEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.prediction.end", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.prediction.end", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.suspicious_user.update` subscription type sends a notification when a suspicious user has been updated. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate)
	 * 
	 * Requires the `moderator:read:suspicious_users` scope. If you use webhooks, the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the [Authentication section](/docs/authentication/) of Create EventSub Subscription.
	 * 
	 * If you use WebSockets, the ID in `moderator_user_id` must match the user ID in the user access token.
	 */
	export type ChannelSuspiciousUserUpdate = Base<"channel.suspicious_user.update", "1", Condition.ChannelSuspiciousUserUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the channel to receive chat unban request notifications for.
	 */
	export function ChannelSuspiciousUserUpdate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelSuspiciousUserUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.suspicious_user.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.suspicious_user.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.suspicious_user.message` subscription type sends a notification when a chat message has been sent from a suspicious user. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage)
	 * 
	 * Requires the `moderator:read:suspicious_users` scope. If you use webhooks, the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the [Authentication section](/docs/authentication/) of Create EventSub Subscription.
	 * 
	 * If you use WebSockets, the ID in `moderator_user_id` must match the user ID in the user access token.
	 */
	export type ChannelSuspiciousUserMessage = Base<"channel.suspicious_user.message", "1", Condition.ChannelSuspiciousUserMessage, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id User ID of the channel to receive chat message events for.
	 */
	export function ChannelSuspiciousUserMessage(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelSuspiciousUserMessage {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.suspicious_user.message", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.suspicious_user.message", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.vip.add` subscription type sends a notification when a VIP is added to the channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd)
	 * 
	 * Must have `channel:read:vips` or `channel:manage:vips` scope.
	 */
	export type ChannelVipAdd = Base<"channel.vip.add", "1", Condition.ChannelVipAdd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The User ID of the broadcaster (channel) Maximum: 1
	 */
	export function ChannelVipAdd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelVipAdd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.vip.add", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.vip.add", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.vip.remove` subscription type sends a notification when a VIP is removed from the channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipremove)
	 * 
	 * Must have `channel:read:vips` or `channel:manage:vips` scope.
	 */
	export type ChannelVipRemove = Base<"channel.vip.remove", "1", Condition.ChannelVipRemove, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The User ID of the broadcaster (channel) Maximum: 1
	 */
	export function ChannelVipRemove(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelVipRemove {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.vip.remove", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.vip.remove", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.warning.acknowledge` subscription type sends a notification when a warning is acknowledged by a user. Broadcasters and moderators can see the warning’s details. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge)
	 * 
	 * Must have the `moderator:read:warnings` or `moderator:manage:warnings` scope.
	 */
	export type ChannelWarningAcknowledge = Base<"channel.warning.acknowledge", "1", Condition.ChannelWarningAcknowledge, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The User ID of the broadcaster.
	 */
	export function ChannelWarningAcknowledge(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelWarningAcknowledge {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.warning.acknowledge", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.warning.acknowledge", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `channel.warning.send` subscription type sends a notification when a warning is sent to a user. Broadcasters and moderators can see the warning’s details. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend)
	 * 
	 * Must have the `moderator:read:warnings` or `moderator:manage:warnings` scope.
	 */
	export type ChannelWarningSend = Base<"channel.warning.send", "1", Condition.ChannelWarningSend, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The User ID of the broadcaster.
	 */
	export function ChannelWarningSend(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelWarningSend {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.warning.send", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.warning.send", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * Sends a notification when a user donates to the broadcaster’s charity campaign. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaigndonate)
	 * 
	 * Requires the **channel:read:charity** scope.
	 */
	export type ChannelCharityCampaignDonate = Base<"channel.charity_campaign.donate", "1", Condition.ChannelCharityCampaignDonate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster whose charity campaign donations you want to receive notifications for.
	 */
	export function ChannelCharityCampaignDonate(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelCharityCampaignDonate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.charity_campaign.donate", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.charity_campaign.donate", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * Sends a notification when the broadcaster starts a charity campaign. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstart)
	 * 
	 * It’s possible to receive this event after the [Progress](#channelcharity_campaignprogress) event.
	 * 
	 * Requires the **channel:read:charity** scope.
	 */
	export type ChannelCharityCampaignStart = Base<"channel.charity_campaign.start", "1", Condition.ChannelCharityCampaignStart, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster whose charity campaign start events you want to receive notifications for.
	 */
	export function ChannelCharityCampaignStart(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelCharityCampaignStart {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.charity_campaign.start", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.charity_campaign.start", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * Sends notifications when progress is made towards the campaign’s goal or when the broadcaster changes the fundraising goal. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignprogress)
	 * 
	 * It’s possible to receive this event before the [Start](#channelcharity_campaignstart) event.
	 * 
	 * To get donation information, subscribe to the [channel.charity_campaign.donate](#channelcharity_campaigndonate) event.
	 * 
	 * Requires the **channel:read:charity** scope.
	 */
	export type ChannelCharityCampaignProgress = Base<"channel.charity_campaign.progress", "1", Condition.ChannelCharityCampaignProgress, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster whose charity campaign progress events you want to receive notifications for.
	 */
	export function ChannelCharityCampaignProgress(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelCharityCampaignProgress {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.charity_campaign.progress", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.charity_campaign.progress", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * Sends a notification when the broadcaster stops a charity campaign. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop)
	 * 
	 * Requires the **channel:read:charity** scope.
	 */
	export type ChannelCharityCampaignStop = Base<"channel.charity_campaign.stop", "1", Condition.ChannelCharityCampaignStop, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster whose charity campaign stop events you want to receive notifications for.
	 */
	export function ChannelCharityCampaignStop(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelCharityCampaignStop {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.charity_campaign.stop", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.charity_campaign.stop", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `conduit.shard.disabled` subscription type sends a notification when EventSub disables a shard due to the status of the underlying transport changing. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled)
	 * 
	 * App access token where the client ID matches the client ID in the condition. If `conduit_id` is specified, the client must be the owner of the conduit.
	 */
	export type ConduitShardDisabled = Base<"conduit.shard.disabled", "1", Condition.ConduitShardDisabled, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `client_id` gets from `authorization.client_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `client_id` — Your application’s client id. The provided client_id must match the client ID in the application access token.
	 * @param conduit_id Optional. The conduit ID to receive events for. If omitted, events for all of this client’s conduits are sent.
	 */
	export function ConduitShardDisabled(connection: Connection | {transport: Transport, client_id: string}, conduit_id?: string): ConduitShardDisabled {
		if (Connection.is(connection)) return { transport: connection.transport, type: "conduit.shard.disabled", version: "1", condition: { client_id: connection.authorization.client_id, conduit_id } };
		else return { transport: connection.transport, type: "conduit.shard.disabled", version: "1", condition: { client_id: connection.client_id, conduit_id } };
	}

	/**
	 * The `drop.entitlement.grant` subscription type sends a notification when an entitlement for a Drop is granted to a user. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant)
	 * 
	 * **NOTE**: This subscription type is only supported by webhooks, and cannot be used with WebSockets.
	 * 
	 * App access token required. The client ID associated with the access token must be owned by a user who is part of the specified organization.
	 */
	export type DropEntitlementGrant = Base<"drop.entitlement.grant", "1", Condition.DropEntitlementGrant, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param organization_id The organization ID of the organization that owns the game on the developer portal.
	 * @param category_id Optional. The category (or game) ID of the game for which entitlement notifications will be received.
	 * @param campaign_id Optional. The campaign ID for a specific campaign for which entitlement notifications will be received.
	 */
	export function DropEntitlementGrant(connection: Connection | {transport: Transport}, organization_id: string, category_id?: string, campaign_id?: string): DropEntitlementGrant {
		if (Connection.is(connection)) return { transport: connection.transport, type: "drop.entitlement.grant", version: "1", condition: { organization_id, category_id, campaign_id } };
		else return { transport: connection.transport, type: "drop.entitlement.grant", version: "1", condition: { organization_id, category_id, campaign_id } };
	}

	/**
	 * The `extension.bits_transaction.create` subscription type sends a notification when a new transaction is created for a Twitch Extension. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate)
	 * 
	 * **NOTE**: This subscription type is only supported by webhooks, and cannot be used with WebSockets.
	 * 
	 * The OAuth token client ID must match the Extension client ID.
	 */
	export type ExtensionBitsTransactionCreate = Base<"extension.bits_transaction.create", "1", Condition.ExtensionBitsTransactionCreate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `extension_client_id` gets from `authorization.client_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `extension_client_id` — The client ID of the extension.
	 */
	export function ExtensionBitsTransactionCreate(connection: Connection | {transport: Transport, extension_client_id: string}): ExtensionBitsTransactionCreate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "extension.bits_transaction.create", version: "1", condition: { extension_client_id: connection.authorization.client_id } };
		else return { transport: connection.transport, type: "extension.bits_transaction.create", version: "1", condition: { extension_client_id: connection.extension_client_id } };
	}

	/**
	 * Notifies the subscriber when the specified broadcaster begins a goal. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalbegin)
	 * 
	 * **NOTE**: It’s possible to receive the Begin event after receiving Progress events.
	 * 
	 * Requires a user OAuth access token with scope set to **channel:read:goals**.
	 */
	export type ChannelGoalBegin = Base<"channel.goal.begin", "1", Condition.ChannelGoalBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `broadcaster_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `broadcaster_user_id` — The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token.
	 */
	export function ChannelGoalBegin(connection: Connection | {transport: Transport, broadcaster_user_id: string}): ChannelGoalBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.goal.begin", version: "1", condition: { broadcaster_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.goal.begin", version: "1", condition: { broadcaster_user_id: connection.broadcaster_user_id } };
	}

	/**
	 * Notifies the subscriber when progress is made towards the specified broadcaster’s goal. Progress could be positive (added followers) or negative (lost followers). [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress)
	 * 
	 * **NOTE**: It’s possible to receive Progress events before receiving the Begin event.
	 * 
	 * Requires a user OAuth access token with scope set to **channel:read:goals**.
	 */
	export type ChannelGoalProgress = Base<"channel.goal.progress", "1", Condition.ChannelGoalProgress, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `broadcaster_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `broadcaster_user_id` — The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token.
	 */
	export function ChannelGoalProgress(connection: Connection | {transport: Transport, broadcaster_user_id: string}): ChannelGoalProgress {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.goal.progress", version: "1", condition: { broadcaster_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.goal.progress", version: "1", condition: { broadcaster_user_id: connection.broadcaster_user_id } };
	}

	/**
	 * Notifies the subscriber when the specified broadcaster ends a goal. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalend)
	 * 
	 * Requires a user OAuth access token with scope set to **channel:read:goals**.
	 */
	export type ChannelGoalEnd = Base<"channel.goal.end", "1", Condition.ChannelGoalEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `broadcaster_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `broadcaster_user_id` — The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token.
	 */
	export function ChannelGoalEnd(connection: Connection | {transport: Transport, broadcaster_user_id: string}): ChannelGoalEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.goal.end", version: "1", condition: { broadcaster_user_id: connection.authorization.user_id} };
		else return { transport: connection.transport, type: "channel.goal.end", version: "1", condition: { broadcaster_user_id: connection.broadcaster_user_id } };
	}

	/**
	 * The `channel.hype_train.begin` subscription type sends a notification when a Hype Train begins on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin)
	 * 
	 * In addition to a `channel.hype_train.begin` event, one `channel.hype_train.progress` event will be sent for each contribution that caused the Hype Train to begin. EventSub does not make strong assurances about the order of message delivery, so it is possible to receive `channel.hype_train.progress` notifications before you receive the corresponding `channel.hype_train.begin` notification.
	 * 
	 * After the Hype Train begins, any additional cheers or subscriptions on the channel will cause `channel.hype_train.progress` notifications to be sent. When the Hype Train is over, `channel.hype_train.end` is emitted.
	 * 
	 * Must have `channel:read:hype_train` scope.
	 */
	export type ChannelHypeTrainBegin = Base<"channel.hype_train.begin", "1", Condition.ChannelHypeTrainBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster that you want to get Hype Train begin notifications for.
	 */
	export function ChannelHypeTrainBegin(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelHypeTrainBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.hype_train.begin", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.hype_train.begin", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.hype_train.progress` subscription type sends a notification when a Hype Train makes progress on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress)
	 * 
	 * When a Hype Train starts, one `channel.hype_train.progress` event will be sent for each contribution that caused the Hype Train to begin (in addition to the `channel.hype_train.begin` event). EventSub does not make strong assurances about the order of message delivery, so it is possible to receive `channel.hype_train.progress` before you receive the corresponding `channel.hype_train.begin`.
	 * 
	 * After a Hype Train begins, any additional cheers or subscriptions on the channel will cause `channel.hype_train.progress` notifications to be sent. When the Hype Train is over, `channel.hype_train.end` is emitted.
	 * 
	 * Must have `channel:read:hype_train` scope.
	 */
	export type ChannelHypeTrainProgress = Base<"channel.hype_train.progress", "1", Condition.ChannelHypeTrainProgress, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster that you want to get Hype Train progress notifications for.
	 */
	export function ChannelHypeTrainProgress(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelHypeTrainProgress {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.hype_train.progress", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.hype_train.progress", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `channel.hype_train.end` subscription type sends a notification when a Hype Train ends on the specified channel. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainend)
	 * 
	 * Must have `channel:read:hype_train` scope.
	 */
	export type ChannelHypeTrainEnd = Base<"channel.hype_train.end", "1", Condition.ChannelHypeTrainEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The ID of the broadcaster that you want to get Hype Train end notifications for.
	 */
	export function ChannelHypeTrainEnd(connection: Connection | {transport: Transport}, broadcaster_user_id: string): ChannelHypeTrainEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.hype_train.end", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "channel.hype_train.end", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * Sends a notification when the broadcaster activates Shield Mode. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modebegin)
	 * 
	 * This event informs the subscriber that the broadcaster’s moderation settings were changed based on the broadcaster’s Shield Mode configuration settings.
	 * 
	 * Requires the **moderator:read:shield_mode** or **moderator:manage:shield_mode** scope.
	 * 
	 * If you use [webhooks](/docs/eventsub/handling-webhook-events), the user in `moderator_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the Authorization section of [Create EventSub Subscription](/docs/api/reference#create-eventsub-subscription).
	 * 
	 * If you use [WebSockets](/docs/eventsub/handling-websocket-events), the ID in `moderator_id` must match the user ID in the user access token.
	 */
	export type ChannelShieldModeBegin = Base<"channel.shield_mode.begin", "1", Condition.ChannelShieldModeBegin, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The ID of the broadcaster whose Shield Mode status was updated.
	 */
	export function ChannelShieldModeBegin(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelShieldModeBegin {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shield_mode.begin", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.shield_mode.begin", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * Sends a notification when the broadcaster deactivates Shield Mode. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend)
	 * 
	 * This event informs the subscriber that the broadcaster’s moderation settings were changed back to the broadcaster’s previous moderation settings.
	 * 
	 * Requires the **moderator:read:shield_mode** or **moderator:manage:shield_mode** scope.
	 * 
	 * If you use [webhooks](/docs/eventsub/handling-webhook-events), the user in `moderator_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the Authorization section of [Create EventSub Subscription](/docs/api/reference#create-eventsub-subscription).
	 * 
	 * If you use [WebSockets](/docs/eventsub/handling-websocket-events), the ID in `moderator_id` must match the user ID in the user access token.
	 */
	export type ChannelShieldModeEnd = Base<"channel.shield_mode.end", "1", Condition.ChannelShieldModeEnd, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The ID of the broadcaster whose Shield Mode status was updated.
	 */
	export function ChannelShieldModeEnd(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelShieldModeEnd {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shield_mode.end", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.shield_mode.end", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * Sends a notification when the specified broadcaster sends a Shoutout. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate)
	 * 
	 * Requires the **moderator:read:shoutouts** or **moderator:manage:shoutouts** scope.
	 * 
	 * If you use [webhooks](/docs/eventsub/handling-webhook-events), the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the Authorization section of [Create EventSub Subscription](/docs/api/reference#create-eventsub-subscription).
	 * 
	 * If you use [WebSockets](/docs/eventsub/handling-websocket-events), the ID in `moderator_user_id` must match the user ID in the user access token.
	 */
	export type ChannelShoutoutCreate = Base<"channel.shoutout.create", "1", Condition.ChannelShoutoutCreate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive Shoutout create notifications for.
	 */
	export function ChannelShoutoutCreate(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelShoutoutCreate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shoutout.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.shoutout.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * Sends a notification when the specified broadcaster receives a Shoutout. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutreceive)
	 * 
	 * **NOTE** Sent only if Twitch posts the Shoutout to the broadcaster’s activity feed.
	 * 
	 * Requires the **moderator:read:shoutouts** or **moderator:manage:shoutouts** scope.
	 * 
	 * If you use [webhooks](/docs/eventsub/handling-webhook-events), the user in `moderator_user_id` must have granted your app (client ID) one of the above permissions prior to your app subscribing to this subscription type. To learn more, see the Authorization section of [Create EventSub Subscription](/docs/api/reference#create-eventsub-subscription).
	 * 
	 * If you use [WebSockets](/docs/eventsub/handling-websocket-events), the ID in `moderator_user_id` must match the user ID in the user access token.
	 */
	export type ChannelShoutoutReceive = Base<"channel.shoutout.receive", "1", Condition.ChannelShoutoutReceive, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `moderator_user_id` — User ID of the moderator.
	 * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive Shoutout receive notifications for.
	 */
	export function ChannelShoutoutReceive(connection: Connection | {transport: Transport, moderator_user_id: string}, broadcaster_user_id: string): ChannelShoutoutReceive {
		if (Connection.is(connection)) return { transport: connection.transport, type: "channel.shoutout.receive", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
		else return { transport: connection.transport, type: "channel.shoutout.receive", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
	}

	/**
	 * The `stream.online` subscription type sends a notification when the specified broadcaster starts a stream. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline)
	 * 
	 * No authorization required.
	 */
	export type StreamOnline = Base<"stream.online", "1", Condition.StreamOnline, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID you want to get stream online notifications for.
	 */
	export function StreamOnline(connection: Connection | {transport: Transport}, broadcaster_user_id: string): StreamOnline {
		if (Connection.is(connection)) return { transport: connection.transport, type: "stream.online", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "stream.online", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `stream.offline` subscription type sends a notification when the specified broadcaster stops a stream. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline)
	 * 
	 * No authorization required.
	 */
	export type StreamOffline = Base<"stream.offline", "1", Condition.StreamOffline, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param broadcaster_user_id The broadcaster user ID you want to get stream offline notifications for.
	 */
	export function StreamOffline(connection: Connection | {transport: Transport}, broadcaster_user_id: string): StreamOffline {
		if (Connection.is(connection)) return { transport: connection.transport, type: "stream.offline", version: "1", condition: { broadcaster_user_id } };
		else return { transport: connection.transport, type: "stream.offline", version: "1", condition: { broadcaster_user_id } };
	}

	/**
	 * The `user.authorization.grant` subscription type sends a notification when a user’s authorization has been granted to your client id. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant)
	 * 
	 * **NOTE** This subscription type is only supported by webhooks, and cannot be used with WebSockets.
	 * 
	 * Provided `client_id` must match the client id in the application access token.
	 */
	export type UserAuthorizationGrant = Base<"user.authorization.grant", "1", Condition.UserAuthorizationGrant, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `client_id` gets from `authorization.client_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `client_id` — Your application’s client id. The provided client_id must match the client id in the application access token.
	 */
	export function UserAuthorizationGrant(connection: Connection | {transport: Transport, client_id: string}): UserAuthorizationGrant {
		if (Connection.is(connection)) return { transport: connection.transport, type: "user.authorization.grant", version: "1", condition: { client_id: connection.authorization.client_id } };
		else return { transport: connection.transport, type: "user.authorization.grant", version: "1", condition: { client_id: connection.client_id } };
	}

	/**
	 * The `user.authorization.revoke` subscription type sends a notification when a user’s authorization has been revoked for your client id. Use this webhook to meet government requirements for handling user data, such as GDPR, LGPD, or CCPA. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke)
	 * 
	 * **NOTE** This subscription type is only supported by webhooks, and cannot be used with WebSockets.
	 * 
	 * Provided `client_id` must match the client id in the application access token.
	 */
	export type UserAuthorizationRevoke = Base<"user.authorization.revoke", "1", Condition.UserAuthorizationRevoke, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `client_id` gets from `authorization.client_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * - `client_id` — Your application’s client id. The provided client_id must match the client id in the application access token.
	 */
	export function UserAuthorizationRevoke(connection: Connection | {transport: Transport, client_id: string}): UserAuthorizationRevoke {
		if (Connection.is(connection)) return { transport: connection.transport, type: "user.authorization.revoke", version: "1", condition: { client_id: connection.authorization.client_id } };
		else return { transport: connection.transport, type: "user.authorization.revoke", version: "1", condition: { client_id: connection.client_id } };
	}

	/**
	 * The `user.update` subscription type sends a notification when a user updates their account. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate)
	 * 
	 * No authorization required. If you have the `user:read:email` scope, the notification will include `email` field.
	 */
	export type UserUpdate = Base<"user.update", "1", Condition.UserUpdate, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param user_id The user ID for the user you want update notifications for.
	 */
	export function UserUpdate(connection: Connection | {transport: Transport}, user_id: string): UserUpdate {
		if (Connection.is(connection)) return { transport: connection.transport, type: "user.update", version: "1", condition: { user_id } };
		else return { transport: connection.transport, type: "user.update", version: "1", condition: { user_id } };
	}

	/**
	 * The `user.whisper.message` subscription type sends a notification when a user receives a whisper. Event Triggers - Anyone whispers the specified user. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage)
	 * 
	 * Must have oauth scope `user:read:whispers` or `user:manage:whispers`.
	 */
	export type UserWhisperMessage = Base<"user.whisper.message", "1", Condition.UserWhisperMessage, Transport>;
	/**
	 * @param connection
	 * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
	 * - `transport` — The transport details that you want Twitch to use when sending you notifications.
	 * @param user_id The user_id of the person receiving whispers.
	 */
	export function UserWhisperMessage(connection: Connection | {transport: Transport}, user_id: string): UserWhisperMessage {
		if (Connection.is(connection)) return { transport: connection.transport, type: "user.whisper.message", version: "1", condition: { user_id } };
		else return { transport: connection.transport, type: "user.whisper.message", version: "1", condition: { user_id } };
	}
}

/** An object that contains the message. */
export type Payload = Payload.AutomodMessageHold | Payload.AutomodMessageHoldV2 | Payload.AutomodMessageUpdate | Payload.AutomodMessageUpdateV2 | Payload.AutomodSettingsUpdate | Payload.AutomodTermsUpdate | Payload.ChannelAdBreakBegin | Payload.ChannelBan | Payload.ChannelBitsUse | Payload.ChannelCharityCampaignDonate | Payload.ChannelCharityCampaignProgress | Payload.ChannelCharityCampaignStart | Payload.ChannelCharityCampaignStop | Payload.ChannelChatClear | Payload.ChannelChatClearUserMessages | Payload.ChannelChatMessage | Payload.ChannelChatMessageDelete | Payload.ChannelChatNotification | Payload.ChannelChatSettingsUpdate | Payload.ChannelChatUserMessageHold | Payload.ChannelChatUserMessageUpdate | Payload.ChannelCheer | Payload.ChannelFollow | Payload.ChannelGoalBegin | Payload.ChannelGoalEnd | Payload.ChannelGoalProgress | Payload.ChannelGuestStarGuestUpdate | Payload.ChannelGuestStarSessionBegin | Payload.ChannelGuestStarSessionEnd | Payload.ChannelGuestStarSettingsUpdate | Payload.ChannelHypeTrainBegin | Payload.ChannelHypeTrainEnd | Payload.ChannelHypeTrainProgress | Payload.ChannelModerate | Payload.ChannelModerateV2 | Payload.ChannelModeratorAdd | Payload.ChannelModeratorRemove | Payload.ChannelPointsAutomaticRewardRedemptionAdd | Payload.ChannelPointsAutomaticRewardRedemptionAddV2 | Payload.ChannelPointsCustomRewardAdd | Payload.ChannelPointsCustomRewardRedemptionAdd | Payload.ChannelPointsCustomRewardRedemptionUpdate | Payload.ChannelPointsCustomRewardRemove | Payload.ChannelPointsCustomRewardUpdate | Payload.ChannelPollBegin | Payload.ChannelPollEnd | Payload.ChannelPollProgress | Payload.ChannelPredictionBegin | Payload.ChannelPredictionEnd | Payload.ChannelPredictionLock | Payload.ChannelPredictionProgress | Payload.ChannelRaid | Payload.ChannelSharedChatSessionBegin | Payload.ChannelSharedChatSessionEnd | Payload.ChannelSharedChatSessionUpdate | Payload.ChannelShieldModeBegin | Payload.ChannelShieldModeEnd | Payload.ChannelShoutoutCreate | Payload.ChannelShoutoutReceive | Payload.ChannelSubscribe | Payload.ChannelSubscriptionEnd | Payload.ChannelSubscriptionGift | Payload.ChannelSubscriptionMessage | Payload.ChannelSuspiciousUserMessage | Payload.ChannelSuspiciousUserUpdate | Payload.ChannelUnban | Payload.ChannelUnbanRequestCreate | Payload.ChannelUnbanRequestResolve | Payload.ChannelUpdate | Payload.ChannelVipAdd | Payload.ChannelVipRemove | Payload.ChannelWarningAcknowledge | Payload.ChannelWarningSend | Payload.ConduitShardDisabled | Payload.DropEntitlementGrant | Payload.ExtensionBitsTransactionCreate | Payload.StreamOffline | Payload.StreamOnline | Payload.UserAuthorizationGrant | Payload.UserAuthorizationRevoke | Payload.UserUpdate | Payload.UserWhisperMessage;
export namespace Payload {
	export interface Base<Subscription_ extends Subscription = Subscription, Status extends string = "enabled"> {
		/** An object that contains information about your subscription. */
		subscription: {
			/** An ID that uniquely identifies this subscription. */
			id: string;
			/** The subscription's status. */
			status: Status;
			/** The type of event sent in the message. See the `event` field. */
			type: Subscription_["type"];
			/** The version number of the subscription type's definition. */
			version: Subscription_["version"];
			/** The event's cost. See [Subscription limits](https://dev.twitch.tv/docs/eventsub/manage-subscriptions#subscription-limits). */
			cost: number;
			/** The conditions under which the event fires. For example, if you requested notifications when a broadcaster gets a new follower, this object contains the broadcaster's ID. For information about the condition's data, see the subscription type's description in [Subscription types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types). */
			condition: Subscription_["condition"];
			/** An object that contains information about the transport used for notifications. */
			transport: Subscription_["transport"];
			/** The UTC date and time that the subscription was created. */
			created_at: string;
		};
		/** The data of event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference) */
		event: any;
	}
	export namespace AutomodMessage {
		export type MessageFragment = MessageFragment.Text | MessageFragment.Emote | MessageFragment.Cheermote;
		export namespace MessageFragment {
			export interface Text<Type extends string = "text"> {
				/** Type of fragment. */
				type: Type;
				/** Message text in a fragment. */
				text: string;
			}
			export interface Emote extends Text<"emote"> {
				/** Metadata pertaining to the emote. */
				emote: {
					/** An ID that uniquely identifies this emote. */
					id: string;
					/** An ID that identifies the emote set that the emote belongs to. */
					emote_set_id: string;
				};
			}
			export interface Cheermote extends Text<"cheermote"> {
				/** Metadata pertaining to the cheermote. */
				cheermote: {
					/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. **For example,** if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
					prefix: string;
					/** The amount of Bits cheered. */
					bits: number;
					/** The tier level of the cheermote. */
					tier: number;
				};
			}
		}
	}
	export interface AutomodMessageHold extends Base<Subscription.AutomodMessageHold> {
		/** The data of `automod.message.hold` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#automod-message-hold-event) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The message sender's user ID. */
			user_id: string;
			/** The message sender's login name. */
			user_login: string;
			/** The message sender's display name. */
			user_name: string;
			/** The ID of the message that was flagged by automod. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Metadata surrounding the potential inappropriate fragments of the message. */
				fragments: AutomodMessage.MessageFragment[];
			};
			/** The category of the message. */
			category: string;
			/** The level of severity. Measured between 1 to 4. */
			level: number;
			/** The timestamp of when automod saved the message. */
			held_at: string;
		};
	}
	export interface AutomodMessageHoldV2 extends Base<Subscription.AutomodMessageHoldV2> {	
		/** The data of `automod.message.hold` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#automod-message-hold-event-v2) */
		event: AutomodMessageHoldV2.Automod | AutomodMessageHoldV2.BlockedTerm;
	}
	export namespace AutomodMessageHoldV2 {
		export interface Event<Reason extends string = string> {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The message sender's user ID. */
			user_id: string;
			/** The message sender's login name. */
			user_login: string;
			/** The message sender's display name. */
			user_name: string;
			/** The ID of the held message. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Metadata surrounding the potential inappropriate fragments of the message. */
				fragments: AutomodMessage.MessageFragment[];
			};
			/** The timestamp of when automod saved the message. */
			held_at: string;
			/** Reason the message was held. */
			reason: Reason;
		}
		export interface Automod extends Event<"automod"> {
			/** If the message was caught by automod, this will be populated. */
			automod: {
				/** The category of the caught message. */
				category: string;
				/** The level of severity (1-4). */
				level: number;
				/** The bounds of the text that caused the message to be caught. */
				boundaries: Array<{
					/** Index in the message for the start of the problem (0 indexed, inclusive). */
					start_pos: number;
					/** Index in the message for the end of the problem (0 indexed, inclusive). */
					end_pos: number;
				}>;
			};
		}
		export interface BlockedTerm extends Event<"blocked_term"> {
			/** If the message was caught due to a blocked term, this will be populated. */
			blocked_term: {
				/** The list of blocked terms found in the message. */
				terms_found: Array<{
					/** The id of the blocked term found. */
					term_id: string;
					/** The bounds of the text that caused the message to be caught. */
					boundary: {
						/** Index in the message for the start of the problem (0 indexed, inclusive). */
						start_pos: number;
						/** Index in the message for the end of the problem (0 indexed, inclusive). */
						end_pos: number;
					};
					/** The id of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_id: string;
					/** The login of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_login: string;
					/** The username of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_name: string;
				}>;
			};
		}
	}
	export interface AutomodMessageUpdate extends Base<Subscription.AutomodMessageUpdate> {
		/** The data of `automod.message.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#automod-message-update-event) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The message sender's user ID. */
			user_id: string;
			/** The message sender's login name. */
			user_login: string;
			/** The message sender's display name. */
			user_name: string;
			/** The ID of the moderator who took action. */
			moderator_user_id: string;
			/** The moderator's user name. */
			moderator_user_name: string;
			/** The login of the moderator. */
			moderator_user_login: string;
			/** The ID of the message that was flagged by automod. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Metadata surrounding the potential inappropriate fragments of the message. */
				fragments: AutomodMessage.MessageFragment[];
			};
			/** The category of the message. */
			category: string;
			/** The level of severity. Measured between 1 to 4. */
			level: number;
			/** The message's status. */
			status: "Approved" | "Denied" | "Expired";
			/** The timestamp of when automod saved the message. */
			held_at: string;
		};
	}
	export interface AutomodMessageUpdateV2 extends Base<Subscription.AutomodMessageUpdateV2> {
		/** The data of `automod.message.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#automod-message-update-event-v2) */
		event: AutomodMessageUpdateV2.Automod | AutomodMessageUpdateV2.BlockedTerm;
	}
	export namespace AutomodMessageUpdateV2 {
		export interface Reason<ReasonType extends string = string> {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The message sender's user ID. */
			user_id: string;
			/** The message sender's login name. */
			user_login: string;
			/** The message sender's display name. */
			user_name: string;
			/** The ID of the moderator who took action. */
			moderator_user_id: string;
			/** The moderator's user name. */
			moderator_user_name: string;
			/** The login of the moderator. */
			moderator_user_login: string;
			/** The ID of the message that was flagged by automod. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Metadata surrounding the potential inappropriate fragments of the message. */
				fragments: AutomodMessage.MessageFragment[];
			};
			/** The message's status. */
			status: "Approved" | "Denied" | "Expired";
			/** The timestamp of when automod saved the message. */
			held_at: string;
			/** Reason the message was held. */
			reason: ReasonType;
		}
		export interface Automod extends Reason<"automod"> {
			/** If the message was caught by automod, this will be populated. */
			automod: {
				/** The category of the caught message. */
				category: string;
				/** The level of severity (1-4). */
				level: number;
				/** The bounds of the text that caused the message to be caught. */
				boundaries: Array<{
					/** Index in the message for the start of the problem (0 indexed, inclusive). */
					start_pos: number;
					/** Index in the message for the end of the problem (0 indexed, inclusive). */
					end_pos: number;
				}>;
			};
		}
		export interface BlockedTerm extends Reason<"blocked_term"> {
			/** If the message was caught due to a blocked term, this will be populated. */
			blocked_term: {
				/** The list of blocked terms found in the message. */
				terms_found: Array<{
					/** The id of the blocked term found. */
					term_id: string;
					/** The bounds of the text that caused the message to be caught. */
					boundary: {
						/** Index in the message for the start of the problem (0 indexed, inclusive). */
						start_pos: number;
						/** Index in the message for the end of the problem (0 indexed, inclusive). */
						end_pos: number;
					};
					/** The id of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_id: string;
					/** The login of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_login: string;
					/** The username of the broadcaster that owns the blocked term. */
					owner_broadcaster_user_name: string;
				}>;
			};
		}
	}
	export interface AutomodSettingsUpdate extends Base<Subscription.AutomodSettingsUpdate> {
		/** The data of `automod.settings.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#automod-settings-update-event) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The ID of the moderator who changed the channel settings. */
			moderator_user_id: string;
			/** The moderator's login. */
			moderator_user_login: string;
			/** The moderator's user name. */
			moderator_user_name: string;
			/** The Automod level for hostility involving name calling or insults. */
			bullying: number;
			/** The default AutoMod level for the broadcaster. Is `null` if the broadcaster has set one or more of the individual settings. */
			overall_level: number | null;
			/** The Automod level for discrimination against disability. */
			disability: number;
			/** The Automod level for racial discrimination. */
			race_ethnicity_or_religion: number;
			/** The Automod level for discrimination against women. */
			misogyny: number;
			/** The AutoMod level for discrimination based on sexuality, sex, or gender. */
			sexuality_sex_or_gender: number;
			/** The Automod level for hostility involving aggression. */
			aggression: number;
			/** The Automod level for sexual content. */
			sex_based_terms: number;
			/** The Automod level for profanity. */
			swearing: number;
		};
	}
	export interface AutomodTermsUpdate extends Base<Subscription.AutomodTermsUpdate> {
		/** The data of `automod.terms.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The ID of the moderator who changed the channel settings. */
			moderator_user_id: string;
			/** The moderator's login. */
			moderator_user_login: string;
			/** The moderator's user name. */
			moderator_user_name: string;
			/** The status change applied to the terms. */
			action: "add_permitted" | "remove_permitted" | "add_blocked" | "remove_blocked";
			/** Indicates whether this term was added due to an Automod message approve/deny action. */
			from_automod: boolean;
			/** The list of terms that had a status change. */
			terms: string[];
		};
	}
	export interface ChannelBitsUse extends Base<Subscription.ChannelBitsUse> {
		/** The data of `channel.bits.use` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse) */
		event: {
			/** The User ID of the channel where the Bits were redeemed. */
			broadcaster_user_id: string;
			/** The login of the channel where the Bits were used. */
			broadcaster_user_login: string;
			/** The display name of the channel where the Bits were used. */
			broadcaster_user_name: string;
			/** The User ID of the redeeming user. */
			user_id: string;
			/** The login name of the redeeming user. */
			user_login: string;
			/** The display name of the redeeming user. */
			user_name: string;
			/** The number of Bits used. */
			bits: number;
			/** The type of Bits usage. */
			type: "cheer" | "power_up";
			/** An object that contains the user message and emote information. */
			message: {
				/** The chat message in plain text. */
				text: string;
				/** The ordered list of chat message fragments. */
				fragments: (ChannelChat.MessageFragment.Text | ChannelChat.MessageFragment.Emote | ChannelChat.MessageFragment.Cheermote)[];
			} | null;
			/** Data about Power-up. */
			power_up: {
				/** The type of Power-up */
				type: "message_effect" | "celebration" | "gigantify_an_emote";
				/** Emote associated with the reward. */
				emote: {
					/** The ID that uniquely identifies this emote. */
					id: string;
					/** The human readable emote token. */
					name: string;
				} | null;
				/** The ID of the message effect. */
				message_effect_id: string | null;
			} | null;
		};
	}
	export interface ChannelUpdate extends Base<Subscription.ChannelUpdate> {
		/** The data of `channel.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate) */
		event: {
			/** The broadcaster’s user ID. */
			broadcaster_user_id: string;
			/** The broadcaster’s user login. */
			broadcaster_user_login: string;
			/** The broadcaster’s user display name. */
			broadcaster_user_name: string;
			/** The channel’s stream title. */
			title: string;
			/** The channel’s broadcast language. */
			language: string;
			/** The channel’s category ID. */
			category_id: string;
			/** The category name. */
			category_name: string;
			/** Array of content classification label IDs currently applied on the Channel. To retrieve a list of all possible IDs, use the [Get Content Classification Labels API](https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels) endpoint. */
			content_classification_labels: string[];
		};
	}
	export interface ChannelFollow extends Base<Subscription.ChannelFollow> {
		/** The data of `channel.follow` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow) */
		event: {
			/** The user ID for the user now following the specified channel. */
			user_id: string;
			/** The user login for the user now following the specified channel. */
			user_login: string;
			/** The user display name for the user now following the specified channel. */
			user_name: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** RFC3339 timestamp of when the follow occurred. */
			followed_at: string;
		};
	}
	export interface ChannelAdBreakBegin extends Base<Subscription.ChannelAdBreakBegin> {
		/** The data of `channel.ad_break.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin) */
		event: {
			/** Length in seconds of the mid-roll ad break requested */
			duration_seconds: number;
			/** 
			 * The UTC timestamp of when the ad break began, in RFC3339 format. 
			 * 
			 * **NOTE:** There may be a delay between this event and when viewers see ads.
			 */
			started_at: string;
			/** Indicates if the ad was automatically scheduled via Ads Manager */
			is_automatic: boolean;
			/** The broadcaster's user ID for the channel the ad was run on. */
			broadcaster_user_id: string;
			/** The broadcaster's user login for the channel the ad was run on. */
			broadcaster_user_login: string;
			/** The broadcaster's user display name for the channel the ad was run on. */
			broadcaster_user_name: string;
			/** The ID of the user that requested the ad. For automatic ads, this will be the ID of the broadcaster. */
			requester_user_id: string;
			/** The login of the user that requested the ad. */
			requester_user_login: string;
			/** The display name of the user that requested the ad. */
			requester_user_name: string;
		};
	}
	export namespace ChannelChat {
		export interface Badge {
			/** An ID that identifies this set of chat badges. For example, Bits or Subscriber. */
			set_id: string;
			/** An ID that identifies this version of the badge. The ID can be any value. For example, for Bits, the ID is the Bits tier level, but for World of Warcraft, it could be Alliance or Horde. */
			id: string;
			/** Contains metadata related to the chat badges in the badges tag. Currently, this tag contains metadata only for subscriber badges, to indicate the number of months the user has been a subscriber. */
			info: string;
		}
		export type EmoteFormats = ("animated" | "static")[];
		export type MessageFragment = MessageFragment.Text | MessageFragment.Cheermote | MessageFragment.Emote | MessageFragment.Mention;
		export namespace MessageFragment {
			export interface Text<Type extends string = "text"> {
				/** The type of message fragment. */
				type: Type;
				/** Message text in fragment. */
				text: string;
			}
			export interface Cheermote extends Text<"cheermote"> {
				/** Metadata pertaining to the cheermote. */
				cheermote: {
					/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. For example, if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
					prefix: string;
					/** The amount of Bits cheered. */
					bits: number;
					/** The tier level of the cheermote. */
					tier: number;
				};
			}
			export interface Emote extends Text<"emote"> {
				/** Metadata pertaining to the emote. */
				emote: {
					/** An ID that uniquely identifies this emote. */
					id: string;
					/** An ID that identifies the emote set. */
					emote_set_id: string;
					/** The ID of the broadcaster who owns the emote. */
					owner_id: string;
					/** The formats that the emote is available in. */
					format: EmoteFormats;
				};
			}
			export interface Mention extends Text<"mention"> {
				/** Optional. Metadata pertaining to the mention. */
				mention: {
					/** The user ID of the mentioned user. */
					user_id: string;
					/** The user name of the mentioned user. */
					user_name: string;
					/** The user login of the mentioned user. */
					user_login: string;
				};
			}
		}
	}
	export interface ChannelChatClear extends Base<Subscription.ChannelChatClear> {
		/** The data of `channel.chat.clear` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear) */
		event: {
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
		};
	}
	export interface ChannelChatClearUserMessages extends Base<Subscription.ChannelChatClearUserMessages> {
		/** The data of `channel.chat.clear_user_messages` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages) */
		event: {
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The ID of the user that was banned or put in a timeout. All of their messages are deleted. */
			target_user_id: string;
			/** The user name of the user that was banned or put in a timeout. */
			target_user_name: string;
			/** The user login of the user that was banned or put in a timeout. */
			target_user_login: string;
		};
	}
	export interface ChannelChatMessage extends Base<Subscription.ChannelChatMessage> {
		/** The data of `channel.chat.message` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#channel-chat-message-event) */
		event: {
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The user ID of the user that sent the message. */
			chatter_user_id: string;
			/** The user name of the user that sent the message. */
			chatter_user_name: string;
			/** The user login of the user that sent the message. */
			chatter_user_login: string;
			/** A UUID that identifies the message. */
			message_id: string;
			/** The structured chat message. */
			message: {
				/** The chat message in plain text. */
				text: string;
				/** Ordered list of chat message fragments. */
				fragments: ChannelChat.MessageFragment[];
			};
			/** The type of message. */
			message_type: "text" | "channel_points_highlighted" | "channel_points_sub_only" | "user_intro" | "power_ups_message_effect" | "power_ups_gigantified_emote";
			/** List of chat badges. */
			badges: ChannelChat.Badge[];
			/** Metadata if this message is a cheer. */
			cheer: {
				/** The amount of Bits the user cheered. */
				bits: number;
			} | null;
			/** The color of the user's name in the chat room. This is a hexadecimal RGB color code in the form, #<RGB>. May be empty if never set. */
			color: string | null;
			/** Metadata if this message is a reply. */
			reply: {
				/** An ID that uniquely identifies the parent message. */
				parent_message_id: string;
				/** The message body of the parent message. */
				parent_message_body: string;
				/** User ID of the sender of the parent message. */
				parent_user_id: string;
				/** User name of the sender of the parent message. */
				parent_user_name: string;
				/** User login of the sender of the parent message. */
				parent_user_login: string;
				/** An ID that identifies the parent message of the reply thread. */
				thread_message_id: string;
				/** User ID of the sender of the thread's parent message. */
				thread_user_id: string;
				/** User name of the sender of the thread's parent message. */
				thread_user_name: string;
				/** User login of the sender of the thread's parent message. */
				thread_user_login: string;
			} | null;
			/** The ID of a channel points custom reward that was redeemed. */
			channel_points_custom_reward_id: string | null;
			/** The broadcaster user ID of the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session. */
			source_broadcaster_user_id: string | null;
			/** The user name of the broadcaster of the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session. */
			source_broadcaster_user_name: string | null;
			/** The login of the broadcaster of the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session. */
			source_broadcaster_user_login: string | null;
			/** The UUID that identifies the source message from the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session. */
			source_message_id: string | null;
			/** The list of chat badges for the chatter in the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session. */
			source_badges: ChannelChat.Badge[] | null;
			/** Determines if a message delivered during a shared chat session is only sent to the source channel. Has no effect if the message is not sent during a shared chat session. */
			is_source_only: boolean | null;
		};
	}
	export interface ChannelChatMessageDelete extends Base<Subscription.ChannelChatMessageDelete> {
		/** The data of `channel.chat.message_delete` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete) */
		event: {
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The ID of the user whose message was deleted. */
			target_user_id: string;
			/** The user name of the user whose message was deleted. */
			target_user_name: string;
			/** The user login of the user whose message was deleted. */
			target_user_login: string;
			/** A UUID that identifies the message that was removed. */
			message_id: string;
		};
	}
	export interface ChannelChatNotification extends Base<Subscription.ChannelChatNotification> {
		/** The data of `channel.chat.notification` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification) */
		event:
			| ChannelChatNotification.Sub | ChannelChatNotification.Resub | ChannelChatNotification.SubGift
			| ChannelChatNotification.CommunitySubGift | ChannelChatNotification.GiftPaidUpgrade | ChannelChatNotification.PrimePaidUpgrade
			| ChannelChatNotification.Raid | ChannelChatNotification.Unraid | ChannelChatNotification.PayItForward | ChannelChatNotification.Announcement
			| ChannelChatNotification.SharedChatSub | ChannelChatNotification.SharedChatResub | ChannelChatNotification.SharedChatSubGift
			| ChannelChatNotification.SharedChatCommunitySubGift | ChannelChatNotification.SharedChatGiftPaidUpgrade | ChannelChatNotification.SharedChatPrimePaidUpgrade
			| ChannelChatNotification.SharedChatRaid | ChannelChatNotification.SharedChatPayItForward | ChannelChatNotification.SharedChatAnnouncement;
	}
	export namespace ChannelChatNotification {
		export interface Event<NoticeType extends string = string> {
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The user ID of the user that sent the message. */
			chatter_user_id: string;
			/** The user name of the user that sent the message. */
			chatter_user_name: string;
			/** Whether or not the chatter is anonymous. */
			chatter_is_anonymous: boolean;
			/** The color of the user's name in the chat room. */
			color: string;
			/** List of chat badges. */
			badges: ChannelChat.Badge[];
			/** The message Twitch shows in the chat room for this notice. */
			system_message: string;
			/** A UUID that identifies the message. */
			message_id: string;
			/** The structured chat message. */
			message: {
				/** The chat message in plain text. */
				text: string;
				/** Ordered list of chat message fragments. */
				fragments: ChannelChat.MessageFragment[];
			};
			/** The type of notice. */
			notice_type: NoticeType;
			/** The broadcaster user ID of the channel the message was sent from. Is `null` when the message notification happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
			source_broadcaster_user_id: string | null;
			/** The user name of the broadcaster of the channel the message was sent from. Is `null` when the message notification happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
			source_broadcaster_user_name: string | null;
			/** The login of the broadcaster of the channel the message was sent from. Is `null` when the message notification happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
			source_broadcaster_user_login: string | null;
			/** The UUID that identifies the source message from the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
			source_message_id: string | null;
			/** The list of chat badges for the chatter in the channel the message was sent from. Is `null` when the message happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
			source_badges: ChannelChat.Badge[] | null;
		}
		export interface Sub extends Event<"sub"> {
			/** Information about the `sub` event. */
			sub: {
				/** The type of subscription plan. */
				sub_tier: "1000" | "2000" | "3000";
				/** Indicates if the subscription was obtained through Amazon Prime. */
				is_prime: boolean;
				/** The number of months the subscription is for. */
				duration_months: number;
			};
		}
		export interface Resub extends Event<"resub"> {
			/** Information about the `resub` event. */
			resub: {
				/** The total number of months the user has subscribed. */
				cumulative_months: number;
				/** The number of months the subscription is for. */
				duration_months: number;
				/** The number of consecutive months the user has subscribed. */
				streak_months: number;
				/**
				 * The type of subscription plan.
				 * - `1000` - First level of paid or Prime subscription.
				 * - `2000` - Second level of paid subscription.
				 * - `3000` - Third level of paid subscription.
				 */
				sub_tier: "1000" | "2000" | "3000";
				/** The number of consecutive months the user has subscribed. */
				is_prime: boolean;
				/** Indicates if the resub was a result of a gift. */
				is_gift: boolean;
				/** Whether or not the gift was anonymous. */
				gifter_is_anonymous: boolean;
				/** The user ID of the subscription gifter. Is `null` if anonymous. */
				gifter_user_id: string | null;
				/** The user name of the subscription gifter. Is `null` if anonymous. */
				gifter_user_name: string | null;
				/** The user login of the subscription gifter. Is `null` if anonymous. */
				gifter_user_login: string | null;
			};
		}
		export interface SubGift extends Event<"sub_gift"> {
			/** Information about the `sub_gift` event. */
			sub_gift: {
				/** The number of months the subscription is for. */
				duration_months: number;
				/** The amount of gifts the gifter has given in this channel. */
				cumulative_total: number | null;
				/** The user ID of the subscription gift recipient. */
				recipient_user_id: string;
				/** The user name of the subscription gift recipient. */
				recipient_user_name: string;
				/** The user login of the subscription gift recipient. */
				recipient_user_login: string;
				/** The type of subscription plan. */
				sub_tier: "1000" | "2000" | "3000";
				/** The ID of the associated community gift. */
				community_gift_id: string | null;
			};
		}
		export interface CommunitySubGift extends Event<"community_sub_gift"> {
			/** Information about the `community_sub_gift` event. */
			community_sub_gift: {
				/** The ID of the associated community gift. */
				id: string;
				/** Number of subscriptions being gifted. */
				total: number;
				/** The type of subscription plan. */
				sub_tier: "1000" | "2000" | "3000";
				/** The amount of gifts the gifter has given in this channel. */
				cumulative_total?: number;
			};
		}
		export interface GiftPaidUpgrade extends Event<"gift_paid_upgrade"> {
			/** Information about the `gift_paid_upgrade` event. */
			gift_paid_upgrade: {
				/** Whether the gift was given anonymously. */
				gifter_is_anonymous: boolean;
				/** The user ID of the user who gifted the subscription. Is `null` if anonymous. */
				gifter_user_id: string | null;
				/** The user name of the user who gifted the subscription. Is `null` if anonymous. */
				gifter_user_name: string | null;
			};
		}
		export interface PrimePaidUpgrade extends Event<"prime_paid_upgrade"> {
			/** Information about the `prime_paid_upgrade` event. */
			prime_paid_upgrade: {
				/** The type of subscription plan. */
				sub_tier: "1000" | "2000" | "3000";
			};
		}
		export interface Raid extends Event<"raid"> {
			/** Information about the `raid` event. */
			raid: {
				/** The user ID of the broadcaster raiding this channel. */
				user_id: string;
				/** The user name of the broadcaster raiding this channel. */
				user_name: string;
				/** The login name of the broadcaster raiding this channel. */
				user_login: string;
				/** The number of viewers raiding this channel. */
				viewer_count: number;
				/** Profile image URL of the broadcaster. */
				profile_image_url: string;
			};
		}
		export interface Unraid extends Event<"unraid"> {
			/** Information about the `unraid` event. */
			unraid: {};
		}
		export interface PayItForward extends Event<"pay_it_forward"> {
			/** Information about the `pay_it_forward` event. */
			pay_it_forward: {
				/** Whether the gift was given anonymously. */
				gifter_is_anonymous: boolean;
				/** The user ID of the user who gifted the subscription. Is `null` if anonymous. */
				gifter_user_id: string | null;
				/** The user name of the user who gifted the subscription. Is `null` if anonymous. */
				gifter_user_name: string | null;
				/** The user login of the user who gifted the subscription. Is `null` if anonymous. */
				gifter_user_login: string | null;
			};
		}
		export interface Announcement extends Event<"announcement"> {
			/** Information about the `announcement` event. */
			announcement: {
				/** Color of the announcement. */
				color: string;
			};
		}
		export interface BitsBadgeTier extends Event<"bits_badge_tier"> {
			/** Information about the `bits_badge_tier` event. */
			bits_badge_tier: {
				/** The tier of the Bits badge. */
				tier: number;
			};
		}
		export interface CharityDonation extends Event<"charity_donation"> {
			/** Information about the `charity_donation` event. */
			charity_donation: {
				/** Name of the charity. */
				charity_name: string;
				/** The donation amount. */
				amount: {
					/** The monetary amount in minor units. */
					value: number;
					/** The number of decimal places used by the currency. */
					decimal_place: number;
					/** The ISO-4217 three-letter currency code. */
					currency: string;
				};
			};
		}
		export interface SharedChatSub extends Omit<Sub, "notice_type" | "sub"> {
			/** The type of notice. */
			notice_type: "shared_chat_sub";
			/** Information about the `shared_chat_sub` event. */
			shared_chat_sub: Sub["sub"];
		}
		export interface SharedChatResub extends Omit<Resub, "notice_type" | "resub"> {
			/** The type of notice. */
			notice_type: "shared_chat_resub";
			/** Information about the `shared_chat_resub` event. */
			shared_chat_resub: Resub["resub"];
		}
		export interface SharedChatSubGift extends Omit<SubGift, "notice_type" | "sub_gift"> {
			/** The type of notice. */
			notice_type: "shared_chat_sub_gift";
			/** Information about the `shared_chat_sub_gift` event. */
			shared_chat_sub_gift: SubGift["sub_gift"];
		}
		export interface SharedChatCommunitySubGift extends Omit<CommunitySubGift, "notice_type" | "community_sub_gift"> {
			/** The type of notice. */
			notice_type: "shared_chat_community_sub_gift";
			/** Information about the `shared_chat_community_sub_gift` event. */
			shared_chat_community_sub_gift: CommunitySubGift["community_sub_gift"];
		}
		export interface SharedChatGiftPaidUpgrade extends Omit<GiftPaidUpgrade, "notice_type" | "gift_paid_upgrade"> {
			/** The type of notice. */
			notice_type: "shared_chat_gift_paid_upgrade";
			/** Information about the `shared_chat_gift_paid_upgrade` event. */
			shared_chat_gift_paid_upgrade: GiftPaidUpgrade["gift_paid_upgrade"];
		}
		export interface SharedChatPrimePaidUpgrade extends Omit<PrimePaidUpgrade, "notice_type" | "prime_paid_upgrade"> {
			/** The type of notice. */
			notice_type: "shared_chat_prime_paid_upgrade";
			/** Information about the `shared_chat_prime_paid_upgrade` event. */
			shared_chat_prime_paid_upgrade: PrimePaidUpgrade["prime_paid_upgrade"];
		}
		export interface SharedChatRaid extends Omit<Raid, "notice_type" | "raid"> {
			/** The type of notice. */
			notice_type: "shared_chat_raid";
			/** Information about the `shared_chat_raid` event. */
			shared_chat_raid: Raid["raid"];
		}
		export interface SharedChatPayItForward extends Omit<PayItForward, "notice_type" | "pay_it_forward"> {
			/** The type of notice. */
			notice_type: "shared_chat_pay_it_forward";
			/** Information about the `shared_chat_pay_it_forward` event. */
			shared_chat_pay_it_forward: PayItForward["pay_it_forward"];
		}
		export interface SharedChatAnnouncement extends Omit<Announcement, "notice_type" | "announcement"> {
			/** The type of notice. */
			notice_type: "shared_chat_announcement";
			/** Information about the `shared_chat_announcement` event. */
			shared_chat_announcement: Announcement["announcement"];
		}
	}
	export interface ChannelChatSettingsUpdate extends Base<Subscription.ChannelChatSettingsUpdate> {
		/** The data of `channel.chat_settings.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** A Boolean value that determines whether chat messages must contain only emotes. Is `true` if only messages that are 100% emotes are allowed, otherwise `false`. */
			emote_mode: boolean;
			/** A Boolean value that determines whether the broadcaster restricts the chat room to followers only, based on how long they’ve followed. Is `true` if the broadcaster restricts the chat room to followers only, otherwise `false`. See `follower_mode_duration_minutes` for how long the followers must have followed the broadcaster to participate in the chat room. */
			follower_mode: boolean;
			/** The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat room. See `follower_mode`. Is `null` if `follower_mode` is `false`. */
			follower_mode_duration_minutes: number | null;
			/** A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Is `true`, if the broadcaster applies a delay, otherwise `false`. See `slow_mode_wait_time_seconds` for the delay. */
			slow_mode: number;
			/** The amount of time, in seconds, that users need to wait between sending messages. See `slow_mode`. Is `null` if `slow_mode` is `false`. */
			slow_mode_wait_time_seconds: number | null;
			/** A Boolean value that determines whether only users that subscribe to the broadcaster’s channel can talk in the chat room. Is `true` if the broadcaster restricts the chat room to subscribers only, otherwise `false`. */
			subscriber_mode: boolean;
			/** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room. Is `true` if the broadcaster requires unique messages on, otherwise `false`. */
			unique_chat_mode: boolean;
		};
	}
	export interface ChannelChatUserMessageHold extends Base<Subscription.ChannelChatUserMessageHold> {
		/** The data of `channel.chat.user_message_hold` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The User ID of the message sender. */
			user_id: string;
			/** The message sender's login. */
			user_login: string;
			/** The message sender’s display name. */
			user_name: string;
			/** The ID of the message that was flagged by automod. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Ordered list of chat message fragments. */
				fragments: {
					/** Message text in a fragment. */
					text: string;
					/** Metadata pertaining to the emote. */
					emote: {
						/** An ID that uniquely identifies this emote. */
						id: string;
						/** An ID that identifies the emote set that the emote belongs to. */
						emote_set_id: string;
					} | null;
					/** Metadata pertaining to the cheermote. */
					cheermote: {
						/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. **For example,** if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
						prefix: string;
						/** The amount of Bits cheered. */
						bits: number;	
						/** The tier level of the cheermote. */
						tier: number;
					} | null;
				}[];
			};
		};
	}
	export interface ChannelChatUserMessageUpdate extends Base<Subscription.ChannelChatUserMessageUpdate> {
		/** The data of `channel.chat.user_message_update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_update) */
		event: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_user_id: string;
			/** The login of the broadcaster specified in the request. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster specified in the request. */
			broadcaster_user_name: string;
			/** The User ID of the message sender. */
			user_id: string;
			/** The message sender’s login. */
			user_login: string;
			/** The message sender’s user name. */
			user_name: string;
			/** The message’s status. */
			status: "approved" | "denied" | "invalid";
			/** The ID of the message that was flagged by automod. */
			message_id: string;
			/** The body of the message. */
			message: {
				/** The contents of the message caught by automod. */
				text: string;
				/** Ordered list of chat message fragments. */
				fragments: {
					/** Message text in a fragment. */
					text: string;
					/** Metadata pertaining to the emote. */
					emote: {
						/** An ID that uniquely identifies this emote. */
						id: string;
						/** An ID that identifies the emote set that the emote belongs to. */
						emote_set_id: string;
					} | null;
					cheermote: {
						/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. **For example,** if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
						prefix: string;
						/** The amount of Bits cheered. */
						bits: number;
						/** The tier level of the cheermote. */
						tier: number;
					} | null;
				}[];
			};
		};
	}
	export interface ChannelSharedChatSessionBegin extends Base<Subscription.ChannelSharedChatSessionBegin> {
		/** The data of `channel.shared_chat.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatbegin) */
		event: {
			/** The unique identifier for the shared chat session. */
			session_id: string;
			/** The User ID of the channel in the subscription condition which is now active in the shared chat session. */
			broadcaster_user_id: string;
			/** The display name of the channel in the subscription condition which is now active in the shared chat session. */
			broadcaster_user_name: string;
			/** The user login of the channel in the subscription condition which is now active in the shared chat session. */
			broadcaster_user_login: string;
			/** The User ID of the host channel. */
			host_broadcaster_user_id: string;
			/** The display name of the host channel. */
			host_broadcaster_user_name: string;
			/** The user login of the host channel. */
			host_broadcaster_user_login: string;
			/** The list of participants in the session. */
			participants: {
				/** The User ID of the participant channel. */
				broadcaster_user_id: string;
				/** The display name of the participant channel. */
				broadcaster_user_name: string;
				/** The user login of the participant channel. */
				broadcaster_user_login: string;
			}[];
		};
	}
	export interface ChannelSharedChatSessionUpdate extends Base<Subscription.ChannelSharedChatSessionUpdate> {
		/** The data of `channel.shared_chat.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatupdate) */
		event: {
			/** The unique identifier for the shared chat session. */
			session_id: string;
			/** The User ID of the channel in the subscription condition. */
			broadcaster_user_id: string;
			/** The display name of the channel in the subscription condition. */
			broadcaster_user_name: string;
			/** The user login of the channel in the subscription condition. */
			broadcaster_user_login: string;
			/** The User ID of the host channel. */
			host_broadcaster_user_id: string;
			/** The display name of the host channel. */
			host_broadcaster_user_name: string;
			/** The user login of the host channel. */
			host_broadcaster_user_login: string;
			/** The list of participants in the session. */
			participants: {
				/** The User ID of the participant channel. */
				broadcaster_user_id: string;
				/** The display name of the participant channel. */
				broadcaster_user_name: string;
				/** The user login of the participant channel. */
				broadcaster_user_login: string;
			}[];
		};
	}
	export interface ChannelSharedChatSessionEnd extends Base<Subscription.ChannelSharedChatSessionEnd> {
		/** The data of `channel.shared_chat.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend) */
		event: {
			/** The unique identifier for the shared chat session. */
			session_id: string;
			/** The User ID of the channel in the subscription condition which is no longer active in the shared chat session. */
			broadcaster_user_id: string;
			/** The display name of the channel in the subscription condition which is no longer active in the shared chat session. */
			broadcaster_user_name: string;
			/** The user login of the channel in the subscription condition which is no longer active in the shared chat session. */
			broadcaster_user_login: string;
			/** The User ID of the host channel. */
			host_broadcaster_user_id: string;
			/** The display name of the host channel. */
			host_broadcaster_user_name: string;
			/** The user login of the host channel. */
			host_broadcaster_user_login: string;
		};
	}
	export interface ChannelSubscribe extends Base<Subscription.ChannelSubscribe> {
		/** The data of `channel.subscribe` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe) */
		event: {
			/** The user ID for the user who subscribed to the specified channel. */
			user_id: string;
			/** The user login for the user who subscribed to the specified channel. */
			user_login: string;
			/** The user display name for the user who subscribed to the specified channel. */
			user_name: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The tier of the subscription. */
			tier: "1000" | "2000" | "3000";
			/** Whether the subscription is a gift. */
			is_gift: boolean;
		};
	}
	export namespace ChannelSubscription {
		export interface Message {
			/** The text of the resubscription chat message. */
			text: string;
			/** An array that includes the emote ID and start and end positions for where the emote appears in the text. */
			emotes: Emote[];
		}
		export interface Emote {
			/** The index of where the Emote starts in the text. */
			begin: number;
			/** The index of where the Emote ends in the text. */
			end: number;
			/** The emote ID. */
			id: string;
		}
	}
	export interface ChannelSubscriptionEnd extends Base<Subscription.ChannelSubscriptionEnd> {
		/** The data of `channel.subscription.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend) */
		event: {
			/** The user ID for the user whose subscription ended. */
			user_id: string;
			/** The user login for the user whose subscription ended. */
			user_login: string;
			/** The user display name for the user whose subscription ended. */
			user_name: string;
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The tier of the subscription that ended. */
			tier: "1000" | "2000" | "3000";
			/** Whether the subscription was a gift. */
			is_gift: boolean;
		};
	}
	export interface ChannelSubscriptionGift extends Base<Subscription.ChannelSubscriptionGift> {
		/** The data of `channel.subscription.gift` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift) */
		event: {
			/** The user ID of the user who sent the subscription gift. Set to `null` if it was an anonymous subscription gift. */
			user_id: string | null;
			/** The user login of the user who sent the gift. Set to `null` if it was an anonymous subscription gift. */
			user_login: string | null;
			/** The user display name of the user who sent the gift. Set to `null` if it was an anonymous subscription gift. */
			user_name: string | null;
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The number of subscriptions in the subscription gift. */
			total: number;
			/** The tier of subscriptions in the subscription gift. */
			tier: "1000" | "2000" | "3000";
			/** The number of subscriptions gifted by this user in the channel. This value is `null` for anonymous gifts or if the gifter has opted out of sharing this information. */
			cumulative_total: number | null;
			/** Whether the subscription gift was anonymous. */
			is_anonymous: boolean;
		};
	}
	export interface ChannelSubscriptionMessage extends Base<Subscription.ChannelSubscriptionMessage> {
		/** The data of `channel.subscription.message` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage) */
		event: {
			/** The user ID of the user who sent a resubscription chat message. */
			user_id: string;
			/** The user login of the user who sent a resubscription chat message. */
			user_login: string;
			/** The user display name of the user who sent a resubscription chat message. */
			user_name: string;
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The tier of the user’s subscription. */
			tier: "1000" | "2000" | "3000";
			/** An object that contains the resubscription message and emote information needed to recreate the message. */
			message: ChannelSubscription.Message;
			/** The total number of months the user has been subscribed to the channel. */
			cumulative_months: number;
			/** The number of consecutive months the user’s current subscription has been active. This value is `null` if the user has opted out of sharing this information. */
			streak_months: number | null;
			/** The month duration of the subscription. */
			duration_months: number;
		};
	}
	export interface ChannelCheer extends Base<Subscription.ChannelCheer> {
		/** The data of `channel.cheer` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer) */
		event: {
			/** Whether the user cheered anonymously or not. */
			is_anonymous: boolean;
			/** The user ID for the user who cheered on the specified channel. This is `null` if `is_anonymous` is `true`. */
			user_id: string | null;
			/** The user login for the user who cheered on the specified channel. This is `null` if `is_anonymous` is `true`. */
			user_login: string | null;
			/** The user display name for the user who cheered on the specified channel. This is `null` if `is_anonymous` is `true`. */
			user_name: string | null;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The message sent with the cheer. */
			message: string;
			/** The number of Bits cheered. */
			bits: number;
		};
	}
	export interface ChannelRaid extends Base<Subscription.ChannelRaid> {
		/** The data of `channel.raid` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid) */
		event: {
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
			/** The number of viewers in the raid. */
			viewers: number;
		};
	}
	export interface ChannelBan extends Base<Subscription.ChannelBan> {
		/** The data of `channel.ban` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban) */
		event: {
			/** The user ID for the user who was banned on the specified channel. */
			user_id: string;
			/** The user login for the user who was banned on the specified channel. */
			user_login: string;
			/** The user display name for the user who was banned on the specified channel. */
			user_name: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The user ID of the issuer of the ban. */
			moderator_user_id: string;
			/** The user login of the issuer of the ban. */
			moderator_user_login: string;
			/** The user name of the issuer of the ban. */
			moderator_user_name: string;
			/** The reason behind the ban. */
			reason: string;
			/** The UTC date and time (in RFC3339 format) of when the user was banned or put in a timeout. */
			banned_at: string;
			/** The UTC date and time (in RFC3339 format) of when the timeout ends. Is `null` if the user was banned instead of put in a timeout. */
			ends_at: string | null;
			/** Indicates whether the ban is permanent (`true`) or a timeout (`false`). If `true`, ends_at will be `null`. */
			is_permanent: boolean;
		};
	}
	export interface ChannelUnban extends Base<Subscription.ChannelUnban> {
		/** The data of `channel.unban` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban) */
		event: {
			/** The user id for the user who was unbanned on the specified channel. */
			user_id: string;
			/** The user login for the user who was unbanned on the specified channel. */
			user_login: string;
			/** The user display name for the user who was unbanned on the specified channel. */
			user_name: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The user ID of the issuer of the unban. */
			moderator_user_id: string;
			/** The user login of the issuer of the unban. */
			moderator_user_login: string;
			/** The user name of the issuer of the unban. */
			moderator_user_name: string;
		};
	}
	export interface ChannelUnbanRequestCreate extends Base<Subscription.ChannelUnbanRequestCreate> {
		/** The data of `channel.unban_request.create` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate) */
		event: {
			/** The ID of the unban request. */
			id: string;
			/** The broadcaster’s user ID for the channel the unban request was created for. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** User ID of user that is requesting to be unbanned. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** Message sent in the unban request. */
			text: string;
			/** The UTC timestamp (in RFC3339 format) of when the unban request was created. */
			created_at: string;
		};
	}
	export interface ChannelUnbanRequestResolve extends Base<Subscription.ChannelUnbanRequestResolve> {
		/** The data of `channel.unban_request.resolve` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve) */
		event: {
			/** The ID of the unban request. */
			id: string;
			/** The broadcaster’s user ID for the channel the unban request was updated for. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** User ID of moderator who approved/denied the request. */
			moderator_id: string | null;
			/** The moderator’s login name. */
			moderator_login: string;
			/** The moderator’s display name. */
			moderator_name: string;
			/** User ID of user that requested to be unbanned. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** Resolution text supplied by the mod/broadcaster upon approval/denial of the request. */
			resolution_text: string;
			/** Dictates whether the unban request was approved or denied. */
			status: "approved" | "canceled" | "denied";
		};
	}
	export interface ChannelModerate extends Base<Subscription.ChannelModerate> {
		/** The data of `channel.moderate` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate) */
		event: 
			| ChannelModerate.Followers | ChannelModerate.Slow | ChannelModerate.Vip | ChannelModerate.Unvip | ChannelModerate.Mod | ChannelModerate.Unmod
			| ChannelModerate.Ban | ChannelModerate.Unban | ChannelModerate.Timeout | ChannelModerate.Untimeout | ChannelModerate.Raid | ChannelModerate.Unraid
			| ChannelModerate.Delete | ChannelModerate.AutomodTerms | ChannelModerate.UnbanRequest | ChannelModerate.SharedChatBan | ChannelModerate.SharedChatUnban
			| ChannelModerate.SharedChatTimeout | ChannelModerate.SharedChatUntimeout | ChannelModerate.SharedChatDelete | ChannelModerate.Other;
	}
	export namespace ChannelModerate {
		export interface Action<Type extends string = string> {
			/** The ID of the broadcaster. */
			broadcaster_user_id: string;
			/** The login of the broadcaster. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster. */
			broadcaster_user_name: string;
			/** The channel in which the action originally occurred. Is the same as the broadcaster_user_id if not in shared chat. */
			source_broadcaster_user_id: string;
			/** The channel in which the action originally occurred. Is the same as the broadcaster_user_login if not in shared chat. */
			source_broadcaster_user_login: string;
			/** The channel in which the action originally occurred. Is `null` when the moderator action happens in the same channel as the broadcaster. Is not `null` when in a shared chat session, and the action happens in the channel of a participant other than the broadcaster. */
			source_broadcaster_user_name: string | null;
			/** The ID of the moderator who performed the action. */
			moderator_user_id: string;
			/** The login of the moderator. */
			moderator_user_login: string;
			/** The user name of the moderator. */
			moderator_user_name: string;
			/** The type of action. */
			action: Type;
		}
		export interface Followers extends Action<"followers"> {
			/** Metadata associated with the followers command. */
			followers: {
				/** The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat room. */
				follow_duration_minutes: number;
			};
		}
		export interface Slow extends Action<"slow"> {
			/** Metadata associated with the slow command. */
			slow: {
				/** The amount of time, in seconds, that users need to wait between sending messages. */
				wait_time_seconds: number;
			};
		}
		export interface Vip extends Action<"vip"> {
			/** Metadata associated with the vip command. */
			vip: {
				/** The ID of the user gaining VIP status. */
				user_id: string;
				/** The login of the user gaining VIP status. */
				user_login: string;
				/** The user name of the user gaining VIP status. */
				user_name: string;
			};
		}
		export interface Unvip extends Action<"unvip"> {
			/** Metadata associated with the unvip command. */
			unvip: {
				/** The ID of the user losing VIP status. */
				user_id: string;
				/** The login of the user losing VIP status. */
				user_login: string;
				/** The user name of the user losing VIP status. */
				user_name: string;
			}
		}
		export interface Mod extends Action<"mod"> {
			/** Metadata associated with the mod command. */
			mod: {
				/** The ID of the user gaining mod status. */
				user_id: string;
				/** The login of the user gaining mod status. */
				user_login: string;
				/** The user name of the user gaining mod status. */
				user_name: string;
			};
		}
		export interface Unmod extends Action<"unmod"> {
			/** Metadata associated with the unmod command. */
			unmod: {
				/** The ID of the user losing mod status. */
				user_id: string;
				/** The login of the user losing mod status. */
				user_login: string;
				/** The user name of the user losing mod status. */
				user_name: string;
			};
		}
		export interface Ban extends Action<"ban"> {
			/** Metadata associated with the ban command. */
			ban: {
				/** The ID of the user being banned. */
				user_id: string;
				/** The login of the user being banned. */
				user_login: string;
				/** The user name of the user being banned. */
				user_name: string;
				/** Reason given for the ban. */
				reason:	string | null;
			};
		}
		export interface Unban extends Action<"unban"> {
			/** Metadata associated with the unban command. */
			unban: {
				/** The ID of the user being unbanned. */
				user_id: string;
				/** The login of the user being unbanned. */
				user_login: string;
				/** The user name of the user being unbanned. */
				user_name: string;
			}
		}
		export interface Timeout extends Action<"timeout"> {
			timeout: {
				/** The ID of the user being timed out. */
				user_id: string;
				/** The login of the user being timed out. */
				user_login: string;
				/** The user name of the user being timed out. */
				user_name: string;
				/** The reason given for the timeout. */
				reason: string | null;
				/** The time at which the timeout ends. */
				expires_at: string;
			};
		}
		export interface Untimeout extends Action<"untimeout"> {
			/** Metadata associated with the untimeout command. */
			untimeout: {
				/** The ID of the user being untimed out. */
				user_id: string;
				/** The login of the user being untimed out. */
				user_login: string;
				/** The user name of the user untimed out. */
				user_name: string;
			};
		}
		export interface Raid extends Action<"raid"> {
			/** Metadata associated with the raid command. */
			raid: {
				/** The ID of the user being raided. */
				user_id: string;
				/** The login of the user being raided. */
				user_login: string;
				/** The user name of the user raided. */
				user_name: string;
				/** The viewer count. */
				viewer_count: number;
			};
		}
		export interface Unraid extends Action<"unraid"> {
			/** Metadata associated with the unraid command. */
			unraid: {
				/** The ID of the user no longer being raided. */
				user_id: string;
				/** The login of the user no longer being raided. */
				user_login: string;
				/** The user name of the no longer user raided. */
				user_name: string;
			};
		}
		export interface Delete extends Action<"delete"> {
			/** Metadata associated with the delete command. */
			"delete": {
				/** The ID of the user whose message is being deleted. */
				user_id: string;
				/** The login of the user. */
				user_login: string;
				/** The user name of the user. */
				user_name: string;
				/** The ID of the message being deleted. */
				message_id: string;
				/** The message body of the message being deleted. */
				message_body: string;
			}
		}
		export interface AutomodTerms extends Action<"add_blocked_term" | "add_permitted_term" | "remove_blocked_term" | "remove_permitted_term"> {
			/** Metadata associated with the automod terms changes. */
			automod_terms: {
				action: "add" | "remove";
				list: "blocked" | "permitted";
				/** Terms being added or removed. */
				terms: string[];
				/** Whether the terms were added due to an Automod message approve/deny action. */
				from_automod: boolean;
			};
		}
		export interface UnbanRequest extends Action<"approve_unban_request" | "deny_unban_request"> {
			/** Metadata associated with an unban request. */
			unban_request: {
				/** Whether or not the unban request was approved or denied. */
				is_approved: boolean;
				/** The ID of the banned user. */
				user_id: string;
				/** The login of the user. */
				user_login: string;
				/** The user name of the user. */
				user_name: string;
				/** The message included by the moderator explaining their approval or denial. */
				moderator_message: string;
			};
		}
		export interface SharedChatBan extends Omit<Ban, "action" | "ban"> {
			/** The type of action. */
			action: "shared_chat_ban";
			/** Metadata associated with a ban command in shared chat. */
			shared_chat_ban: Ban["ban"];
		}
		export interface SharedChatUnban extends Omit<Unban, "action" | "unban"> {
			/** The type of action. */
			action: "shared_chat_unban";
			/** Metadata associated with an unban command in shared chat. */
			shared_chat_ban: Unban["unban"];
		}
		export interface SharedChatTimeout extends Omit<Timeout, "action" | "timeout"> {
			/** The type of action. */
			action: "shared_chat_timeout";
			/** Metadata associated with an timeout command in shared chat. */
			shared_chat_ban: Timeout["timeout"];
		}
		export interface SharedChatUntimeout extends Omit<Untimeout, "action" | "untimeout"> {
			/** The type of action. */
			action: "shared_chat_untimeout";
			/** Metadata associated with an untimeout command in shared chat. */
			shared_chat_ban: Untimeout["untimeout"];
		}
		export interface SharedChatDelete extends Omit<Delete, "action" | "delete"> {
			/** The type of action. */
			action: "shared_chat_delete";
			/** Metadata associated with an delete command in shared chat. */
			shared_chat_ban: Delete["delete"];
		}
		export type Other = Action<"clear" | "emoteonly" | "emoteonlyoff" | "uniquechat" | "uniquechatoff" | "followersoff" | "slowoff" | "subscribers" | "subscribersoff">;
	}
	export interface ChannelModerateV2 extends Base<Subscription.ChannelModerateV2> {
		/** The data of `channel.moderate` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate) */
		event: 
			| ChannelModerate.Followers | ChannelModerate.Slow | ChannelModerate.Vip | ChannelModerate.Unvip | ChannelModerate.Mod | ChannelModerate.Unmod
			| ChannelModerate.Ban | ChannelModerate.Unban | ChannelModerate.Timeout | ChannelModerate.Untimeout | ChannelModerate.Raid | ChannelModerate.Unraid
			| ChannelModerate.Delete | ChannelModerate.AutomodTerms | ChannelModerate.UnbanRequest | ChannelModerateV2.Warn | ChannelModerate.SharedChatBan
			| ChannelModerate.SharedChatUnban | ChannelModerate.SharedChatTimeout | ChannelModerate.SharedChatUntimeout | ChannelModerate.SharedChatDelete | ChannelModerate.Other;
	}
	export namespace ChannelModerateV2 {
		export interface Warn extends ChannelModerate.Action<"warn"> {
			/** Metadata associated with the warn command. */
			warn: {
				/** The ID of the user being warned. */
				user_id: string;
				/** The login of the user being warned. */
				user_login: string;
				/** The user name of the user being warned. */
				user_name: string;
				/** Reason given for the warning. */
				reason: string | null;
				/** Chat rules cited for the warning. */
				chat_rules_cited: string[] | null;
			};
		}
	}
	export interface ChannelModeratorAdd extends Base<Subscription.ChannelModeratorAdd> {
		/** The data of `channel.moderator.add` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatoradd) */
		event: {
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The user ID of the new moderator. */
			user_id: string;
			/** The user login of the new moderator. */
			user_login: string;
			/** The display name of the new moderator. */
			user_name: string;
		};
	}
	export interface ChannelModeratorRemove extends Base<Subscription.ChannelModeratorRemove> {
		/** The data of `channel.moderator.remove` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove) */
		event: {
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The user ID of the removed moderator. */
			user_id: string;
			/** The user login of the removed moderator. */
			user_login: string;
			/** The display name of the removed moderator. */
			user_name: string;
		};
	}
	export interface ChannelGuestStarSessionBegin extends Base<Subscription.ChannelGuestStarSessionBegin> {
		/** The data of `channel.guest_star_session.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin) */
		event: {
			/** The broadcaster user ID. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** ID representing the unique session that was started. */
			session_id: string;
			/** RFC3339 timestamp indicating the time the session began. */
			started_at:	string;
		};
	}
	export interface ChannelGuestStarSessionEnd extends Base<Subscription.ChannelGuestStarSessionEnd> {
		/** The data of `channel.guest_star_session.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionend) */
		event: {
			/** The non-host broadcaster user ID. */
			broadcaster_user_id: string;
			/** The non-host broadcaster display name. */
			broadcaster_user_name: string;
			/** The non-host broadcaster login. */
			broadcaster_user_login: string;
			/** ID representing the unique session that was started. */
			session_id: string;
			/** RFC3339 timestamp indicating the time the session began. */
			started_at: string;
			/** RFC3339 timestamp indicating the time the session ended. */
			ended_at: string;
			/** User ID of the host channel. */
			host_user_id: string;
			/** The host display name. */
			host_user_name: string;
			/** The host login. */
			host_user_login: string;
		};
	}
	export interface ChannelGuestStarGuestUpdate extends Base<Subscription.ChannelGuestStarGuestUpdate> {
		/** The data of `channel.guest_star_session.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionupdate) */
		event: {
			/** The non-host broadcaster user ID. */
			broadcaster_user_id: string;
			/** The non-host broadcaster display name. */
			broadcaster_user_name: string;
			/** The non-host broadcaster login. */
			broadcaster_user_login: string;
			/** ID representing the unique session that was started. */
			session_id: string;
			/** The user ID of the moderator who updated the guest’s state (could be the host). Is `null` if the update was performed by the guest. */
			moderator_user_id: string | null;
			/** The moderator display name. Is `null` if the update was performed by the guest. */
			moderator_user_name: string | null;
			/** The moderator login. Is `null` if the update was performed by the guest. */
			moderator_user_login: string | null;
			/** The user ID of the guest who transitioned states in the session. Is `null` if the slot is now empty. */
			guest_user_id: string | null;
			/** The guest display name. Is `null` if the slot is now empty. */
			guest_user_name: string | null;
			/** The guest login. Is `null` if the slot is now empty. */
			guest_user_login: string | null;
			/** The ID of the slot assignment the guest is assigned to. Is `null` if the guest is in the `invited`, `removed`, `ready`, or `accepted` state. */
			slot_id: string | null;
			/**
			 * The current state of the user after the update has taken place. Is `null` if the slot is now empty. Can otherwise be one of the following:
			 * - `invited` — The guest has transitioned to the invite queue. This can take place when the guest was previously assigned a slot, but have been removed from the call and are sent back to the invite queue.
			 * - `accepted` — The guest has accepted the invite and is currently in the process of setting up to join the session.
			 * - `ready` — The guest has signaled they are ready and can be assigned a slot.
			 * - `backstage` — The guest has been assigned a slot in the session, but is not currently seen live in the broadcasting software.
			 * - `live` — The guest is now live in the host's broadcasting software.
			 * - `removed` — The guest was removed from the call or queue.
			 * - `accepted` — The guest has accepted the invite to the call.
			 */
			state: "invited" | "accepted" | "ready" | "backstage" | "live" | "removed" | "accepted" | null;
			/** User ID of the host channel. */
			host_user_id: string;
			/** The host display name. */
			host_user_name: string;
			/** The host login. */
			host_user_login: string;
			/** Flag that signals whether the host is allowing the slot’s video to be seen by participants within the session. Is `null` if the guest is not slotted. */
			host_video_enabled: boolean | null;
			/** Flag that signals whether the host is allowing the slot’s audio to be heard by participants within the session. Is `null` if the guest is not slotted. */
			host_audio_enabled: boolean | null;
			/** Value between 0-100 that represents the slot’s audio level as heard by participants within the session. Is `null` if the guest is not slotted. */
			host_volume: number | null;
		};
	}
	export interface ChannelGuestStarSettingsUpdate extends Base<Subscription.ChannelGuestStarSettingsUpdate> {
		/** The data of `channel.guest_star_settings.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_settingsupdate) */
		event: {
			/** User ID of the host channel. */
			broadcaster_user_id: string;
			/** The broadcaster display name. */
			broadcaster_user_name: string;
			/** The broadcaster login. */
			broadcaster_user_login: string;
			/** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
			is_moderator_send_live_enabled: boolean;
			/** Number of slots the Guest Star call interface will allow the host to add to a call. */
			slot_count: number;
			/** Flag determining if browser sources subscribed to sessions on this channel should output audio. */
			is_browser_source_audio_enabled: boolean;
			/**
			 * This setting determines how the guests within a session should be laid out within a group browser source. Can be one of the following values:
			 * - `tiled` — All live guests are tiled within the browser source with the same size.
			 * - `screenshare` — All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests.
			 * - `horizontal_top` — Indicates the group layout will contain all participants in a top-aligned horizontal stack.
			 * - `horizontal_bottom` — Indicates the group layout will contain all participants in a bottom-aligned horizontal stack.
			 * - `vertical_left` — Indicates the group layout will contain all participants in a left-aligned vertical stack.
			 * - `vertical_right` — Indicates the group layout will contain all participants in a right-aligned vertical stack.
			 */
			group_layout: "tiled" | "screenshare" | "horizontal_top" | "horizontal_bottom" | "vertical_left" | "vertical_right";
		};
	}
	export namespace ChannelPoints {
		export interface MaxPerStream {
			/** Is the setting enabled. */
			is_enabled: boolean;
			/** The max per stream limit. */
			value: number;
		}
		export interface MaxPerUserPerStream {
			/** Is the setting enabled. */
			is_enabled: boolean;
			/** The max per user per stream limit. */
			value: number;
		}
		export interface Image {
			/** URL for the image at 1x size. */
			url_1x: string;
			/** URL for the image at 2x size. */
			url_2x: string;
			/** URL for the image at 4x size. */
			url_4x: string;
		}
		export interface GlobalCooldown {
			/** Is the setting enabled. */
			is_enabled: boolean;
			/** The cooldown in seconds. */
			seconds: number;
		}
		export interface Reward {
			/** The reward identifier. */
			id: string;
			/** The reward name. */
			title: string;
			/** The reward cost. */
			cost: number;
			/** The reward description. */
			prompt: string;
		}
	}
	export interface ChannelPointsAutomaticRewardRedemptionAdd extends Base<Subscription.ChannelPointsAutomaticRewardRedemptionAdd> {
		/** The data of `channel.channel_points_automatic_reward_redemption.add` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd) */
		event: {
			/** The ID of the channel where the reward was redeemed. */
			broadcaster_user_id: string;
			/** The login of the channel where the reward was redeemed. */
			broadcaster_user_login: string;
			/** The display name of the channel where the reward was redeemed. */
			broadcaster_user_name: string;
			/** The ID of the redeeming user. */
			user_id: string;
			/** The login of the redeeming user. */
			user_login: string;
			/** The display name of the redeeming user. */
			user_name: string;
			/** The ID of the Redemption. */
			id: string;
			/** An object that contains the reward information. */
			reward:	{
				/** The type of reward. */
				type: "single_message_bypass_sub_mode" | "send_highlighted_message" | "random_sub_emote_unlock" | "chosen_sub_emote_unlock" | "chosen_modified_sub_emote_unlock" | "message_effect" | "gigantify_an_emote" | "celebration";
				/** The reward cost. */
				cost: number;
				/** Emote that was unlocked. */
				unlocked_emote: { 
					/** The emote ID. */
					id:	string;
					/** The human readable emote token. */
					name: string;
				} | null;
			};
			/** An object that contains the user message and emote information needed to recreate the message. */
			message: {
				/** The text of the chat message. */
				text: string;
				/** An array that includes the emote ID and start and end positions for where the emote appears in the text. */
				emotes: {
					/** The emote ID. */
					id: string;
					/** The index of where the Emote starts in the text. */
					begin: number;
					/** The index of where the Emote ends in the text. */
					end: number;
				}[];
			};
			/** A string that the user entered if the reward requires input. */
			user_input: string | null;
			/** The UTC date and time (in RFC3339 format) of when the reward was redeemed. */
			redeemed_at: string;
		};
	}
	export interface ChannelPointsAutomaticRewardRedemptionAddV2 extends Base<Subscription.ChannelPointsAutomaticRewardRedemptionAddV2> {
		/** The data of `channel.channel_points_automatic_reward_redemption.add` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionaddv2) */
		event: {
			/** The ID of the channel where the reward was redeemed. */
			broadcaster_user_id: string;
			/** The login of the channel where the reward was redeemed. */
			broadcaster_user_login: string;
			/** The display name of the channel where the reward was redeemed. */
			broadcaster_user_name: string;
			/** The ID of the redeeming user. */
			user_id: string;
			/** The login of the redeeming user. */
			user_login: string;
			/** The display name of the redeeming user. */
			user_name: string;
			/** The ID of the Redemption. */
			id: string;
			/** An object that contains the reward information. */
			reward:	{
				/** The type of reward. */
				type: "single_message_bypass_sub_mode" | "send_highlighted_message" | "random_sub_emote_unlock" | "chosen_sub_emote_unlock" | "chosen_modified_sub_emote_unlock";
				/** Number of channel points used. */
				channel_points: number;
				/** Emote associated with the reward. */
				emote: { 
					/** The emote ID. */
					id:	string;
					/** The human readable emote token. */
					name: string;
				} | null;
			};
			/** An object that contains the user message and emote information needed to recreate the message. */
			message: {
				/** The text of the chat message. */
				text: string;
				/** The ordered list of chat message fragments. */
				fragments: ({
					/** The message text in fragment. */
					text: string;
					/** The type of message fragment. */
					type: "text";
				} |
				{
					/** The message text in fragment. */
					text: string;
					/** The type of message fragment. */
					type: "emote";
					/** The metadata pertaining to the emote. */
					emote: {
						/** The ID that uniquely identifies this emote. */
						id: string;
					};
				})[];
			} | null;
			/** The UTC date and time (in RFC3339 format) of when the reward was redeemed. */
			redeemed_at: string;
		};
	}
	export interface ChannelPointsCustomRewardAdd extends Base<Subscription.ChannelPointsCustomRewardAdd> {
		/** The data of `channel.channel_points_custom_reward.add` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardadd) */
		event: {
			/** The reward identifier. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Is the reward currently enabled. If `false`, the reward won’t show up to viewers. */
			is_enabled: boolean;
			/** Is the reward currently paused. If true, viewers can’t redeem. */
			is_paused: boolean;
			/** Is the reward currently in stock. If false, viewers can’t redeem. */
			is_in_stock: boolean;
			/** The reward title. */
			title: string;
			/** The reward cost. */
			cost: number;
			/** The reward description. */
			prompt: string;
			/** Does the viewer need to enter information when redeeming the reward. */
			is_user_input_required: boolean;
			/** Should redemptions be set to `fulfilled` status immediately when redeemed and skip the request queue instead of the normal `unfulfilled` status. */
			should_redemptions_skip_request_queue: boolean;
			/** Whether a maximum per stream is enabled and what the maximum is. */
			max_per_stream: ChannelPoints.MaxPerStream;
			/** Whether a maximum per user per stream is enabled and what the maximum is. */
			max_per_user_per_stream: ChannelPoints.MaxPerUserPerStream;
			/** Custom background color for the reward. Format: Hex with # prefix. Example: `#FA1ED2`. */
			background_color: string;
			/** Set of custom images of 1x, 2x and 4x sizes for the reward. Can be `null` if no images have been uploaded. */
			image: ChannelPoints.Image | null;
			/** Set of default images of 1x, 2x and 4x sizes for the reward. */
			default_image: ChannelPoints.Image;
			/** Whether a cooldown is enabled and what the cooldown is in seconds. */
			global_cooldown: ChannelPoints.GlobalCooldown;
			/** Timestamp of the cooldown expiration. Is `null` if the reward isn’t on cooldown. */
			cooldown_expires_at: string | null;
			/** The number of redemptions redeemed during the current live stream. Counts against the `max_per_stream` limit. Is `null` if the broadcasters stream isn’t live or `max_per_stream` isn’t enabled. */
			redemptions_redeemed_current_stream: number | null;
		};
	}
	export interface ChannelPointsCustomRewardUpdate extends Base<Subscription.ChannelPointsCustomRewardUpdate> {
		/** The data of `channel.channel_points_custom_reward.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate) */
		event: ChannelPointsCustomRewardAdd["event"];
	}
	export interface ChannelPointsCustomRewardRemove extends Base<Subscription.ChannelPointsCustomRewardRemove> {
		/** The data of `channel.channel_points_custom_reward.remove` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove) */
		event: ChannelPointsCustomRewardAdd["event"];
	}
	export interface ChannelPointsCustomRewardRedemptionAdd extends Base<Subscription.ChannelPointsCustomRewardRedemptionAdd> {
		/** The data of `channel.channel_points_custom_reward_redemption.add` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd) */
		event: {
			/** The redemption identifier. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** User ID of the user that redeemed the reward. */
			user_id: string;
			/** Login of the user that redeemed the reward. */
			user_login: string;
			/** Display name of the user that redeemed the reward. */
			user_name: string;
			/** The user input provided. Empty string if not provided. */
			user_input: string;
			/** The status of reward redemption. */
			status: "unknown" | "unfulfilled" | "fulfilled" | "canceled";
			/** Basic information about the reward that was redeemed, at the time it was redeemed. */
			reward: ChannelPoints.Reward;
			/** RFC3339 timestamp of when the reward was redeemed. */
			redeemed_at: string;
		};
	}
	export interface ChannelPointsCustomRewardRedemptionUpdate extends Base<Subscription.ChannelPointsCustomRewardRedemptionUpdate> {
		/** The data of `channel.channel_points_custom_reward_redemption.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionupdate) */
		event: ChannelPointsCustomRewardRedemptionAdd["event"];
	}
	export namespace ChannelPoll {
		/** Choice for a particular poll. Each poll’s event payload includes a choices array. The choices array contains an object that describes each choice and, if applicable, the votes for that choice. */
		export interface Choice {
			/** ID for the choice. */
			id: string;
			/** Text displayed for the choice. */
			title: string;
			/** Not used. */
			bits_votes: 0;
			/** Number of votes received via Channel Points. */
			channel_points_votes: number;
			/** Total number of votes received for the choice across all methods of voting. */
			votes: number;
		}
		export interface BitsVoting {
			is_enabled: false;
			amount_per_vote: 0;
		}
		export interface ChannelPointsVoting {
			/** Indicates if Channel Points can be used for voting. */
			is_enabled: boolean;
			/** Number of Channel Points required to vote once with Channel Points. */
			amount_per_vote: number;
		}
	}
	export interface ChannelPollBegin extends Base<Subscription.ChannelPollBegin> {
		/** The data of `channel.poll.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin) */
		event: {
			/** ID of the poll. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Question displayed for the poll. */
			title: string;
			/** An array of choices for the poll. */
			choices: ChannelPoll.Choice[];
			/** Not supported. */
			bits_voting: ChannelPoll.BitsVoting;
			/** The Channel Points voting settings for the poll. */
			channel_points_voting: ChannelPoll.ChannelPointsVoting;
			/** The time the poll started. */
			started_at: string;
			/** The time the poll will end. */
			ends_at: string;
		};
	}
	export interface ChannelPollProgress extends Base<Subscription.ChannelPollProgress> {
		/** The data of `channel.poll.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress) */
		event: {
			/** ID of the poll. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Question displayed for the poll. */
			title: string;
			/** An array of choices for the poll. Includes vote counts. */
			choices: ChannelPoll.Choice[];
			/** Not supported. */
			bits_voting: ChannelPoll.BitsVoting;
			/** The Channel Points voting settings for the poll. */
			channel_points_voting: ChannelPoll.ChannelPointsVoting;
			/** The time the poll started. */
			started_at: string;
			/** The time the poll will end. */
			ends_at: string;
		};
	}
	export interface ChannelPollEnd extends Base<Subscription.ChannelPollEnd> {
		/** The data of `channel.poll.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend) */
		event: {
			/** ID of the poll. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Question displayed for the poll. */
			title: string;
			/** An array of choices for the poll. Includes vote counts. */
			choices: ChannelPoll.Choice[];
			/** Not supported. */
			bits_voting: ChannelPoll.BitsVoting;
			/** The Channel Points voting settings for the poll. */
			channel_points_voting: ChannelPoll.ChannelPointsVoting;
			/** The status of the poll. */
			status: "completed" | "archived" | "terminated";
			/** The time the poll started. */
			started_at: string;
			/** The time the poll ended. */
			ended_at: string;
		};
	}
	export namespace ChannelPrediction {
		/** An outcome for a particular Channel Points Prediction. Each Prediction’s event payload includes an outcomes array. The outcomes array contains an object that describes each outcome and, if applicable, the number of users who selected that outcome, the number of Channel Points for that outcome, and an array of [top_predictors](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#top-predictors). */
		export interface Outcome<TopPredictors extends TopPredictor[] | undefined = undefined> {
			/** The outcome ID. */
			id: string;
			/** The outcome title. */
			title: string;
			/** The color for the outcome. */
			color: "pink" | "blue";
			/** The number of users who used Channel Points on this outcome. */
			users: number;
			/** The total number of Channel Points used on this outcome. */
			channel_points: number;
			/** An array of users who used the most Channel Points on this outcome. */
			top_predictors: TopPredictors;
		}
		/** Describe user who participated in a Channel Points Prediction. Usually this is a part of array of up to 10 objects. */
		export interface TopPredictor {
			/** The ID of the user. */
			user_id: string;
			/** The login of the user. */
			user_login: string;
			/** The display name of the user. */
			user_name: string;
			/** The number of Channel Points won. This value is always `null` in the event payload for Prediction progress and Prediction lock. This value is `0` if the outcome did not win or if the Prediction was canceled and Channel Points were refunded. */
			channel_points_won: number | null;
			/** The number of Channel Points used to participate in the Prediction. */
			channel_points_used: number;
		}
	}
	export interface ChannelPredictionBegin extends Base<Subscription.ChannelPredictionBegin> {
		/** The data of `channel.prediction.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin) */
		event: {
			/** Channel Points Prediction ID. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Title for the Channel Points Prediction. */
			title: string;
			/** An array of outcomes for the Channel Points Prediction. */
			outcomes: ChannelPrediction.Outcome[];
			/** The time the Channel Points Prediction started. */
			started_at: string;
			/** The time the Channel Points Prediction will automatically lock. */
			locks_at: string;
		};
	}
	export interface ChannelPredictionProgress extends Base<Subscription.ChannelPredictionProgress> {
		/** The data of `channel.prediction.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress) */
		event: {
			/** Channel Points Prediction ID. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Title for the Channel Points Prediction. */
			title: string;
			/** An array of outcomes for the Channel Points Prediction. Includes [top_predictors](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#top-predictors). */
			outcomes: ChannelPrediction.Outcome<ChannelPrediction.TopPredictor[]>[];
			/** The time the Channel Points Prediction started. */
			started_at: string;
			/** The time the Channel Points Prediction will automatically lock. */
			locks_at: string;
		};
	}
	export interface ChannelPredictionLock extends Base<Subscription.ChannelPredictionLock> {
		/** The data of `channel.prediction.lock` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionlock) */
		event: {
			/** Channel Points Prediction ID. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Title for the Channel Points Prediction. */
			title: string;
			/** An array of outcomes for the Channel Points Prediction. Includes [top_predictors](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#top-predictors). */
			outcomes: ChannelPrediction.Outcome<ChannelPrediction.TopPredictor[]>[];
			/** The time the Channel Points Prediction started. */
			started_at: string;
			/** The time the Channel Points Prediction was locked. */
			locks_at: string;
		};
	}
	export interface ChannelPredictionEnd extends Base<Subscription.ChannelPredictionEnd> {
		/** The data of `channel.prediction.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionend) */
		event: {
			/** Channel Points Prediction ID. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Title for the Channel Points Prediction. */
			title: string;
			/** ID of the winning outcome. */
			winning_outcome_id: string;
			/** An array of outcomes for the Channel Points Prediction. Includes [top_predictors](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#top-predictors). */
			outcomes: ChannelPrediction.Outcome<ChannelPrediction.TopPredictor[]>[];
			/** The status of the Channel Points Prediction. */
			status: "resolved" | "canceled";
			/** The time the Channel Points Prediction started. */
			started_at: string;
			/** The time the Channel Points Prediction ended. */
			ended_at: string;
		};
	}
	export interface ChannelSuspiciousUserUpdate extends Base<Subscription.ChannelSuspiciousUserUpdate> {
		/** The data of `channel.suspicious_user.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate) */
		event: {
			/** The ID of the channel where the treatment for a suspicious user was updated. */
			broadcaster_user_id: string;
			/** The display name of the channel where the treatment for a suspicious user was updated. */
			broadcaster_user_name: string;
			/** The login of the channel where the treatment for a suspicious user was updated. */
			broadcaster_user_login: string;
			/** The ID of the moderator that updated the treatment for a suspicious user. */
			moderator_user_id: string;
			/** The display name of the moderator that updated the treatment for a suspicious user. */
			moderator_user_name: string;
			/** The login of the moderator that updated the treatment for a suspicious user. */
			moderator_user_login: string;
			/** The ID of the suspicious user whose treatment was updated. */
			user_id: string;
			/** The display name of the suspicious user whose treatment was updated. */
			user_name: string;
			/** The login of the suspicious user whose treatment was updated. */
			user_login: string;
			/** The status set for the suspicious user. */
			low_trust_status: "none" | "active_monitoring" | "restricted";
		};
	}
	export interface ChannelSuspiciousUserMessage extends Base<Subscription.ChannelSuspiciousUserMessage> {
		/** The data of `channel.suspicious_user.message` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage) */
		event: {
			/** The ID of the channel where the treatment for a suspicious user was updated. */
			broadcaster_user_id: string;
			/** The display name of the channel where the treatment for a suspicious user was updated. */
			broadcaster_user_name: string;
			/** The login of the channel where the treatment for a suspicious user was updated. */
			broadcaster_user_login: string;
			/** The user ID of the user that sent the message. */
			user_id: string;
			/** The user name of the user that sent the message. */
			user_name: string;
			/** The user login of the user that sent the message. */
			user_login: string;
			/** The status set for the suspicious user. */
			low_trust_status: "none" | "active_monitoring" | "restricted";
			/** A list of channel IDs where the suspicious user is also banned. */
			shared_ban_channel_ids: string[];
			/** User types (if any) that apply to the suspicious user. */
			types: ("manually_added" | "ban_evader" | "banned_in_shared_channel")[];
			/** A ban evasion likelihood value (if any) that has been applied to the user automatically by Twitch. */
			ban_evasion_evaluation: "unknown" | "possible" | "likely";
			/** The structured chat message. */
			message: {
				/** The UUID that identifies the message. */
				message_id: string;
				/** The chat message in plain text. */
				text: string;
				/** Ordered list of chat message fragments. */
				fragments: AutomodMessage.MessageFragment[];
			};
		};
	}
	export interface ChannelVipAdd extends Base<Subscription.ChannelVipAdd> {
		/** The data of `channel.vip.add` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd) */
		event: {
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
		};
	}
	export interface ChannelVipRemove extends Base<Subscription.ChannelVipRemove> {
		/** The data of `channel.vip.remove` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipremove) */
		event: {
			/** The ID of the user who was removed as a VIP. */
			user_id: string;
			/** The login of the user who was removed as a VIP. */
			user_login: string;
			/** The display name of the user who was removed as a VIP. */
			user_name: string;
			/** The ID of the broadcaster. */
			broadcaster_user_id: string;
			/** The login of the broadcaster. */
			broadcaster_user_login: string;
			/** The display name of the broadcaster. */
			broadcaster_user_name: string;
		};
	}
	export interface ChannelWarningAcknowledge extends Base<Subscription.ChannelWarningAcknowledge> {
		/** The data of `channel.warning.acknowledge` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge) */
		event: {
			/** The user ID of the broadcaster. */
			broadcaster_user_id: string;
			/** The login of the broadcaster. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster. */
			broadcaster_user_name: string;
			/** The ID of the user that has acknowledged their warning. */
			user_id: string;
			/** The login of the user that has acknowledged their warning. */
			user_login: string;
			/** The user name of the user that has acknowledged their warning. */
			user_name: string;
		};
	}
	export interface ChannelWarningSend extends Base<Subscription.ChannelWarningSend> {
		/** The data of `channel.warning.send` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend) */
		event: {
			/** The user ID of the broadcaster. */
			broadcaster_user_id: string;
			/** The login of the broadcaster. */
			broadcaster_user_login: string;
			/** The user name of the broadcaster. */
			broadcaster_user_name: string;
			/** The user ID of the moderator who sent the warning. */
			moderator_user_id: string;
			/** The login of the moderator. */
			moderator_user_login: string;
			/** The user name of the moderator. */
			moderator_user_name: string;
			/** The ID of the user being warned. */
			user_id: string;
			/** The login of the user being warned. */
			user_login: string;
			/** The user name of the user being warned. */
			user_name: string;
			/** The reason given for the warning. */
			reason: string | null;
			/** The chat rules cited for the warning. */
			chat_rules_cited: string[] | null;
		};
	}
	export namespace ChannelCharity {
		export interface Amount {
			/** The monetary amount. The amount is specified in the currency’s minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
			value: number;
			/** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
			decimal_places: number;
			/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
			currency: string;
		}
	}
	export interface ChannelCharityCampaignDonate extends Base<Subscription.ChannelCharityCampaignDonate> {
		/** The data of `channel.charity_campaign.donate` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaigndonate) */
		event: {
			/** An ID that identifies the donation. The ID is unique across campaigns. */
			id: string;
			/** An ID that identifies the charity campaign. */
			campaign_id: string;
			/** An ID that identifies the broadcaster that’s running the campaign. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** An ID that identifies the user that donated to the campaign. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** The charity’s name. */
			charity_name: string;
			/** A description of the charity. */
			charity_description: string;
			/** A URL to an image of the charity’s logo. The image’s type is PNG and its size is 100px X 100px. */
			charity_logo: string;
			/** A URL to the charity’s website. */
			charity_website: string;
			/** An object that contains the amount of money that the user donated. */
			amount: ChannelCharity.Amount;
		};
	}
	export interface ChannelCharityCampaignStart extends Base<Subscription.ChannelCharityCampaignStart> {
		/** The data of `channel.charity_campaign.start` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstart) */
		event: {
			/** An ID that identifies the charity campaign. */
			id: string;
			/** An ID that identifies the broadcaster that’s running the campaign. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The charity’s name. */
			charity_name: string;
			/** A description of the charity. */
			charity_description: string;
			/** A URL to an image of the charity’s logo. The image’s type is PNG and its size is 100px X 100px. */
			charity_logo: string;
			/** A URL to the charity’s website. */
			charity_website: string;
			/** An object that contains the current amount of donations that the campaign has received. */
			current_amount: ChannelCharity.Amount;
			/** An object that contains the campaign’s target fundraising goal. */
			target_amount: ChannelCharity.Amount;
			/** The UTC timestamp (in RFC3339 format) of when the broadcaster started the campaign. */
			started_at: string;
		};
	}
	export interface ChannelCharityCampaignProgress extends Base<Subscription.ChannelCharityCampaignProgress> {
		/** The data of `channel.charity_campaign.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignprogress) */
		event: {
			/** An ID that identifies the charity campaign. */
			id: string;
			/** An ID that identifies the broadcaster that’s running the campaign. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The charity’s name. */
			charity_name: string;
			/** A description of the charity. */
			charity_description: string;
			/** A URL to an image of the charity’s logo. The image’s type is PNG and its size is 100px X 100px. */
			charity_logo: string;
			/** A URL to the charity’s website. */
			charity_website: string;
			/** An object that contains the current amount of donations that the campaign has received. */
			current_amount: ChannelCharity.Amount;
			/** An object that contains the campaign’s target fundraising goal. */
			target_amount: ChannelCharity.Amount;
		};
	}
	export interface ChannelCharityCampaignStop extends Base<Subscription.ChannelCharityCampaignStop> {
		/** The data of `channel.charity_campaign.stop` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop) */
		event: {
			/** An ID that identifies the charity campaign. */
			id: string;
			/** An ID that identifies the broadcaster that ran the campaign. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The charity’s name. */
			charity_name: string;
			/** A description of the charity. */
			charity_description: string;
			/** A URL to an image of the charity’s logo. The image’s type is PNG and its size is 100px X 100px. */
			charity_logo: string;
			/** A URL to the charity’s website. */
			charity_website: string;
			/** An object that contains the final amount of donations that the campaign received. */
			current_amount: ChannelCharity.Amount;
			/** An object that contains the campaign’s target fundraising goal. */
			target_amount: ChannelCharity.Amount;
			/** The UTC timestamp (in RFC3339 format) of when the broadcaster stopped the campaign. */
			stopped_at: string;
		};
	}
	export interface ConduitShardDisabled extends Base<Subscription.ConduitShardDisabled> {
		/** The data of `conduit.shard.disabled` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled) */
		event: {
			/** The ID of the conduit. */
			conduit_id: string;
			/** The ID of the disabled shard. */
			shard_id: string;
			/** The new status of the transport. */
			status: string;
			/** The disabled transport. */
			transport: Subscription.ConduitShardDisabled; // TODO
		};
	}
	export interface DropEntitlementGrant extends Base<Subscription.DropEntitlementGrant> {
		/** The data of `drop.entitlement.grant` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant) */
		events: {
			/** Individual event ID, as assigned by  Use this for de-duplicating messages. */
			id: string;
			/** Entitlement object. */
			data: {
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
			};
		}[];
	}
	export namespace ExtensionBitsTransaction {
		export interface Product {
			/** Product name. */
			name: string;
			/** Bits involved in the transaction. */
			bits: number;
			/** Unique identifier for the product acquired. */
			sku: string;
			/** Flag indicating if the product is in development. If in_development is true, bits will be 0. */
			in_development: boolean;
		};
	}
	export interface ExtensionBitsTransactionCreate extends Base<Subscription.ExtensionBitsTransactionCreate> {
		/** The data of `extension.bits_transaction.create` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate) */
		event: {
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
			product: ExtensionBitsTransaction.Product;
		};
	}
	export namespace ChannelGoal {
		export interface Event {
			/** An ID that identifies this event. */
			id: string;
			/** An ID that uniquely identifies the broadcaster. */
			broadcaster_user_id: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** The broadcaster’s user handle. */
			broadcaster_user_login: string;
			/** 
			 * The type of goal. Possible values are:
			 * - `follow` — The goal is to increase followers.
			 * - `subscription` — The goal is to increase subscriptions. This type shows the net increase or decrease in tier points associated with the subscriptions.
			 * - `subscription_count` — The goal is to increase subscriptions. This type shows the net increase or decrease in the number of subscriptions.
			 * - `new_subscription` — The goal is to increase subscriptions. This type shows only the net increase in tier points associated with the subscriptions (it does not account for users that unsubscribed since the goal started).
			 * - `new_subscription_count` — The goal is to increase subscriptions. This type shows only the net increase in the number of subscriptions (it does not account for users that unsubscribed since the goal started).
			 * - `new_bit` — The goal is to increase the amount of Bits used on the channel.
			 * - `new_cheerer` — The goal is to increase the number of unique Cheerers to Cheer on the channel.
			 */
			type: "follow" | "subscription" | "subscription_count" | "new_subscription" | "new_subscription_count" | "new_bit" | "new_cheerer";
			/** A description of the goal, if specified. The description may contain a maximum of 40 characters. */
			description: string | null;
			/** 
			 * The goal’s `type` determines how goal’s current value is increased or decreased.
			 * - If `type` is `follow`, this field is set to the broadcaster's current number of followers. This number increases with new followers and decreases when users unfollow the broadcaster.
			 * - If `type` is `subscription`, this field is increased and decreased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased or decreased by 2, not 1.
			 * - If `type` is `subscription_count`, this field is increased by 1 for each new subscription and decreased by 1 for each user that unsubscribes.
			 * - If `type` is `new_subscription`, this field is increased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased by 2, not 1.
			 * - If `type` is `new_subscription_count`, this field is increased by 1 for each new subscription.
			 */
			current_amount: number;
			/** The goal’s target value. */
			target_amount: number;
			/** The UTC timestamp in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339) format, which indicates when the broadcaster created the goal. */
			started_at: string;
		}
		export interface EventEnd extends Event {
			/** A Boolean value that indicates whether the broadcaster achieved their goal. Is `true` if the goal was achieved, otherwise `false`. */
			is_achieved: boolean;
			/** The UTC timestamp in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339) format, which indicates when the broadcaster ended the goal. */
			ended_at: string;
		}
	}
	export interface ChannelGoalBegin extends Base<Subscription.ChannelGoalBegin> {
		/** The data of `channel.goal.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#goal-subscriptions) */
		event: ChannelGoal.Event;
	}
	export interface ChannelGoalProgress extends Base<Subscription.ChannelGoalProgress> {
		/** The data of `channel.goal.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#goal-subscriptions) */
		event: ChannelGoal.Event;
	}
	export interface ChannelGoalEnd extends Base<Subscription.ChannelGoalEnd> {
		/** The data of `channel.goal.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#goal-subscriptions) */
		event: ChannelGoal.EventEnd;
	}
	export namespace ChannelHypeTrain {
		export type Contribution = Contribution.Bits | Contribution.Subscription | Contribution.Other;
		export namespace Contribution {
			export interface Bits<Type extends string = "bits", Total extends number = number> {
				/** The ID of the user that made the contribution. */
				user_id: string;
				/** The user’s login name. */
				user_login: string;
				/** The user’s display name. */
				user_name: string;
				/**
				 * The contribution method used. Possible values are:
				 * - `bits` — Cheering with Bits.
				 * - `subscription` — Subscription activity like subscribing or gifting subscriptions.
				 * - `other` — Covers other contribution methods not listed.
				 */
				type: Type;
				/** The total amount contributed. If `type` is `bits`, `total` represents the amount of Bits used. If `type` is `subscription`, `total` is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
				total: Total;
			}
			export type Subscription = Bits<"subscription", 500 | 1000 | 2500>;
			export type Other = Bits<"other", 500 | 1000 | 2500>;
		}
	}
	export interface ChannelHypeTrainBegin extends Base<Subscription.ChannelHypeTrainBegin> {
		/** The data of `channel.hype_train.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin) */
		event: {
			/** The Hype Train ID. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** Total points contributed to the Hype Train. */
			total: number;
			/** The number of points contributed to the Hype Train at the current level. */
			progress: number;
			/** The number of points required to reach the next level. */
			goal: number;
			/** The contributors with the most points contributed. */
			top_contributions: ChannelHypeTrain.Contribution[];
			/** The most recent contribution. */
			last_contribution: ChannelHypeTrain.Contribution;
			/** The current level of the Hype Train. */
			level: number;
			/** The time when the Hype Train started. */
			started_at: string;
			/** The time when the Hype Train expires. The expiration is extended when the Hype Train reaches a new level. */
			expires_at: string;
			/** Indicates if the Hype Train is a Golden Kappa Train. */
			is_golden_kappa_train: boolean;
		};
	}
	export interface ChannelHypeTrainProgress extends Base<Subscription.ChannelHypeTrainProgress> {
		/** The data of `channel.hype_train.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin) */
		event: ChannelHypeTrainBegin["event"];
	}
	export interface ChannelHypeTrainEnd extends Base<Subscription.ChannelHypeTrainEnd> {
		/** The data of `channel.hype_train.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainend) */
		event: {
			/** The Hype Train ID. */
			id: string;
			/** The requested broadcaster ID. */
			broadcaster_user_id: string;
			/** The requested broadcaster login. */
			broadcaster_user_login: string;
			/** The requested broadcaster display name. */
			broadcaster_user_name: string;
			/** The final level of the Hype Train. */
			level: number;
			/** Total points contributed to the Hype Train. */
			total: number;
			/** The contributors with the most points contributed. */
			top_contributions: ChannelHypeTrain.Contribution[];
			/** The time when the Hype Train started. */
			started_at: string;
			/** The time when the Hype Train ended. */
			ended_at: string;
			/** The time when the Hype Train cooldown ends so that the next Hype Train can start. */
			cooldown_ends_at: string;
			/** Indicates if the Hype Train is a Golden Kappa Train. */
			is_golden_kappa_train: boolean;
		};
	}
	export interface ChannelShieldModeBegin extends Base<Subscription.ChannelShieldModeBegin> {
		/** The data of `channel.shield_mode.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modebegin) */
		event: {
			/** An ID that identifies the broadcaster whose Shield Mode status was updated. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** An ID that identifies the moderator that updated the Shield Mode’s status. If the broadcaster updated the status, this ID will be the same as `broadcaster_user_id`. */
			moderator_user_id: string;
			/** The moderator’s login name. */
			moderator_user_login: string;
			/** The moderator’s display name. */
			moderator_user_name: string;
			/** The UTC timestamp (in RFC3339 format) of when the moderator activated Shield Mode. */
			started_at: string;
		};
	}
	export interface ChannelShieldModeEnd extends Base<Subscription.ChannelShieldModeEnd> {
		/** The data of `channel.shield_mode.end` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend) */
		event: {
			/** An ID that identifies the broadcaster whose Shield Mode status was updated. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** An ID that identifies the moderator that updated the Shield Mode’s status. If the broadcaster updated the status, this ID will be the same as `broadcaster_user_id`. */
			moderator_user_id: string;
			/** The moderator’s login name. */
			moderator_user_login: string;
			/** The moderator’s display name. */
			moderator_user_name: string;
			/** The UTC timestamp (in RFC3339 format) of when the moderator deactivated Shield Mode. */
			ended_at: string;
		};
	}
	export interface ChannelShoutoutCreate extends Base<Subscription.ChannelShoutoutCreate> {
		/** The data of `channel.shoutout.create` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate) */
		event: {
			/** An ID that identifies the broadcaster that sent the Shoutout. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** An ID that identifies the broadcaster that received the Shoutout. */
			to_broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			to_broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			to_broadcaster_user_name: string;
			/** An ID that identifies the moderator that sent the Shoutout. If the broadcaster sent the Shoutout, this ID is the same as the ID in `broadcaster_user_id`. */
			moderator_user_id: string;
			/** The moderator’s login name. */
			moderator_user_login: string;
			/** The moderator’s display name. */
			moderator_user_name: string;
			/** The number of users that were watching the broadcaster’s stream at the time of the Shoutout. */
			viewer_count: number;
			/** The UTC timestamp (in RFC3339 format) of when the moderator sent the Shoutout. */
			started_at: string;
			/** The UTC timestamp (in RFC3339 format) of when the broadcaster may send a Shoutout to a different broadcaster. */
			cooldown_ends_at: string;
			/** The UTC timestamp (in RFC3339 format) of when the broadcaster may send another Shoutout to the broadcaster in `to_broadcaster_user_id`. */
			target_cooldown_ends_at: string;
		};
	}
	export interface ChannelShoutoutReceive extends Base<Subscription.ChannelShoutoutReceive> {
		/** The data of `channel.shoutout.receive` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutreceive) */
		event: {
			/** An ID that identifies the broadcaster that received the Shoutout. */
			broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			broadcaster_user_name: string;
			/** An ID that identifies the broadcaster that sent the Shoutout. */
			from_broadcaster_user_id: string;
			/** The broadcaster’s login name. */
			from_broadcaster_user_login: string;
			/** The broadcaster’s display name. */
			from_broadcaster_user_name: string;
			/** The number of users that were watching the from-broadcaster’s stream at the time of the Shoutout. */
			viewer_count: number;
			/** The UTC timestamp (in RFC3339 format) of when the moderator sent the Shoutout. */
			started_at: string;
		};
	}
	export interface StreamOnline extends Base<Subscription.StreamOnline> {
		/** The data of `stream.online` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline) */
		event: {
			/** The ID of the stream. */
			id: string;
			/** The broadcaster’s user ID. */
			broadcaster_user_id: string;
			/** The broadcaster’s user login. */
			broadcaster_user_login: string;
			/** The broadcaster’s user display name. */
			broadcaster_user_name: string;
			/** The stream type. */
			type: "live" | "playlist" | "watch_party" | "premiere" | "rerun";
			/** The timestamp at which the stream went online. */
			started_at: string;
		};
	}
	export interface StreamOffline extends Base<Subscription.StreamOffline> {
		/** The data of `stream.offline` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline) */
		event: {
			/** The broadcaster’s user ID. */
			broadcaster_user_id: string;
			/** The broadcaster’s user login. */
			broadcaster_user_login: string;
			/** The broadcaster’s user display name. */
			broadcaster_user_name: string;
		};
	}
	export interface UserAuthorizationGrant extends Base<Subscription.UserAuthorizationGrant> {
		/** The data of `user.authorization.grant` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant) */
		event: {
			/** The client_id of the application that was granted user access. */
			client_id: string;
			/** The user ID for the user who has granted authorization for your client ID. */
			user_id: string;
			/** The user login for the user who has granted authorization for your client ID. */
			user_login: string;
			/** The user display name for the user who has granted authorization for your client ID. */
			user_name: string;
		};
	}
	export interface UserAuthorizationRevoke extends Base<Subscription.UserAuthorizationRevoke> {
		/** The data of `user.authorization.revoke` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke) */
		event: {
			/** The client_id of the application with revoked user access. */
			client_id: string;
			/** The user ID for the user who has revoked authorization for your client ID. */
			user_id: string;
			/** The user login for the user who has revoked authorization for your client ID. This is `null` if the user no longer exists. */
			user_login: string | null;
			/** The user display name for the user who has revoked authorization for your client ID. This is `null` if the user no longer exists. */
			user_name: string | null;
		};
	}
	export interface UserUpdate extends Base<Subscription.UserUpdate> {
		/** The data of `user.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate) */
		event: {
			/** The user’s user ID. */
			user_id: string;
			/** The user’s user login. */
			user_login: string;
			/** The user’s user display name. */
			user_name: string;
			/** The user’s email address. The event includes the user’s email address only if the app used to request this event type includes the `user:read:email` scope for the user, otherwise the field is set to an empty string. See [Create EventSub Subscription](https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription). */
			email: string;
			/** A Boolean value that determines whether Twitch has verified the user’s email address. Is `true` if Twitch has verified the email address, otherwise `false`. Is `false` if `email` is empty string. */
			email_verified: boolean;
			/** The user’s description. */
			description: string;
		};
	}
	export interface UserWhisperMessage extends Base<Subscription.UserWhisperMessage> {
		/** The data of `user.whisper.message` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage) */
		event: {
			/** The ID of the user sending the message. */
			from_user_id: string;
			/** The name of the user sending the message. */
			from_user_name: string;
			/** The login of the user sending the message. */
			from_user_login: string;
			/** The ID of the user receiving the message. */
			to_user_id: string;
			/** The name of the user receiving the message. */
			to_user_name: string;
			/** The login of the user receiving the message. */
			to_user_login: string;
			/** The whisper ID. */
			whisper_id: string;
			/** Object containing whisper information. */
			whisper: {
				/** The body of the whisper message. */
				text: string;
			};
		};
	}
}

/** An object that contains information about the connection. */
export type Session = Session.Connected | Session.Reconnecting;
export namespace Session {
	interface Base<Status extends "connected" | "reconnecting", KeepaliveTimeoutSeconds extends number | null, ReconnectURL extends string | null> {
		/** An ID that uniquely identifies this WebSocket connection. Use this ID to set the `session_id` field in all [subscription requests](https://dev.twitch.tv/docs/eventsub/manage-subscriptions#subscribing-to-events). */
		id: string;
		/** The connection’s status. */
		status: Status;
		/** The maximum number of seconds that you should expect silence before receiving a [keepalive message](https://dev.twitch.tv/docs/eventsub/websocket-reference/#keepalive-message). For a welcome message, this is the number of seconds that you have to [subscribe to an event](https://dev.twitch.tv/docs/eventsub/manage-subscriptions#subscribing-to-events) after receiving the welcome message. If you don’t subscribe to an event within this window, the socket is disconnected. */
		keepalive_timeout_seconds: KeepaliveTimeoutSeconds;
		/** The URL to reconnect to if you get a [Reconnect message](https://dev.twitch.tv/docs/eventsub/websocket-reference/#reconnect-message). */
		reconnect_url: ReconnectURL;
		/** The UTC date and time that the connection was created. */
		connected_at: string;
	}
	/** An object that contains information about the connection. */
	export type Connected = Base<"connected", number, null>;
	/** An object that contains information about the connection. */
	export type Reconnecting = Base<"reconnecting", null, string>;
}

/** An object that identifies the message. */
export type Metadata = Metadata.Base | Metadata.Subscription;
export namespace Metadata {
	/** An object that identifies the message. */
	export interface Base<MessageType extends string = string> {
		/** An ID that uniquely identifies the message. Twitch sends messages at least once, but if Twitch is unsure of whether you received a notification, it’ll resend the message. This means you may receive a notification twice. If Twitch resends the message, the message ID will be the same. */
		message_id: string;
		/** The type of message. */
		message_type: MessageType;
		/** The UTC date and time that the message was sent. */
		message_timestamp: string;
	}
	/** An object that identifies the subscription message. */
	export interface Subscription<MessageType extends string = string, SubscriptionType extends string = string, SubscriptionVersion extends Version = Version> extends Base<MessageType> {
		/** The type of event sent in the message. */
		subscription_type: SubscriptionType;
		/** The version number of the subscription type's definition. This is the same value specified in the subscription request. */
		subscription_version: SubscriptionVersion;
	}
}

export type Message = Message.SessionWelcome | Message.SessionKeepalive | Message.Notification | Message.SessionReconnect | Message.Revocation;
export namespace Message {
	export function isSessionWelcome(data: Message): data is SessionWelcome { return data.metadata.message_type === "session_welcome" }
	export function isSessionKeepalive(data: Message): data is SessionKeepalive { return data.metadata.message_type === "session_keepalive" }
	export function isNotification(data: Message): data is Notification { return data.metadata.message_type === "notification" }
	export function isSessionReconnect(data: Message): data is SessionReconnect { return data.metadata.message_type === "session_reconnect" }
	export function isRevocation(data: Message): data is Revocation { return data.metadata.message_type === "revocation" }

	/** Defines the first message that the EventSub WebSocket server sends after your client connects to the server. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message) */
	export interface SessionWelcome {
		/** An object that identifies the message. */
		metadata: Metadata.Base<"session_welcome">;
		/** An object that contains the message. */
		payload: {
			/** An object that contains information about the connection. */
			session: Session.Connected;
		};
	}
	/** Defines the message that the EventSub WebSocket server sends your client to indicate that the WebSocket connection is healthy. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#keepalive-message) */
	export interface SessionKeepalive {
		/** An object that identifies the message. */
		metadata: Metadata.Base<"session_keepalive">;
		/** An empty object. */
		payload: {};
	}

	/** Defines a message that the EventSub WebSocket server sends your client when an event that you subscribe to occurs. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#notification-message) */
	export interface Notification<Payload_ extends Payload = Payload> {
		/** An object that identifies the message. */
		metadata: Metadata.Subscription<"notification", Payload_["subscription"]["type"], Payload_["subscription"]["version"]>;
		/** An object that contains the message. */
		payload: Payload_;
	}
	export namespace Notification {
		export function isAutomodMessageHold(data: Message.Notification): data is Notification<Payload.AutomodMessageHold> { return data.metadata.subscription_type === "automod.message.hold" && data.metadata.subscription_version === "1" }
		export function isAutomodMessageHoldV2(data: Message.Notification): data is Notification<Payload.AutomodMessageHoldV2> { return data.metadata.subscription_type === "automod.message.hold" && data.metadata.subscription_version === "2" }
		export function isAutomodMessageUpdate(data: Message.Notification): data is Notification<Payload.AutomodMessageUpdate> { return data.metadata.subscription_type === "automod.message.update" && data.metadata.subscription_version === "1" }
		export function isAutomodMessageUpdateV2(data: Message.Notification): data is Notification<Payload.AutomodMessageUpdateV2> { return data.metadata.subscription_type === "automod.message.update" && data.metadata.subscription_version === "2" }
		export function isAutomodSettingsUpdate(data: Message.Notification): data is Notification<Payload.AutomodSettingsUpdate> { return data.metadata.subscription_type === "automod.settings.update" && data.metadata.subscription_version === "1" }
		export function isAutomodTermsUpdate(data: Message.Notification): data is Notification<Payload.AutomodTermsUpdate> { return data.metadata.subscription_type === "automod.terms.update" && data.metadata.subscription_version === "1" }
		export function isChannelBitsUse(data: Message.Notification): data is Notification<Payload.ChannelBitsUse> { return data.metadata.subscription_type === "channel.bits.use" && data.metadata.subscription_version === "1" }
		export function isChannelUpdate(data: Message.Notification): data is Notification<Payload.ChannelUpdate> { return data.metadata.subscription_type === "channel.update" && data.metadata.subscription_version === "2" }
		export function isChannelFollow(data: Message.Notification): data is Notification<Payload.ChannelFollow> { return data.metadata.subscription_type === "channel.follow" && data.metadata.subscription_version === "2" }
		export function isChannelAdBreakBegin(data: Message.Notification): data is Notification<Payload.ChannelAdBreakBegin> { return data.metadata.subscription_type === "channel.ad_break.begin" && data.metadata.subscription_version === "1" }
		export function isChannelChatClear(data: Message.Notification): data is Notification<Payload.ChannelChatClear> { return data.metadata.subscription_type === "channel.chat.clear" && data.metadata.subscription_version === "1" }
		export function isChannelChatClearUserMessages(data: Message.Notification): data is Notification<Payload.ChannelChatClearUserMessages> { return data.metadata.subscription_type === "channel.chat.clear_user_messages" && data.metadata.subscription_version === "1" }
		export function isChannelChatMessage(data: Message.Notification): data is Notification<Payload.ChannelChatMessage> { return data.metadata.subscription_type === "channel.chat.message" && data.metadata.subscription_version === "1" }
		export function isChannelChatMessageDelete(data: Message.Notification): data is Notification<Payload.ChannelChatMessageDelete> { return data.metadata.subscription_type === "channel.chat.message_delete" && data.metadata.subscription_version === "1" }
		export function isChannelChatNotification(data: Message.Notification): data is Notification<Payload.ChannelChatNotification> { return data.metadata.subscription_type === "channel.chat.notification" && data.metadata.subscription_version === "1" }
		export function isChannelChatSettingsUpdate(data: Message.Notification): data is Notification<Payload.ChannelChatSettingsUpdate> { return data.metadata.subscription_type === "channel.chat_settings.update" && data.metadata.subscription_version === "1" }
		export function isChannelChatUserMessageHold(data: Message.Notification): data is Notification<Payload.ChannelChatUserMessageHold> { return data.metadata.subscription_type === "channel.chat.user_message_hold" && data.metadata.subscription_version === "1" }
		export function isChannelChatUserMessageUpdate(data: Message.Notification): data is Notification<Payload.ChannelChatUserMessageUpdate> { return data.metadata.subscription_type === "channel.chat.user_message_update" && data.metadata.subscription_version === "1" }
		export function isChannelSharedChatSessionBegin(data: Message.Notification): data is Notification<Payload.ChannelSharedChatSessionBegin> { return data.metadata.subscription_type === "channel.shared_chat.begin" && data.metadata.subscription_version === "1" }
		export function isChannelSharedChatSessionUpdate(data: Message.Notification): data is Notification<Payload.ChannelSharedChatSessionUpdate> { return data.metadata.subscription_type === "channel.shared_chat.update" && data.metadata.subscription_version === "1" }
		export function isChannelSharedChatSessionEnd(data: Message.Notification): data is Notification<Payload.ChannelSharedChatSessionEnd> { return data.metadata.subscription_type === "channel.shared_chat.end" && data.metadata.subscription_version === "1" }
		export function isChannelSubscribe(data: Message.Notification): data is Notification<Payload.ChannelSubscribe> { return data.metadata.subscription_type === "channel.subscribe" && data.metadata.subscription_version === "1" }
		export function isChannelSubscriptionEnd(data: Message.Notification): data is Notification<Payload.ChannelSubscriptionEnd> { return data.metadata.subscription_type === "channel.subscription.end" && data.metadata.subscription_version === "1" }
		export function isChannelSubscriptionGift(data: Message.Notification): data is Notification<Payload.ChannelSubscriptionGift> { return data.metadata.subscription_type === "channel.subscription.gift" && data.metadata.subscription_version === "1" }
		export function isChannelSubscriptionMessage(data: Message.Notification): data is Notification<Payload.ChannelSubscriptionMessage> { return data.metadata.subscription_type === "channel.subscription.message" && data.metadata.subscription_version === "1" }
		export function isChannelCheer(data: Message.Notification): data is Notification<Payload.ChannelCheer> { return data.metadata.subscription_type === "channel.cheer" && data.metadata.subscription_version === "1" }
		export function isChannelRaid(data: Message.Notification): data is Notification<Payload.ChannelRaid> { return data.metadata.subscription_type === "channel.raid" && data.metadata.subscription_version === "1" }
		export function isChannelBan(data: Message.Notification): data is Notification<Payload.ChannelBan> { return data.metadata.subscription_type === "channel.ban" && data.metadata.subscription_version === "1" }
		export function isChannelUnban(data: Message.Notification): data is Notification<Payload.ChannelUnban> { return data.metadata.subscription_type === "channel.unban" && data.metadata.subscription_version === "1" }
		export function isChannelUnbanRequestCreate(data: Message.Notification): data is Notification<Payload.ChannelUnbanRequestCreate> { return data.metadata.subscription_type === "channel.unban_request.create" && data.metadata.subscription_version === "1" }
		export function isChannelUnbanRequestResolve(data: Message.Notification): data is Notification<Payload.ChannelUnbanRequestResolve> { return data.metadata.subscription_type === "channel.unban_request.resolve" && data.metadata.subscription_version === "1" }
		export function isChannelModerate(data: Message.Notification): data is Notification<Payload.ChannelModerate> { return data.metadata.subscription_type === "channel.moderate" && data.metadata.subscription_version === "1" }
		export function isChannelModerateV2(data: Message.Notification): data is Notification<Payload.ChannelModerateV2> { return data.metadata.subscription_type === "channel.moderate" && data.metadata.subscription_version === "2" }
		export function isChannelModeratorAdd(data: Message.Notification): data is Notification<Payload.ChannelModeratorAdd> { return data.metadata.subscription_type === "channel.moderator.add" && data.metadata.subscription_version === "1" }
		export function isChannelModeratorRemove(data: Message.Notification): data is Notification<Payload.ChannelModeratorRemove> { return data.metadata.subscription_type === "channel.moderator.remove" && data.metadata.subscription_version === "1" }
		export function isChannelGuestStarSessionBegin(data: Message.Notification): data is Notification<Payload.ChannelGuestStarSessionBegin> { return data.metadata.subscription_type === "channel.guest_star_session.begin" && data.metadata.subscription_version === "beta" }
		export function isChannelGuestStarSessionEnd(data: Message.Notification): data is Notification<Payload.ChannelGuestStarSessionEnd> { return data.metadata.subscription_type === "channel.guest_star_session.end" && data.metadata.subscription_version === "beta" }
		export function isChannelGuestStarGuestUpdate(data: Message.Notification): data is Notification<Payload.ChannelGuestStarGuestUpdate> { return data.metadata.subscription_type === "channel.guest_star_guest.update" && data.metadata.subscription_version === "beta" }
		export function isChannelGuestStarSettingsUpdate(data: Message.Notification): data is Notification<Payload.ChannelGuestStarSettingsUpdate> { return data.metadata.subscription_type === "channel.guest_star_settings.update" && data.metadata.subscription_version === "beta" }
		export function isChannelPointsAutomaticRewardRedemptionAdd(data: Message.Notification): data is Notification<Payload.ChannelPointsAutomaticRewardRedemptionAdd> { return data.metadata.subscription_type === "channel.channel_points_automatic_reward_redemption.add" && data.metadata.subscription_version === "1" }
		export function isChannelPointsAutomaticRewardRedemptionAddV2(data: Message.Notification): data is Notification<Payload.ChannelPointsAutomaticRewardRedemptionAddV2> { return data.metadata.subscription_type === "channel.channel_points_automatic_reward_redemption.add" && data.metadata.subscription_version === "2" }
		export function isChannelPointsCustomRewardAdd(data: Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardAdd> { return data.metadata.subscription_type === "channel.channel_points_custom_reward.add" && data.metadata.subscription_version === "1" }
		export function isChannelPointsCustomRewardUpdate(data: Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardUpdate> { return data.metadata.subscription_type === "channel.channel_points_custom_reward.update" && data.metadata.subscription_version === "1" }
		export function isChannelPointsCustomRewardRemove(data: Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardRemove> { return data.metadata.subscription_type === "channel.channel_points_custom_reward.remove" && data.metadata.subscription_version === "1" }
		export function isChannelPointsCustomRewardRedemptionAdd(data: Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardRedemptionAdd> { return data.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.add" && data.metadata.subscription_version === "1" }
		export function isChannelPointsCustomRewardRedemptionUpdate(data: Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardRedemptionUpdate> { return data.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.update" && data.metadata.subscription_version === "1" }
		export function isChannelPollBegin(data: Message.Notification): data is Notification<Payload.ChannelPollBegin> { return data.metadata.subscription_type === "channel.poll.begin" && data.metadata.subscription_version === "1" }
		export function isChannelPollProgress(data: Message.Notification): data is Notification<Payload.ChannelPollProgress> { return data.metadata.subscription_type === "channel.poll.progress" && data.metadata.subscription_version === "1" }
		export function isChannelPollEnd(data: Message.Notification): data is Notification<Payload.ChannelPollEnd> { return data.metadata.subscription_type === "channel.poll.end" && data.metadata.subscription_version === "1" }
		export function isChannelPredictionBegin(data: Message.Notification): data is Notification<Payload.ChannelPredictionBegin> { return data.metadata.subscription_type === "channel.prediction.begin" && data.metadata.subscription_version === "1" }
		export function isChannelPredictionProgress(data: Message.Notification): data is Notification<Payload.ChannelPredictionProgress> { return data.metadata.subscription_type === "channel.prediction.progress" && data.metadata.subscription_version === "1" }
		export function isChannelPredictionLock(data: Message.Notification): data is Notification<Payload.ChannelPredictionLock> { return data.metadata.subscription_type === "channel.prediction.lock" && data.metadata.subscription_version === "1" }
		export function isChannelPredictionEnd(data: Message.Notification): data is Notification<Payload.ChannelPredictionEnd> { return data.metadata.subscription_type === "channel.prediction.end" && data.metadata.subscription_version === "1" }
		export function isChannelSuspiciousUserMessage(data: Message.Notification): data is Notification<Payload.ChannelSuspiciousUserMessage> { return data.metadata.subscription_type === "channel.suspicious_user.message" && data.metadata.subscription_version === "1" }
		export function isChannelSuspiciousUserUpdate(data: Message.Notification): data is Notification<Payload.ChannelSuspiciousUserUpdate> { return data.metadata.subscription_type === "channel.suspicious_user.update" && data.metadata.subscription_version === "1" }
		export function isChannelVipAdd(data: Message.Notification): data is Notification<Payload.ChannelVipAdd> { return data.metadata.subscription_type === "channel.vip.add" && data.metadata.subscription_version === "1" }
		export function isChannelVipRemove(data: Message.Notification): data is Notification<Payload.ChannelVipRemove> { return data.metadata.subscription_type === "channel.vip.remove" && data.metadata.subscription_version === "1" }
		export function isChannelWarningAcknowledge(data: Message.Notification): data is Notification<Payload.ChannelWarningAcknowledge> { return data.metadata.subscription_type === "channel.warning.acknowledge" && data.metadata.subscription_version === "1" }
		export function isChannelWarningSend(data: Message.Notification): data is Notification<Payload.ChannelWarningSend> { return data.metadata.subscription_type === "channel.warning.send" && data.metadata.subscription_version === "1" }
		export function isChannelCharityCampaignDonate(data: Message.Notification): data is Notification<Payload.ChannelCharityCampaignDonate> { return data.metadata.subscription_type === "channel.charity_campaign.donate" && data.metadata.subscription_version === "1" }
		export function isChannelCharityCampaignStart(data: Message.Notification): data is Notification<Payload.ChannelCharityCampaignStart> { return data.metadata.subscription_type === "channel.charity_campaign.start" && data.metadata.subscription_version === "1" }
		export function isChannelCharityCampaignProgress(data: Message.Notification): data is Notification<Payload.ChannelCharityCampaignProgress> { return data.metadata.subscription_type === "channel.charity_campaign.progress" && data.metadata.subscription_version === "1" }
		export function isChannelCharityCampaignStop(data: Message.Notification): data is Notification<Payload.ChannelCharityCampaignStop> { return data.metadata.subscription_type === "channel.charity_campaign.stop" && data.metadata.subscription_version === "1" }
		export function isConduitShardDisabled(data: Message.Notification): data is Notification<Payload.ConduitShardDisabled> { return data.metadata.subscription_type === "conduit.shard.disabled" && data.metadata.subscription_version === "1" }
		export function isDropEntitlementGrant(data: Message.Notification): data is Notification<Payload.DropEntitlementGrant> { return data.metadata.subscription_type === "drop.entitlement.grant" && data.metadata.subscription_version === "1" }
		export function isExtensionBitsTransactionCreate(data: Message.Notification): data is Notification<Payload.ExtensionBitsTransactionCreate> { return data.metadata.subscription_type === "extension.bits_transaction.create" && data.metadata.subscription_version === "1" }
		export function isChannelGoalBegin(data: Message.Notification): data is Notification<Payload.ChannelGoalBegin> { return data.metadata.subscription_type === "channel.goal.begin" && data.metadata.subscription_version === "1" }
		export function isChannelGoalProgress(data: Message.Notification): data is Notification<Payload.ChannelGoalProgress> { return data.metadata.subscription_type === "channel.goal.progress" && data.metadata.subscription_version === "1" }
		export function isChannelGoalEnd(data: Message.Notification): data is Notification<Payload.ChannelGoalEnd> { return data.metadata.subscription_type === "channel.goal.end" && data.metadata.subscription_version === "1" }
		export function isChannelHypeTrainBegin(data: Message.Notification): data is Notification<Payload.ChannelHypeTrainBegin> { return data.metadata.subscription_type === "channel.hype_train.begin" && data.metadata.subscription_version === "1" }
		export function isChannelHypeTrainProgress(data: Message.Notification): data is Notification<Payload.ChannelHypeTrainProgress> { return data.metadata.subscription_type === "channel.hype_train.progress" && data.metadata.subscription_version === "1" }
		export function isChannelHypeTrainEnd(data: Message.Notification): data is Notification<Payload.ChannelHypeTrainEnd> { return data.metadata.subscription_type === "channel.hype_train.end" && data.metadata.subscription_version === "1" }
		export function isChannelShieldModeBegin(data: Message.Notification): data is Notification<Payload.ChannelShieldModeBegin> { return data.metadata.subscription_type === "channel.shield_mode.begin" && data.metadata.subscription_version === "1" }
		export function isChannelShieldModeEnd(data: Message.Notification): data is Notification<Payload.ChannelShieldModeEnd> { return data.metadata.subscription_type === "channel.shield_mode.end" && data.metadata.subscription_version === "1" }
		export function isChannelShoutoutCreate(data: Message.Notification): data is Notification<Payload.ChannelShoutoutCreate> { return data.metadata.subscription_type === "channel.shoutout.create" && data.metadata.subscription_version === "1" }
		export function isChannelShoutoutReceive(data: Message.Notification): data is Notification<Payload.ChannelShoutoutReceive> { return data.metadata.subscription_type === "channel.shoutout.receive" && data.metadata.subscription_version === "1" }
		export function isStreamOnline(data: Message.Notification): data is Notification<Payload.StreamOnline> { return data.metadata.subscription_type === "stream.online" && data.metadata.subscription_version === "1" }
		export function isStreamOffline(data: Message.Notification): data is Notification<Payload.StreamOffline> { return data.metadata.subscription_type === "stream.offline" && data.metadata.subscription_version === "1" }
		export function isUserAuthorizationGrant(data: Message.Notification): data is Notification<Payload.UserAuthorizationGrant> { return data.metadata.subscription_type === "user.authorization.grant" && data.metadata.subscription_version === "1" }
		export function isUserAuthorizationRevoke(data: Message.Notification): data is Notification<Payload.UserAuthorizationRevoke> { return data.metadata.subscription_type === "user.authorization.revoke" && data.metadata.subscription_version === "1" }
		export function isUserUpdate(data: Message.Notification): data is Notification<Payload.UserUpdate> { return data.metadata.subscription_type === "user.update" && data.metadata.subscription_version === "1" }
		export function isUserWhisperMessage(data: Message.Notification): data is Notification<Payload.UserWhisperMessage> { return data.metadata.subscription_type === "user.whisper.message" && data.metadata.subscription_version === "1" }
	}

	/** Defines the message that the EventSub WebSocket server sends if the server must drop the connection. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#reconnect-message) */
	export interface SessionReconnect {
		/** An object that identifies the message. */
		metadata: Metadata.Base<"session_reconnect">;
		/** An object that contains the message. */
		payload: {
			/** An object that contains information about the connection. */
			session: Session.Reconnecting;
		};
	}

	/** Defines the message that the EventSub WebSocket server sends if the user no longer exists or they revoked the authorization token that the subscription relied on. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#revocation-message) */
	export interface Revocation {
		/** An object that identifies the message. */
		metadata: Metadata.Subscription<"revocation", string, Version>;
		/** An object that contains the message. */
		payload: Payload.Base<Subscription, "authorization_revoked" | "user_removed" | "version_removed">;
	}
}