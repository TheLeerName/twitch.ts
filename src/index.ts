class FetchBuilder {
	readonly url: string = "";
	readonly search: Record<string, string | string[]> = {};
	readonly hash: Record<string, string | string[]> = {};
	readonly headers: Record<string, string> = {};

	method: string = "GET";
	body: string | null = null;

	abort_controller: AbortController | null = null;
	timeout: number = FetchBuilder.global_timeout;
	static global_timeout: number = 5000;

	constructor(url: string, method?: string) {
		this.url = url;
		if (method) this.method = method;
	}

	/** @param search URL search/query parameters */
	setSearch(search: Record<string, string | number | boolean | (string | number | boolean)[] | undefined>) {
		for (const [k, v] of Object.entries(search)) if (v) this.search[encodeURI(k)] = Array.isArray(v) ? v.map(vv => encodeURI(`${vv}`)) : encodeURI(`${v}`);
		return this;
	}

	/** @param hash URL hash/fragment parameters */
	setHash(hash: Record<string, string | number | boolean | (string | number | boolean)[] | undefined>) {
		for (const [k, v] of Object.entries(hash)) if (v) this.hash[encodeURI(k)] = Array.isArray(v) ? v.map(vv => encodeURI(`${vv}`)) : encodeURI(`${v}`);
		return this;
	}

	/** @param headers an object literal to set request's headers. */
	setHeaders(headers: Record<string, string | number | boolean | undefined>) {
		for (const [k, v] of Object.entries(headers)) if (v) this.headers[k] = `${v}`;
		return this;
	}

	setMethod(method: string | null) {
		this.method = method ?? "GET";
		return this;
	}

	setBody(body: any | null) {
		if (typeof body === "string")
			this.body = body;
		else if (body)
			this.body = JSON.stringify(body);
		else
			this.body = body;

		return this;
	}

	/** @param abort_controller if not `null`, RequestTimeout will be disabled */
	setAbortController(abort_controller: AbortController | null) {
		this.abort_controller = abort_controller;
		return this;
	}

	/** @param timeout in milliseconds, if `false`, RequestTimeout will be disabled */
	setTimeout(timeout: number | false) {
		this.timeout = timeout === false ? 0 : timeout;
		return this;
	}

	/** @param timeout in milliseconds, if `false`, RequestTimeout will be disabled */
	static setGlobalTimeout(timeout: number | false) {
		this.global_timeout = timeout === false ? 0 : timeout;
	}

	fetch() {
		var url = this.url;

		var added = false;
		var postfix = "?";
		for (const [k, v] of Object.entries(this.search)) {
			if (Array.isArray(v)) for (const v_entry of v) postfix += `${k}=${v_entry}&`;
			else postfix += `${k}=${v}&`;
			added = true;
		}
		if (added)
			url += postfix.substring(0, postfix.length - 1);

		added = false;
		postfix = "#";

		for (const [k, v] of Object.entries(this.hash)) {
			if (Array.isArray(v)) for (const v_entry of v) postfix += `${k}=${v_entry}&`;
			else postfix += `${k}=${v}&`;
			added = true;
		}
		if (added)
			url += postfix.substring(0, postfix.length - 1);

		const init: RequestInit = {};
		init.method = this.method;
		init.headers = this.headers;
		if (this.body) init.body = this.body;

		if (this.abort_controller)
			init.signal = this.abort_controller.signal;
		else if (this.timeout > 0) {
			const controller = new AbortController();
			init.signal = controller.signal;
		}

		return fetch(url, init);
	}
}

export namespace EventSub {
	/**
	 * Starts WebSocket for subscribing and getting EventSub events
	 * - Reconnects in `reconnect_ms`, if WebSocket was closed
	 * - Reconnects immediately, if gets `session_reconnect` message
	 * - When getting not first `session_welcome` message when `reconnect_url` is `false` or when recreating ws session (if your app is reopened or internet was down), please delete old events via `Request.DeleteEventSubSubscription`, you will need a id of subscription, store it somewhere
	 * @param reconnect_ms If less then `1`, WebSocket will be not reconnected after `onClose()`, default value is `500`
	 */
	export function startWebSocket<S extends Authorization.Scope[]>(token_data: Authorization.User<S>, reconnect_ms?: number) {
		if (!reconnect_ms) reconnect_ms = 500;

		const connection = new Connection(new WebSocket(WebSocketURL), token_data);
		var previous_message_id: string | undefined;

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
				connection.keepalive_timeout = setTimeout(() => connection.ws.close(4005, `NetworkTimeout: client doesn't received any message within ${connection.session.keepalive_timeout_seconds} seconds`), (connection.session.keepalive_timeout_seconds! + 2) * 1000);
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
				connection.ws = new WebSocket(WebSocketURL);
				connection.ws.onmessage = onMessage;
				connection.ws.onclose = onClose;
			}, reconnect_ms);

			connection.onClose(e.code, e.reason);
		}

		connection.ws.onmessage = onMessage;
		connection.ws.onclose = onClose;

		return connection;
	}

	export const WebSocketURL = "wss://eventsub.wss.twitch.tv/ws";

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
		session!: Session.Any;
		/** Defines the transport details that you want Twitch to use when sending you event notifications. */
		transport!: Transport.WebSocket;

		/** ID of timer which closes connection if WebSocket isn't received any message within `session.keepalive_timeout_seconds`, becomes `undefined` if any message was received */
		keepalive_timeout?: NodeJS.Timeout | number;

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
	export interface Transport<Method extends string = "webhook" | "websocket" | "conduit"> {
		/** The transport method. */
		method: Method;
	}
	export namespace Transport {
		/** Defines the transport details that you want Twitch to use when sending you event notifications. */
		export interface WebHook extends Transport<"webhook"> {
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
		export interface WebSocket extends Transport<"websocket"> {
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
		export interface Conduit extends Transport<"conduit"> {
			/** An ID that identifies the conduit to send notifications to. When you create a conduit, the server returns the conduit ID. */
			conduit_id: string;
		}
		/** @param conduit_id An ID that identifies the conduit to send notifications to. When you create a conduit, the server returns the conduit ID. */
		export function Conduit(conduit_id: string): Conduit {return {method: "conduit", conduit_id}}
	}

	/** Subscription-related parameters */
	export interface Subscription<Type extends string = string, Version_ extends Version = Version, Condition_ extends Condition = Condition, Transport_ extends Transport = Transport> {
		/** The subscription type name. */
		type: Type;
		/** The subscription version. */
		version: Version_;
		/** Subscription-specific parameters. */
		condition: Condition_;
		/** Transport-specific parameters. */
		transport: Transport_;
	}
	export namespace Subscription {
		/** 
		 * The `automod.message.hold` subscription type notifies a user if a message was caught by automod for review. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold)
		 * 
		 * Requires a user access token that includes the `moderator:manage:automod` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:manage:automod` scope for the moderator.
		 * 
		 * The moderator must be a moderator or broadcaster for the specified broadcaster.
		 */
		export type AutomodMessageHold = Subscription<"automod.message.hold", "1", Condition.AutomodMessageHold, Transport>;
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
		export type AutomodMessageHoldV2 = Subscription<"automod.message.hold", "2", Condition.AutomodMessageHold, Transport>;
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
		export type AutomodMessageUpdate = Subscription<"automod.message.update", "1", Condition.AutomodMessageUpdate, Transport>;
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
		export type AutomodMessageUpdateV2 = Subscription<"automod.message.update", "2", Condition.AutomodMessageUpdate, Transport>;
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
		export type AutomodSettingsUpdate = Subscription<"automod.settings.update", "1", Condition.AutomodSettingsUpdate, Transport>;
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
		export type AutomodTermsUpdate = Subscription<"automod.terms.update", "1", Condition.AutomodTermsUpdate, Transport>;
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
		export type ChannelBitsUse = Subscription<"channel.bits.use", "1", Condition.ChannelBitsUse, Transport>;
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
		export type ChannelUpdate = Subscription<"channel.update", "2", Condition.ChannelUpdate, Transport>;
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
		export type ChannelFollow = Subscription<"channel.follow", "2", Condition.ChannelFollow, Transport>;
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
		export type ChannelAdBreakBegin = Subscription<"channel.ad_break.begin", "1", Condition.ChannelAdBreakBegin, Transport>;
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
		export type ChannelChatClear = Subscription<"channel.chat.clear", "1", Condition.ChannelChatClear, Transport>;
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
		export type ChannelChatClearUserMessages = Subscription<"channel.chat.clear_user_messages", "1", Condition.ChannelChatClearUserMessages, Transport>;
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
		export type ChannelChatMessage = Subscription<"channel.chat.message", "1", Condition.ChannelChatMessage, Transport>;
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
		export type ChannelChatMessageDelete = Subscription<"channel.chat.message_delete", "1", Condition.ChannelChatMessageDelete, Transport>;
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
		export type ChannelChatNotification = Subscription<"channel.chat.notification", "1", Condition.ChannelChatNotification, Transport>;
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
		export type ChannelChatSettingsUpdate = Subscription<"channel.chat_settings.update", "1", Condition.ChannelChatSettingsUpdate, Transport>;
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
		export type ChannelChatUserMessageHold = Subscription<"channel.chat.user_message_hold", "1", Condition.ChannelChatUserMessageHold, Transport>;
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
		export type ChannelChatUserMessageUpdate = Subscription<"channel.chat.user_message_update", "1", Condition.ChannelChatUserMessageUpdate, Transport>;
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
		export type ChannelSharedChatSessionBegin = Subscription<"channel.shared_chat.begin", "1", Condition.ChannelSharedChatSessionBegin, Transport>;
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
		export type ChannelSharedChatSessionUpdate = Subscription<"channel.shared_chat.update", "1", Condition.ChannelSharedChatSessionUpdate, Transport>;
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
		export type ChannelSharedChatSessionEnd = Subscription<"channel.shared_chat.end", "1", Condition.ChannelSharedChatSessionEnd, Transport>;
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
		export type ChannelSubscribe = Subscription<"channel.subscribe", "1", Condition.ChannelSubscribe, Transport>;
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
		export type ChannelSubscriptionEnd = Subscription<"channel.subscription.end", "1", Condition.ChannelSubscriptionEnd, Transport>;
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
		export type ChannelSubscriptionGift = Subscription<"channel.subscription.gift", "1", Condition.ChannelSubscriptionGift, Transport>;
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
		export type ChannelSubscriptionMessage = Subscription<"channel.subscription.message", "1", Condition.ChannelSubscriptionMessage, Transport>;
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
		export type ChannelCheer = Subscription<"channel.cheer", "1", Condition.ChannelCheer, Transport>;
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
		export type ChannelRaid = Subscription<"channel.raid", "1", Condition.ChannelRaid, Transport>;
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
		export type ChannelBan = Subscription<"channel.ban", "1", Condition.ChannelBan, Transport>;
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
		export type ChannelUnban = Subscription<"channel.unban", "1", Condition.ChannelUnban, Transport>;
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
		export type ChannelUnbanRequestCreate = Subscription<"channel.unban_request.create", "1", Condition.ChannelUnbanRequestCreate, Transport>;
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
		export type ChannelUnbanRequestResolve = Subscription<"channel.unban_request.resolve", "1", Condition.ChannelUnbanRequestResolve, Transport>;
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
		export type ChannelModerate = Subscription<"channel.moderate", "1", Condition.ChannelModerate, Transport>;
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
		export type ChannelModerateV2 = Subscription<"channel.moderate", "2", Condition.ChannelModerate, Transport>;

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
		export type ChannelModeratorAdd = Subscription<"channel.moderator.add", "1", Condition.ChannelModeratorAdd, Transport>;
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
		export type ChannelModeratorRemove = Subscription<"channel.moderator.remove", "1", Condition.ChannelModeratorRemove, Transport>;
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
		export type ChannelGuestStarSessionBegin = Subscription<"channel.guest_star_session.begin", "beta", Condition.ChannelGuestStarSessionBegin, Transport>;
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
		export type ChannelGuestStarSessionEnd = Subscription<"channel.guest_star_session.end", "beta", Condition.ChannelGuestStarSessionEnd, Transport>;
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
		export type ChannelGuestStarGuestUpdate = Subscription<"channel.guest_star_guest.update", "beta", Condition.ChannelGuestStarGuestUpdate, Transport>;
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
		export type ChannelGuestStarSettingsUpdate = Subscription<"channel.guest_star_settings.update", "beta", Condition.ChannelGuestStarSettingsUpdate, Transport>;
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
		export type ChannelPointsAutomaticRewardRedemptionAdd = Subscription<"channel.channel_points_automatic_reward_redemption.add", "1", Condition.ChannelPointsAutomaticRewardRedemptionAdd, Transport>;
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
		export type ChannelPointsAutomaticRewardRedemptionAddV2 = Subscription<"channel.channel_points_automatic_reward_redemption.add", "2", Condition.ChannelPointsAutomaticRewardRedemptionAdd, Transport>;
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
		export type ChannelPointsCustomRewardAdd = Subscription<"channel.channel_points_custom_reward.add", "1", Condition.ChannelPointsCustomRewardAdd, Transport>;
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
		export type ChannelPointsCustomRewardUpdate = Subscription<"channel.channel_points_custom_reward.update", "1", Condition.ChannelPointsCustomRewardUpdate, Transport>;
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
		export type ChannelPointsCustomRewardRemove = Subscription<"channel.channel_points_custom_reward.remove", "1", Condition.ChannelPointsCustomRewardRemove, Transport>;
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
		export type ChannelPointsCustomRewardRedemptionAdd = Subscription<"channel.channel_points_custom_reward_redemption.add", "1", Condition.ChannelPointsCustomRewardRedemptionAdd, Transport>;
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
		export type ChannelPointsCustomRewardRedemptionUpdate = Subscription<"channel.channel_points_custom_reward_redemption.update", "1", Condition.ChannelPointsCustomRewardRedemptionUpdate, Transport>;
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
		export type ChannelPollBegin = Subscription<"channel.poll.begin", "1", Condition.ChannelPollBegin, Transport>;
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
		export type ChannelPollProgress = Subscription<"channel.poll.progress", "1", Condition.ChannelPollProgress, Transport>;
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
		export type ChannelPollEnd = Subscription<"channel.poll.end", "1", Condition.ChannelPollEnd, Transport>;
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
		export type ChannelPredictionBegin = Subscription<"channel.prediction.begin", "1", Condition.ChannelPredictionBegin, Transport>;
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
		export type ChannelPredictionProgress = Subscription<"channel.prediction.progress", "1", Condition.ChannelPredictionProgress, Transport>;
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
		export type ChannelPredictionLock = Subscription<"channel.prediction.lock", "1", Condition.ChannelPredictionLock, Transport>;
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
		export type ChannelPredictionEnd = Subscription<"channel.prediction.end", "1", Condition.ChannelPredictionEnd, Transport>;
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
		export type ChannelSuspiciousUserUpdate = Subscription<"channel.suspicious_user.update", "1", Condition.ChannelSuspiciousUserUpdate, Transport>;
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
		export type ChannelSuspiciousUserMessage = Subscription<"channel.suspicious_user.message", "1", Condition.ChannelSuspiciousUserMessage, Transport>;
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
		export type ChannelVipAdd = Subscription<"channel.vip.add", "1", Condition.ChannelVipAdd, Transport>;
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
		export type ChannelVipRemove = Subscription<"channel.vip.remove", "1", Condition.ChannelVipRemove, Transport>;
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
		export type ChannelWarningAcknowledge = Subscription<"channel.warning.acknowledge", "1", Condition.ChannelWarningAcknowledge, Transport>;
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
		export type ChannelWarningSend = Subscription<"channel.warning.send", "1", Condition.ChannelWarningSend, Transport>;
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
		export type ChannelCharityCampaignDonate = Subscription<"channel.charity_campaign.donate", "1", Condition.ChannelCharityCampaignDonate, Transport>;
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
		export type ChannelCharityCampaignStart = Subscription<"channel.charity_campaign.start", "1", Condition.ChannelCharityCampaignStart, Transport>;
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
		export type ChannelCharityCampaignProgress = Subscription<"channel.charity_campaign.progress", "1", Condition.ChannelCharityCampaignProgress, Transport>;
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
		export type ChannelCharityCampaignStop = Subscription<"channel.charity_campaign.stop", "1", Condition.ChannelCharityCampaignStop, Transport>;
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
		export type ConduitShardDisabled = Subscription<"conduit.shard.disabled", "1", Condition.ConduitShardDisabled, Transport>;
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
		export type DropEntitlementGrant = Subscription<"drop.entitlement.grant", "1", Condition.DropEntitlementGrant, Transport>;
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
		export type ExtensionBitsTransactionCreate = Subscription<"extension.bits_transaction.create", "1", Condition.ExtensionBitsTransactionCreate, Transport>;
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
		export type ChannelGoalBegin = Subscription<"channel.goal.begin", "1", Condition.ChannelGoalBegin, Transport>;
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
		export type ChannelGoalProgress = Subscription<"channel.goal.progress", "1", Condition.ChannelGoalProgress, Transport>;
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
		export type ChannelGoalEnd = Subscription<"channel.goal.end", "1", Condition.ChannelGoalEnd, Transport>;
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
		export type ChannelHypeTrainBegin = Subscription<"channel.hype_train.begin", "1", Condition.ChannelHypeTrainBegin, Transport>;
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
		export type ChannelHypeTrainProgress = Subscription<"channel.hype_train.progress", "1", Condition.ChannelHypeTrainProgress, Transport>;
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
		export type ChannelHypeTrainEnd = Subscription<"channel.hype_train.end", "1", Condition.ChannelHypeTrainEnd, Transport>;
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
		export type ChannelShieldModeBegin = Subscription<"channel.shield_mode.begin", "1", Condition.ChannelShieldModeBegin, Transport>;
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
		export type ChannelShieldModeEnd = Subscription<"channel.shield_mode.end", "1", Condition.ChannelShieldModeEnd, Transport>;
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
		export type ChannelShoutoutCreate = Subscription<"channel.shoutout.create", "1", Condition.ChannelShoutoutCreate, Transport>;
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
		export type ChannelShoutoutReceive = Subscription<"channel.shoutout.receive", "1", Condition.ChannelShoutoutReceive, Transport>;
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
		export type StreamOnline = Subscription<"stream.online", "1", Condition.StreamOnline, Transport>;
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
		export type StreamOffline = Subscription<"stream.offline", "1", Condition.StreamOffline, Transport>;
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
		export type UserAuthorizationGrant = Subscription<"user.authorization.grant", "1", Condition.UserAuthorizationGrant, Transport>;
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
		export type UserAuthorizationRevoke = Subscription<"user.authorization.revoke", "1", Condition.UserAuthorizationRevoke, Transport>;
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
		export type UserUpdate = Subscription<"user.update", "1", Condition.UserUpdate, Transport>;
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
		export type UserWhisperMessage = Subscription<"user.whisper.message", "1", Condition.UserWhisperMessage, Transport>;
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
	export interface Payload<Subscription_ extends Subscription = Subscription, Status extends string = "enabled"> {
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
	export namespace Payload {
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
		export interface AutomodMessageHold extends Payload<Subscription.AutomodMessageHold> {
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
		export interface AutomodMessageHoldV2 extends Payload<Subscription.AutomodMessageHoldV2> {	
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
		export interface AutomodMessageUpdate extends Payload<Subscription.AutomodMessageUpdate> {
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
		export interface AutomodMessageUpdateV2 extends Payload<Subscription.AutomodMessageUpdateV2> {
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
		export interface AutomodSettingsUpdate extends Payload<Subscription.AutomodSettingsUpdate> {
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
		export interface AutomodTermsUpdate extends Payload<Subscription.AutomodTermsUpdate> {
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
		export interface ChannelBitsUse extends Payload<Subscription.ChannelBitsUse> {
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
		export interface ChannelUpdate extends Payload<Subscription.ChannelUpdate> {
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
		export interface ChannelFollow extends Payload<Subscription.ChannelFollow> {
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
		export interface ChannelAdBreakBegin extends Payload<Subscription.ChannelAdBreakBegin> {
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
		export interface ChannelChatClear extends Payload<Subscription.ChannelChatClear> {
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
		export interface ChannelChatClearUserMessages extends Payload<Subscription.ChannelChatClearUserMessages> {
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
		export interface ChannelChatMessage extends Payload<Subscription.ChannelChatMessage> {
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
		export interface ChannelChatMessageDelete extends Payload<Subscription.ChannelChatMessageDelete> {
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
		export interface ChannelChatNotification extends Payload<Subscription.ChannelChatNotification> {
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
		export interface ChannelChatSettingsUpdate extends Payload<Subscription.ChannelChatSettingsUpdate> {
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
		export interface ChannelChatUserMessageHold extends Payload<Subscription.ChannelChatUserMessageHold> {
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
		export interface ChannelChatUserMessageUpdate extends Payload<Subscription.ChannelChatUserMessageUpdate> {
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
		export interface ChannelSharedChatSessionBegin extends Payload<Subscription.ChannelSharedChatSessionBegin> {
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
		export interface ChannelSharedChatSessionUpdate extends Payload<Subscription.ChannelSharedChatSessionUpdate> {
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
		export interface ChannelSharedChatSessionEnd extends Payload<Subscription.ChannelSharedChatSessionEnd> {
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
		export interface ChannelSubscribe extends Payload<Subscription.ChannelSubscribe> {
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
		export interface ChannelSubscriptionEnd extends Payload<Subscription.ChannelSubscriptionEnd> {
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
		export interface ChannelSubscriptionGift extends Payload<Subscription.ChannelSubscriptionGift> {
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
		export interface ChannelSubscriptionMessage extends Payload<Subscription.ChannelSubscriptionMessage> {
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
		export interface ChannelCheer extends Payload<Subscription.ChannelCheer> {
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
		export interface ChannelRaid extends Payload<Subscription.ChannelRaid> {
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
		export interface ChannelBan extends Payload<Subscription.ChannelBan> {
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
		export interface ChannelUnban extends Payload<Subscription.ChannelUnban> {
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
		export interface ChannelUnbanRequestCreate extends Payload<Subscription.ChannelUnbanRequestCreate> {
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
		export interface ChannelUnbanRequestResolve extends Payload<Subscription.ChannelUnbanRequestResolve> {
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
		export interface ChannelModerate extends Payload<Subscription.ChannelModerate> {
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
		export interface ChannelModerateV2 extends Payload<Subscription.ChannelModerateV2> {
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
		export interface ChannelModeratorAdd extends Payload<Subscription.ChannelModeratorAdd> {
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
		export interface ChannelModeratorRemove extends Payload<Subscription.ChannelModeratorRemove> {
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
		export interface ChannelGuestStarSessionBegin extends Payload<Subscription.ChannelGuestStarSessionBegin> {
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
		export interface ChannelGuestStarSessionEnd extends Payload<Subscription.ChannelGuestStarSessionEnd> {
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
		export interface ChannelGuestStarGuestUpdate extends Payload<Subscription.ChannelGuestStarGuestUpdate> {
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
		export interface ChannelGuestStarSettingsUpdate extends Payload<Subscription.ChannelGuestStarSettingsUpdate> {
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
		export interface ChannelPointsAutomaticRewardRedemptionAdd extends Payload<Subscription.ChannelPointsAutomaticRewardRedemptionAdd> {
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
		export interface ChannelPointsAutomaticRewardRedemptionAddV2 extends Payload<Subscription.ChannelPointsAutomaticRewardRedemptionAddV2> {
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
		export interface ChannelPointsCustomRewardAdd extends Payload<Subscription.ChannelPointsCustomRewardAdd> {
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
		export interface ChannelPointsCustomRewardUpdate extends Payload<Subscription.ChannelPointsCustomRewardUpdate> {
			/** The data of `channel.channel_points_custom_reward.update` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate) */
			event: ChannelPointsCustomRewardAdd["event"];
		}
		export interface ChannelPointsCustomRewardRemove extends Payload<Subscription.ChannelPointsCustomRewardRemove> {
			/** The data of `channel.channel_points_custom_reward.remove` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove) */
			event: ChannelPointsCustomRewardAdd["event"];
		}
		export interface ChannelPointsCustomRewardRedemptionAdd extends Payload<Subscription.ChannelPointsCustomRewardRedemptionAdd> {
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
		export interface ChannelPointsCustomRewardRedemptionUpdate extends Payload<Subscription.ChannelPointsCustomRewardRedemptionUpdate> {
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
		export interface ChannelPollBegin extends Payload<Subscription.ChannelPollBegin> {
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
		export interface ChannelPollProgress extends Payload<Subscription.ChannelPollProgress> {
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
		export interface ChannelPollEnd extends Payload<Subscription.ChannelPollEnd> {
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
		export interface ChannelPredictionBegin extends Payload<Subscription.ChannelPredictionBegin> {
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
		export interface ChannelPredictionProgress extends Payload<Subscription.ChannelPredictionProgress> {
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
		export interface ChannelPredictionLock extends Payload<Subscription.ChannelPredictionLock> {
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
		export interface ChannelPredictionEnd extends Payload<Subscription.ChannelPredictionEnd> {
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
		export interface ChannelSuspiciousUserUpdate extends Payload<Subscription.ChannelSuspiciousUserUpdate> {
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
		export interface ChannelSuspiciousUserMessage extends Payload<Subscription.ChannelSuspiciousUserMessage> {
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
		export interface ChannelVipAdd extends Payload<Subscription.ChannelVipAdd> {
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
		export interface ChannelVipRemove extends Payload<Subscription.ChannelVipRemove> {
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
		export interface ChannelWarningAcknowledge extends Payload<Subscription.ChannelWarningAcknowledge> {
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
		export interface ChannelWarningSend extends Payload<Subscription.ChannelWarningSend> {
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
		export interface ChannelCharityCampaignDonate extends Payload<Subscription.ChannelCharityCampaignDonate> {
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
		export interface ChannelCharityCampaignStart extends Payload<Subscription.ChannelCharityCampaignStart> {
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
		export interface ChannelCharityCampaignProgress extends Payload<Subscription.ChannelCharityCampaignProgress> {
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
		export interface ChannelCharityCampaignStop extends Payload<Subscription.ChannelCharityCampaignStop> {
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
		export interface ConduitShardDisabled extends Payload<Subscription.ConduitShardDisabled> {
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
		export interface DropEntitlementGrant extends Payload<Subscription.DropEntitlementGrant> {
			/** The data of `drop.entitlement.grant` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant) */
			events: {
				/** Individual event ID, as assigned by EventSub. Use this for de-duplicating messages. */
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
		export interface ExtensionBitsTransactionCreate extends Payload<Subscription.ExtensionBitsTransactionCreate> {
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
		export interface ChannelGoalBegin extends Payload<Subscription.ChannelGoalBegin> {
			/** The data of `channel.goal.begin` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#goal-subscriptions) */
			event: ChannelGoal.Event;
		}
		export interface ChannelGoalProgress extends Payload<Subscription.ChannelGoalProgress> {
			/** The data of `channel.goal.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#goal-subscriptions) */
			event: ChannelGoal.Event;
		}
		export interface ChannelGoalEnd extends Payload<Subscription.ChannelGoalEnd> {
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
		export interface ChannelHypeTrainBegin extends Payload<Subscription.ChannelHypeTrainBegin> {
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
		export interface ChannelHypeTrainProgress extends Payload<Subscription.ChannelHypeTrainProgress> {
			/** The data of `channel.hype_train.progress` event. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin) */
			event: ChannelHypeTrainBegin["event"];
		}
		export interface ChannelHypeTrainEnd extends Payload<Subscription.ChannelHypeTrainEnd> {
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
		export interface ChannelShieldModeBegin extends Payload<Subscription.ChannelShieldModeBegin> {
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
		export interface ChannelShieldModeEnd extends Payload<Subscription.ChannelShieldModeEnd> {
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
		export interface ChannelShoutoutCreate extends Payload<Subscription.ChannelShoutoutCreate> {
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
		export interface ChannelShoutoutReceive extends Payload<Subscription.ChannelShoutoutReceive> {
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
		export interface StreamOnline extends Payload<Subscription.StreamOnline> {
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
		export interface StreamOffline extends Payload<Subscription.StreamOffline> {
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
		export interface UserAuthorizationGrant extends Payload<Subscription.UserAuthorizationGrant> {
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
		export interface UserAuthorizationRevoke extends Payload<Subscription.UserAuthorizationRevoke> {
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
		export interface UserUpdate extends Payload<Subscription.UserUpdate> {
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
		export interface UserWhisperMessage extends Payload<Subscription.UserWhisperMessage> {
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
	export interface Session<Status extends "connected" | "reconnecting", KeepaliveTimeoutSeconds extends number | null, ReconnectURL extends string | null> {
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
	export namespace Session {
		/** An object that contains information about the connection. */
		export type Any = Connected | Reconnecting;
		/** An object that contains information about the connection. */
		export type Connected = Session<"connected", number, null>;
		/** An object that contains information about the connection. */
		export type Reconnecting = Session<"reconnecting", null, string>;
	}

	/** An object that identifies the message. */
	export interface Metadata<MessageType extends string = string> {
		/** An ID that uniquely identifies the message. Twitch sends messages at least once, but if Twitch is unsure of whether you received a notification, it’ll resend the message. This means you may receive a notification twice. If Twitch resends the message, the message ID will be the same. */
		message_id: string;
		/** The type of message. */
		message_type: MessageType;
		/** The UTC date and time that the message was sent. */
		message_timestamp: string;
	}
	export namespace Metadata {
		/** An object that identifies the subscription message. */
		export interface Subscription<MessageType extends string = string, SubscriptionType extends string = string, SubscriptionVersion extends Version = Version> extends Metadata<MessageType> {
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
			metadata: Metadata<"session_welcome">;
			/** An object that contains the message. */
			payload: {
				/** An object that contains information about the connection. */
				session: Session.Connected;
			};
		}
		/** Defines the message that the EventSub WebSocket server sends your client to indicate that the WebSocket connection is healthy. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#keepalive-message) */
		export interface SessionKeepalive {
			/** An object that identifies the message. */
			metadata: Metadata<"session_keepalive">;
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
			export function isAutomodMessageHold(data: EventSub.Message.Notification): data is Notification<Payload.AutomodMessageHold> { return data.metadata.subscription_type === "automod.message.hold" && data.metadata.subscription_version === "1" }
			export function isAutomodMessageHoldV2(data: EventSub.Message.Notification): data is Notification<Payload.AutomodMessageHoldV2> { return data.metadata.subscription_type === "automod.message.hold" && data.metadata.subscription_version === "2" }
			export function isAutomodMessageUpdate(data: EventSub.Message.Notification): data is Notification<Payload.AutomodMessageUpdate> { return data.metadata.subscription_type === "automod.message.update" && data.metadata.subscription_version === "1" }
			export function isAutomodMessageUpdateV2(data: EventSub.Message.Notification): data is Notification<Payload.AutomodMessageUpdateV2> { return data.metadata.subscription_type === "automod.message.update" && data.metadata.subscription_version === "2" }
			export function isAutomodSettingsUpdate(data: EventSub.Message.Notification): data is Notification<Payload.AutomodSettingsUpdate> { return data.metadata.subscription_type === "automod.settings.update" && data.metadata.subscription_version === "1" }
			export function isAutomodTermsUpdate(data: EventSub.Message.Notification): data is Notification<Payload.AutomodTermsUpdate> { return data.metadata.subscription_type === "automod.terms.update" && data.metadata.subscription_version === "1" }
			export function isChannelBitsUse(data: EventSub.Message.Notification): data is Notification<Payload.ChannelBitsUse> { return data.metadata.subscription_type === "channel.bits.use" && data.metadata.subscription_version === "1" }
			export function isChannelUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelUpdate> { return data.metadata.subscription_type === "channel.update" && data.metadata.subscription_version === "2" }
			export function isChannelFollow(data: EventSub.Message.Notification): data is Notification<Payload.ChannelFollow> { return data.metadata.subscription_type === "channel.follow" && data.metadata.subscription_version === "2" }
			export function isChannelAdBreakBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelAdBreakBegin> { return data.metadata.subscription_type === "channel.ad_break.begin" && data.metadata.subscription_version === "1" }
			export function isChannelChatClear(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatClear> { return data.metadata.subscription_type === "channel.chat.clear" && data.metadata.subscription_version === "1" }
			export function isChannelChatClearUserMessages(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatClearUserMessages> { return data.metadata.subscription_type === "channel.chat.clear_user_messages" && data.metadata.subscription_version === "1" }
			export function isChannelChatMessage(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatMessage> { return data.metadata.subscription_type === "channel.chat.message" && data.metadata.subscription_version === "1" }
			export function isChannelChatMessageDelete(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatMessageDelete> { return data.metadata.subscription_type === "channel.chat.message_delete" && data.metadata.subscription_version === "1" }
			export function isChannelChatNotification(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatNotification> { return data.metadata.subscription_type === "channel.chat.notification" && data.metadata.subscription_version === "1" }
			export function isChannelChatSettingsUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatSettingsUpdate> { return data.metadata.subscription_type === "channel.chat_settings.update" && data.metadata.subscription_version === "1" }
			export function isChannelChatUserMessageHold(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatUserMessageHold> { return data.metadata.subscription_type === "channel.chat.user_message_hold" && data.metadata.subscription_version === "1" }
			export function isChannelChatUserMessageUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelChatUserMessageUpdate> { return data.metadata.subscription_type === "channel.chat.user_message_update" && data.metadata.subscription_version === "1" }
			export function isChannelSharedChatSessionBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSharedChatSessionBegin> { return data.metadata.subscription_type === "channel.shared_chat.begin" && data.metadata.subscription_version === "1" }
			export function isChannelSharedChatSessionUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSharedChatSessionUpdate> { return data.metadata.subscription_type === "channel.shared_chat.update" && data.metadata.subscription_version === "1" }
			export function isChannelSharedChatSessionEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSharedChatSessionEnd> { return data.metadata.subscription_type === "channel.shared_chat.end" && data.metadata.subscription_version === "1" }
			export function isChannelSubscribe(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSubscribe> { return data.metadata.subscription_type === "channel.subscribe" && data.metadata.subscription_version === "1" }
			export function isChannelSubscriptionEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSubscriptionEnd> { return data.metadata.subscription_type === "channel.subscription.end" && data.metadata.subscription_version === "1" }
			export function isChannelSubscriptionGift(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSubscriptionGift> { return data.metadata.subscription_type === "channel.subscription.gift" && data.metadata.subscription_version === "1" }
			export function isChannelSubscriptionMessage(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSubscriptionMessage> { return data.metadata.subscription_type === "channel.subscription.message" && data.metadata.subscription_version === "1" }
			export function isChannelCheer(data: EventSub.Message.Notification): data is Notification<Payload.ChannelCheer> { return data.metadata.subscription_type === "channel.cheer" && data.metadata.subscription_version === "1" }
			export function isChannelRaid(data: EventSub.Message.Notification): data is Notification<Payload.ChannelRaid> { return data.metadata.subscription_type === "channel.raid" && data.metadata.subscription_version === "1" }
			export function isChannelBan(data: EventSub.Message.Notification): data is Notification<Payload.ChannelBan> { return data.metadata.subscription_type === "channel.ban" && data.metadata.subscription_version === "1" }
			export function isChannelUnban(data: EventSub.Message.Notification): data is Notification<Payload.ChannelUnban> { return data.metadata.subscription_type === "channel.unban" && data.metadata.subscription_version === "1" }
			export function isChannelUnbanRequestCreate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelUnbanRequestCreate> { return data.metadata.subscription_type === "channel.unban_request.create" && data.metadata.subscription_version === "1" }
			export function isChannelUnbanRequestResolve(data: EventSub.Message.Notification): data is Notification<Payload.ChannelUnbanRequestResolve> { return data.metadata.subscription_type === "channel.unban_request.resolve" && data.metadata.subscription_version === "1" }
			export function isChannelModerate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelModerate> { return data.metadata.subscription_type === "channel.moderate" && data.metadata.subscription_version === "1" }
			export function isChannelModerateV2(data: EventSub.Message.Notification): data is Notification<Payload.ChannelModerateV2> { return data.metadata.subscription_type === "channel.moderate" && data.metadata.subscription_version === "2" }
			export function isChannelModeratorAdd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelModeratorAdd> { return data.metadata.subscription_type === "channel.moderator.add" && data.metadata.subscription_version === "1" }
			export function isChannelModeratorRemove(data: EventSub.Message.Notification): data is Notification<Payload.ChannelModeratorRemove> { return data.metadata.subscription_type === "channel.moderator.remove" && data.metadata.subscription_version === "1" }
			export function isChannelGuestStarSessionBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGuestStarSessionBegin> { return data.metadata.subscription_type === "channel.guest_star_session.begin" && data.metadata.subscription_version === "beta" }
			export function isChannelGuestStarSessionEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGuestStarSessionEnd> { return data.metadata.subscription_type === "channel.guest_star_session.end" && data.metadata.subscription_version === "beta" }
			export function isChannelGuestStarGuestUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGuestStarGuestUpdate> { return data.metadata.subscription_type === "channel.guest_star_guest.update" && data.metadata.subscription_version === "beta" }
			export function isChannelGuestStarSettingsUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGuestStarSettingsUpdate> { return data.metadata.subscription_type === "channel.guest_star_settings.update" && data.metadata.subscription_version === "beta" }
			export function isChannelPointsAutomaticRewardRedemptionAdd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsAutomaticRewardRedemptionAdd> { return data.metadata.subscription_type === "channel.channel_points_automatic_reward_redancement.add" && data.metadata.subscription_version === "1" }
			export function isChannelPointsAutomaticRewardRedemptionAddV2(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsAutomaticRewardRedemptionAddV2> { return data.metadata.subscription_type === "channel.channel_points_automatic_reward_redemption.add" && data.metadata.subscription_version === "2" }
			export function isChannelPointsCustomRewardAdd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardAdd> { return data.metadata.subscription_type === "channel.channel_points_custom_reward.add" && data.metadata.subscription_version === "1" }
			export function isChannelPointsCustomRewardUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardUpdate> { return data.metadata.subscription_type === "channel.channel_points_custom_reward.update" && data.metadata.subscription_version === "1" }
			export function isChannelPointsCustomRewardRemove(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardRemove> { return data.metadata.subscription_type === "channel.channel_points_custom_reward.remove" && data.metadata.subscription_version === "1" }
			export function isChannelPointsCustomRewardRedemptionAdd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardRedemptionAdd> { return data.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.add" && data.metadata.subscription_version === "1" }
			export function isChannelPointsCustomRewardRedemptionUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPointsCustomRewardRedemptionUpdate> { return data.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.update" && data.metadata.subscription_version === "1" }
			export function isChannelPollBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPollBegin> { return data.metadata.subscription_type === "channel.poll.begin" && data.metadata.subscription_version === "1" }
			export function isChannelPollProgress(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPollProgress> { return data.metadata.subscription_type === "channel.poll.progress" && data.metadata.subscription_version === "1" }
			export function isChannelPollEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPollEnd> { return data.metadata.subscription_type === "channel.poll.end" && data.metadata.subscription_version === "1" }
			export function isChannelPredictionBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPredictionBegin> { return data.metadata.subscription_type === "channel.prediction.begin" && data.metadata.subscription_version === "1" }
			export function isChannelPredictionProgress(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPredictionProgress> { return data.metadata.subscription_type === "channel.prediction.progress" && data.metadata.subscription_version === "1" }
			export function isChannelPredictionLock(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPredictionLock> { return data.metadata.subscription_type === "channel.prediction.lock" && data.metadata.subscription_version === "1" }
			export function isChannelPredictionEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelPredictionEnd> { return data.metadata.subscription_type === "channel.prediction.end" && data.metadata.subscription_version === "1" }
			export function isChannelSuspiciousUserMessage(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSuspiciousUserMessage> { return data.metadata.subscription_type === "channel.suspicious_user.message" && data.metadata.subscription_version === "1" }
			export function isChannelSuspiciousUserUpdate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelSuspiciousUserUpdate> { return data.metadata.subscription_type === "channel.suspicious_user.update" && data.metadata.subscription_version === "1" }
			export function isChannelVipAdd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelVipAdd> { return data.metadata.subscription_type === "channel.vip.add" && data.metadata.subscription_version === "1" }
			export function isChannelVipRemove(data: EventSub.Message.Notification): data is Notification<Payload.ChannelVipRemove> { return data.metadata.subscription_type === "channel.vip.remove" && data.metadata.subscription_version === "1" }
			export function isChannelWarningAcknowledge(data: EventSub.Message.Notification): data is Notification<Payload.ChannelWarningAcknowledge> { return data.metadata.subscription_type === "channel.warning.acknowledge" && data.metadata.subscription_version === "1" }
			export function isChannelWarningSend(data: EventSub.Message.Notification): data is Notification<Payload.ChannelWarningSend> { return data.metadata.subscription_type === "channel.warning.send" && data.metadata.subscription_version === "1" }
			export function isChannelCharityCampaignDonate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelCharityCampaignDonate> { return data.metadata.subscription_type === "channel.charity_campaign.donate" && data.metadata.subscription_version === "1" }
			export function isChannelCharityCampaignStart(data: EventSub.Message.Notification): data is Notification<Payload.ChannelCharityCampaignStart> { return data.metadata.subscription_type === "channel.charity_campaign.start" && data.metadata.subscription_version === "1" }
			export function isChannelCharityCampaignProgress(data: EventSub.Message.Notification): data is Notification<Payload.ChannelCharityCampaignProgress> { return data.metadata.subscription_type === "channel.charity_campaign.progress" && data.metadata.subscription_version === "1" }
			export function isChannelCharityCampaignStop(data: EventSub.Message.Notification): data is Notification<Payload.ChannelCharityCampaignStop> { return data.metadata.subscription_type === "channel.charity_campaign.stop" && data.metadata.subscription_version === "1" }
			export function isConduitShardDisabled(data: EventSub.Message.Notification): data is Notification<Payload.ConduitShardDisabled> { return data.metadata.subscription_type === "conduit.shard.disabled" && data.metadata.subscription_version === "1" }
			export function isDropEntitlementGrant(data: EventSub.Message.Notification): data is Notification<Payload.DropEntitlementGrant> { return data.metadata.subscription_type === "drop.entitlement.grant" && data.metadata.subscription_version === "1" }
			export function isExtensionBitsTransactionCreate(data: EventSub.Message.Notification): data is Notification<Payload.ExtensionBitsTransactionCreate> { return data.metadata.subscription_type === "extension.bits_transaction.create" && data.metadata.subscription_version === "1" }
			export function isChannelGoalBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGoalBegin> { return data.metadata.subscription_type === "channel.goal.begin" && data.metadata.subscription_version === "1" }
			export function isChannelGoalProgress(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGoalProgress> { return data.metadata.subscription_type === "channel.goal.progress" && data.metadata.subscription_version === "1" }
			export function isChannelGoalEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelGoalEnd> { return data.metadata.subscription_type === "channel.goal.end" && data.metadata.subscription_version === "1" }
			export function isChannelHypeTrainBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelHypeTrainBegin> { return data.metadata.subscription_type === "channel.hype_train.begin" && data.metadata.subscription_version === "1" }
			export function isChannelHypeTrainProgress(data: EventSub.Message.Notification): data is Notification<Payload.ChannelHypeTrainProgress> { return data.metadata.subscription_type === "channel.hype_train.progress" && data.metadata.subscription_version === "1" }
			export function isChannelHypeTrainEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelHypeTrainEnd> { return data.metadata.subscription_type === "channel.hype_train.end" && data.metadata.subscription_version === "1" }
			export function isChannelShieldModeBegin(data: EventSub.Message.Notification): data is Notification<Payload.ChannelShieldModeBegin> { return data.metadata.subscription_type === "channel.shield_mode.begin" && data.metadata.subscription_version === "1" }
			export function isChannelShieldModeEnd(data: EventSub.Message.Notification): data is Notification<Payload.ChannelShieldModeEnd> { return data.metadata.subscription_type === "channel.shield_mode.end" && data.metadata.subscription_version === "1" }
			export function isChannelShoutoutCreate(data: EventSub.Message.Notification): data is Notification<Payload.ChannelShoutoutCreate> { return data.metadata.subscription_type === "channel.shoutout.create" && data.metadata.subscription_version === "1" }
			export function isChannelShoutoutReceive(data: EventSub.Message.Notification): data is Notification<Payload.ChannelShoutoutReceive> { return data.metadata.subscription_type === "channel.shoutout.receive" && data.metadata.subscription_version === "1" }
			export function isStreamOnline(data: EventSub.Message.Notification): data is Notification<Payload.StreamOnline> { return data.metadata.subscription_type === "stream.online" && data.metadata.subscription_version === "1" }
			export function isStreamOffline(data: EventSub.Message.Notification): data is Notification<Payload.StreamOffline> { return data.metadata.subscription_type === "stream.offline" && data.metadata.subscription_version === "1" }
			export function isUserAuthorizationGrant(data: EventSub.Message.Notification): data is Notification<Payload.UserAuthorizationGrant> { return data.metadata.subscription_type === "user.authorization.grant" && data.metadata.subscription_version === "1" }
			export function isUserAuthorizationRevoke(data: EventSub.Message.Notification): data is Notification<Payload.UserAuthorizationRevoke> { return data.metadata.subscription_type === "user.authorization.revoke" && data.metadata.subscription_version === "1" }
			export function isUserUpdate(data: EventSub.Message.Notification): data is Notification<Payload.UserUpdate> { return data.metadata.subscription_type === "user.update" && data.metadata.subscription_version === "1" }
			export function isUserWhisperMessage(data: EventSub.Message.Notification): data is Notification<Payload.UserWhisperMessage> { return data.metadata.subscription_type === "user.whisper.message" && data.metadata.subscription_version === "1" }
		}

		/** Defines the message that the EventSub WebSocket server sends if the server must drop the connection. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#reconnect-message) */
		export interface SessionReconnect {
			/** An object that identifies the message. */
			metadata: Metadata<"session_reconnect">;
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
			payload: Payload<Subscription, "authorization_revoked" | "user_removed" | "version_removed">;
		}
	}
}

export type Authorization<S extends Authorization.Scope[] = Authorization.Scope[]> = Authorization.App<S> | Authorization.User<S>;
export namespace Authorization {
	/** Specifies data of [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) */
	export interface App<S extends Scope[] = Scope[]> {
		/** The access token you specified in first argument of `Request.OAuth2Validate` */
		token: string;
		/** Client ID which belongs to this access token */
		client_id: string;
		/** Authorization scopes which contains this access token */
		scopes: S;
		/** How long, in seconds, the token is valid for */
		expires_in: number;
		/** Type of token */
		type: "app";
	}
	/** Specifies data of [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) */
	export interface User<S extends Scope[] = Scope[]> {
		/** The access token you specified in first argument of `Request.OAuth2Validate` */
		token: string;
		/** Client ID which belongs to this access token */
		client_id: string;
		/** Authorization scopes which contains this access token */
		scopes: S;
		/** How long, in seconds, the token is valid for */
		expires_in: number;
		/** User login associated to owner of token */
		user_login: string;
		/** User id associated to owner of token */
		user_id: string;
		/** Type of token */
		type: "user";
	}

	export type Scope = 
		| "analytics:read:extensions"
		| "analytics:read:games"
		| "bits:read"
		| "channel:bot"
		| "channel:manage:ads"
		| "channel:read:ads"
		| "channel:manage:broadcast"
		| "channel:read:charity"
		| "channel:edit:commercial"
		| "channel:read:editors"
		| "channel:manage:extensions"
		| "channel:read:goals"
		| "channel:read:guest_star"
		| "channel:manage:guest_star"
		| "channel:read:hype_train"
		| "channel:manage:moderators"
		| "channel:read:polls"
		| "channel:manage:polls"
		| "channel:read:predictions"
		| "channel:manage:predictions"
		| "channel:manage:raids"
		| "channel:read:redemptions"
		| "channel:manage:redemptions"
		| "channel:manage:schedule"
		| "channel:read:stream_key"
		| "channel:read:subscriptions"
		| "channel:manage:videos"
		| "channel:read:vips"
		| "channel:manage:vips"
		| "channel:moderate"
		| "clips:edit"
		| "moderation:read"
		| "moderator:manage:announcements"
		| "moderator:manage:automod"
		| "moderator:read:automod_settings"
		| "moderator:manage:automod_settings"
		| "moderator:read:banned_users"
		| "moderator:manage:banned_users"
		| "moderator:read:blocked_terms"
		| "moderator:manage:blocked_terms"
		| "moderator:read:chat_messages"
		| "moderator:manage:chat_messages"
		| "moderator:read:chat_settings"
		| "moderator:manage:chat_settings"
		| "moderator:read:chatters"
		| "moderator:read:followers"
		| "moderator:read:guest_star"
		| "moderator:manage:guest_star"
		| "moderator:read:moderators"
		| "moderator:read:shield_mode"
		| "moderator:manage:shield_mode"
		| "moderator:read:shoutouts"
		| "moderator:manage:shoutouts"
		| "moderator:read:suspicious_users"
		| "moderator:read:unban_requests"
		| "moderator:manage:unban_requests"
		| "moderator:read:vips"
		| "moderator:read:warnings"
		| "moderator:manage:warnings"
		| "user:bot"
		| "user:edit"
		| "user:edit:broadcast"
		| "user:read:blocked_users"
		| "user:manage:blocked_users"
		| "user:read:broadcast"
		| "user:read:chat"
		| "user:manage:chat_color"
		| "user:read:email"
		| "user:read:emotes"
		| "user:read:follows"
		| "user:read:moderated_channels"
		| "user:read:subscriptions"
		| "user:read:whispers"
		| "user:manage:whispers"
		| "user:write:chat"
		| "chat:edit"
		| "chat:read"
		| "whispers:read";
	export type WithScope<Has extends readonly Scope[], Required extends Scope> = Required extends Has[number] ? Has : never;

	export function hasScopes<S extends Scope[]>(authorization: Authorization, ...scopes: S): authorization is Authorization<S> {
		return scopes.every(scope => (authorization.scopes as string[]).includes(scope));
	}

	export function fromResponseBodyOAuth2Validate<S extends Scope[]>(body: ResponseBody.OAuth2Validate<S>): Authorization<S> {
		const body_: any = body;
		delete body_.ok;
		delete body_.status;
		return body_;
	}

	export namespace URL {
		/**
		 * Creates a authorize URL for getting user access token via [implicit grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow)
		 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
		 * @param redirect_uri Your app’s registered redirect URI. The access token is sent to this URI.
		 * @param scopes A list of scopes. The APIs that you’re calling identify the scopes you must list.
		 * @param force_verify Set to `true` to force the user to re-authorize your app’s access to their resources. The default is `false`.
		 * @param state Although optional, you are **strongly encouraged** to pass a state string to help prevent [Cross-Site Request Forgery](https://datatracker.ietf.org/doc/html/rfc6749#section-10.12) (CSRF) attacks. The server returns this string to you in your redirect URI (see the state parameter in the fragment portion of the URI). If this string doesn’t match the state string that you passed, ignore the response. The state string should be randomly generated and unique for each OAuth request.
		 */
		export function Token(client_id: string, redirect_uri: string, scopes?: Scope[], force_verify: boolean = false, state?: string): string {
			var url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${client_id}&redirect_uri=${redirect_uri}`;
			if (scopes && scopes.length > 0) url += `&scope=${encodeURI((scopes ?? []).join(' '))}`;
			if (force_verify) url += `&force_verify=true`;
			if (state) url += `&state=${state}`;
			return url;
		}
		/**
		 * Creates a authorize URL for getting user access token via [authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
		 * 
		 * Authorization code will be expired after **10 minutes**, so be fast to use `Request.OAuth2Token.AuthorizationCode` to get user access token and refresh token!
		 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
		 * @param redirect_uri Your app’s registered redirect URI. The authorization code is sent to this URI.
		 * @param scopes A list of scopes. The APIs that you’re calling identify the scopes you must list.
		 * @param force_verify Set to `true` to force the user to re-authorize your app’s access to their resources. The default is `false`.
		 * @param state Although optional, you are **strongly encouraged** to pass a state string to help prevent [Cross-Site Request Forgery](https://datatracker.ietf.org/doc/html/rfc6749#section-10.12) (CSRF) attacks. The server returns this string to you in your redirect URI (see the state parameter in the fragment portion of the URI). If this string doesn’t match the state string that you passed, ignore the response. The state string should be randomly generated and unique for each OAuth request.
		 */
		export function Code(client_id: string, redirect_uri: string, scopes?: Scope[], force_verify: boolean = false, state?: string): string {
			var url = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}`;
			if (scopes && scopes.length > 0) url += `&scope=${encodeURI((scopes ?? []).join(' '))}`;
			if (force_verify) url += `&force_verify=true`;
			if (state) url += `&state=${state}`;
			return url;
		}
	}
}

export namespace RequestBody {
	export interface ModifyChannelInformation {
		/** The ID of the game that the user plays. The game is not updated if the ID isn’t a game ID that Twitch recognizes. To unset this field, use “0” or “” (an empty string). */
		game_id?: string;
		/** The user’s preferred language. Set the value to an ISO 639-1 two-letter language code (for example, en for English). Set to “other” if the user’s preferred language is not a Twitch supported language. The language isn’t updated if the language code isn’t a Twitch supported language. */
		broadcaster_language?: string;
		/** The title of the user’s stream. You may not set this field to an empty string. */
		title?: string;
		/** The number of seconds you want your broadcast buffered before streaming it live. The delay helps ensure fairness during competitive play. Only users with Partner status may set this field. The maximum delay is 900 seconds (15 minutes). */
		delay?: number;
		/** A list of channel-defined tags to apply to the channel. To remove all tags from the channel, set tags to an empty array. Tags help identify the content that the channel streams. A channel may specify a maximum of 10 tags. Each tag is limited to a maximum of 25 characters and may not be an empty string or contain spaces or special characters. Tags are case insensitive. For readability, consider using camelCasing or PascalCasing. [Learn More](https://help.twitch.tv/s/article/guide-to-tags) */
		tags?: string[];
		/** List of labels that should be set as the Channel’s CCLs. */
		content_classification_labels?: {
			/** ID of the Content Classification Labels that must be added/removed from the channel. */
			id: "DebatedSocialIssuesAndPolitics" | "DrugsIntoxication" | "SexualThemes" | "ViolentGraphic" | "Gambling" | "ProfanityVulgarity";
			/** Boolean flag indicating whether the label should be enabled (true) or disabled for the channel. */
			is_enabled: boolean;
		}[];
		/** Boolean flag indicating if the channel has branded content. */
		is_branded_content?: boolean;
	}
	export interface CreateCustomReward {
		/** The custom reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
		title: string;
		/** The cost of the reward, in Channel Points. The minimum is 1 point. */
		cost: number;
		/** The prompt shown to the viewer when they redeem the reward. Specify a prompt if `is_user_input_required` is `true`. The prompt is limited to a maximum of 200 characters. */
		prompt?: string;
		/** A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is `true`. */
		is_enabled?: boolean;
		/** The background color to use for the reward. Specify the color using Hex format (for example, #9147FF). */
		background_color?: string;
		/** A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the `prompt` field. The default is `false`. */
		is_user_input_required?: boolean;
		/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the `max_per_stream` field). The default is `false`. */
		is_max_per_stream_enabled?: boolean;
		/** The maximum number of redemptions allowed per live stream. Applied only if `is_max_per_stream_enabled` is `true`. The minimum value is 1. */
		max_per_stream?: number;
		/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see the `max_per_user_per_stream` field). The default is `false`. */
		is_max_per_user_per_stream_enabled?: boolean;
		/** The maximum number of redemptions allowed per user per stream. Applied only if `s_max_per_user_per_stream_enabled` is `true`. The minimum value is 1. */
		max_per_user_per_stream?: number;
		/** A Boolean value that determines whether to apply a cooldown period between redemptions (see the `global_cooldown_seconds` field for the duration of the cooldown period). The default is `false`. */
		is_global_cooldown_enabled?: boolean;
		/** The cooldown period, in seconds. Applied only if the `is_global_cooldown_enabled` field is `true`. The minimum value is 1; however, the minimum value is 60 for it to be shown in the Twitch UX. */
		global_cooldown_seconds?: number;
		/** A Boolean value that determines whether redemptions should be set to `FULFILLED` status immediately when a reward is redeemed. If `false`, status is set to `UNFULFILLED` and follows the normal request queue process. The default is `false`. */
		should_redemptions_skip_request_queue?: boolean;
	}
	export interface UpdateCustomReward {
		/** The reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
		title?: string;
		/** The prompt shown to the viewer when they redeem the reward. Specify a prompt if  is . The prompt is limited to a maximum of 200 characters. (is_user_input_required, true) */
		prompt?: string;
		/** The cost of the reward, in channel points. The minimum is 1 point. */
		cost?: number;
		/** The background color to use for the reward. Specify the color using Hex format (for example, \\#00E5CB). */
		background_color?: string;
		/** A Boolean value that indicates whether the reward is enabled. Set to  to enable the reward. Viewers see only enabled rewards. (true) */
		is_enabled?: boolean;
		/** A Boolean value that determines whether users must enter information to redeem the reward. Set to  if user input is required. See the  field. (prompt, true) */
		is_user_input_required?: boolean;
		/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the  field). Set to  to limit redemptions. (max_per_stream, true) */
		is_max_per_stream_enabled?: boolean;
		/** The maximum number of redemptions allowed per live stream. Applied only if  is . The minimum value is 1. (is_max_per_stream_enabled, true) */
		max_per_stream?: number;
		/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see ). The minimum value is 1. Set to  to limit redemptions. (max_per_user_per_stream, true) */
		is_max_per_user_per_stream_enabled?: boolean;
		/** The maximum number of redemptions allowed per user per stream. Applied only if  is . (is_max_per_user_per_stream_enabled, true) */
		max_per_user_per_stream?: number;
		/** A Boolean value that determines whether to apply a cooldown period between redemptions. Set to  to apply a cooldown period. For the duration of the cooldown period, see . (global_cooldown_seconds, true) */
		is_global_cooldown_enabled?: boolean;
		/** The cooldown period, in seconds. Applied only if  is . The minimum value is 1; however, for it to be shown in the Twitch UX, the minimum value is 60. (is_global_cooldown_enabled, true) */
		global_cooldown_seconds?: number;
		/** A Boolean value that determines whether to pause the reward. Set to  to pause the reward. Viewers can’t redeem paused rewards.. (true) */
		is_paused?: boolean;
		/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If , status is set to UNFULFILLED and follows the normal request queue process. (false) */
		should_redemptions_skip_request_queue?: boolean;
	}
	export interface UpdateChatSettings {
		/** A Boolean value that determines whether chat messages must contain only emotes. Set to `true` if only emotes are allowed; otherwise, `false`. The default is `false`. */
		emote_mode?: boolean;
		/** A Boolean value that determines whether the broadcaster restricts the chat room to followers only. Set to `true` if the broadcaster restricts the chat room to followers only; otherwise, `false`. The default is `true`. To specify how long users must follow the broadcaster before being able to participate in the chat room, see the `follower_mode_duration` field. */
		follower_mode?: boolean;
		/** The length of time, in minutes, that users must follow the broadcaster before being able to participate in the chat room. Set only if `follower_mode` is `true`. Possible values are: 0 (no restriction) through 129600 (3 months). The default is 0. */
		follower_mode_duration?: number;
		/** A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message. Set to `true` if the broadcaster applies a delay; otherwise, `false`. The default is `false`. To specify the length of the delay, see the `non_moderator_chat_delay_duration` field. */
		non_moderator_chat_delay?: boolean;
		/**
		 * The amount of time, in seconds, that messages are delayed before appearing in chat. Set only if `non_moderator_chat_delay` is `true`. Possible values are:
		 * - `2` — 2 second delay (recommended)
		 * - `4` — 4 second delay
		 * - `6` — 6 second delay
		 */
		non_moderator_chat_delay_duration?: 2 | 4 | 6;
		/** A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Set to `true` if the broadcaster applies a wait period between messages; otherwise, `false`. The default is `false`. To specify the delay, see the `slow_mode_wait_time` field. */
		slow_mode?: boolean;
		/** The amount of time, in seconds, that users must wait between sending messages. Set only if `slow_mode` is `true`. Possible values are: from `3` (3 second delay) to `120` (2 minute delay). The default is 30 seconds. */
		slow_mode_wait_time?: number;
		/** A Boolean value that determines whether only users that subscribe to the broadcaster’s channel may talk in the chat room. Set to `true` if the broadcaster restricts the chat room to subscribers only; otherwise, `false`. The default is `false`. */
		subscriber_mode?: boolean;
		/** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room. Set to `true` if the broadcaster allows only unique messages; otherwise, `false`. The default is `false`. */
		unique_chat_mode?: boolean;
	}
}

export interface ResponseBody<OK extends boolean = true, Status extends number = 200> {
	/** The code status of request. */
	status: Status;
	/** The code status of request. */
	ok: OK;
}
export namespace ResponseBody {
	export interface StartCommercial extends ResponseBody {
		/** An array that contains a single object with the status of your start commercial request. */
		data: {
			/** The length of the commercial you requested. If you request a commercial that’s longer than 180 seconds, the API uses 180 seconds. */
			length: number;
			/** A message that indicates whether Twitch was able to serve an ad. */
			message: string;
			/** The number of seconds you must wait before running another commercial. */
			retry_after: number;
		};
	}
	export interface GetAdSchedule extends ResponseBody {
		/** An object that contains information related to the channel’s ad schedule. */
		data: {
			/** The number of snoozes available for the broadcaster. */
			snooze_count: number;
			/** The UTC timestamp when the broadcaster will gain an additional snooze, in RFC3339 format. */
			snooze_refresh_at: string;
			/** The UTC timestamp of the broadcaster’s next scheduled ad, in RFC3339 format. Empty if the channel has no ad scheduled or is not live. */
			next_ad_at: string;
			/** The length in seconds of the scheduled upcoming ad break. */
			duration: number;
			/** The UTC timestamp of the broadcaster’s last ad-break, in RFC3339 format. Empty if the channel has not run an ad or is not live. */
			last_ad_at: string;
			/** The amount of pre-roll free time remaining for the channel in seconds. Returns 0 if they are currently not pre-roll free. */
			preroll_free_time: number;
		};
	}
	export interface SnoozeNextAd extends ResponseBody {
		/** An array that contains information about the channel’s snoozes and next upcoming ad after successfully snoozing. */
		data: {
			/** The number of snoozes available for the broadcaster. */
			snooze_count: number;
			/** The UTC timestamp when the broadcaster will gain an additional snooze, in RFC3339 format. */
			snooze_refresh_at: string;
			/** The UTC timestamp of the broadcaster’s next scheduled ad, in RFC3339 format. */
			next_ad_at: string;
		}[];
	}
	export interface GetExtensionAnalytics extends ResponseBody {
		/** A list of reports. The reports are returned in no particular order; however, the data within each report is in ascending order by date (newest first). The report contains one row of data per day of the reporting window; the report contains rows for only those days that the extension was used. The array is empty if there are no reports. */
		data: {
			/** An ID that identifies the extension that the report was generated for. */
			extension_id: string;
			/** The URL that you use to download the report. The URL is valid for 5 minutes. */
			URL: string;
			/** The type of report. */
			type: "overview_v2";
			/** The reporting window’s start and end dates, in RFC3339 format. */
			date_range: {
				/** The reporting window’s start date. */
				started_at: string;
				/** The reporting window’s end date. */
				ended_at: string;
			};
			/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
			pagination?: {
				/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
				cursor?: string;
			}
		}[];
	}
	export interface GetGameAnalytics extends ResponseBody {
		/** A list of reports. The reports are returned in no particular order; however, the data within each report is in ascending order by date (newest first). The report contains one row of data per day of the reporting window; the report contains rows for only those days that the game was used. A report is available only if the game was broadcast for at least 5 hours over the reporting period. The array is empty if there are no reports. */
		data: {
			/** An ID that identifies the game that the report was generated for. */
			game_id: string;
			/** The URL that you use to download the report. The URL is valid for 5 minutes. */
			URL: string;
			/** The type of report. */
			type: string;
			/** The reporting window’s start and end dates, in RFC3339 format. */
			date_range: {
				/** The reporting window’s start date. */
				started_at: string;
				/** The reporting window’s end date. */
				ended_at: string;
			};
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
	}
	export interface GetBitsLeaderboard extends ResponseBody {
		/** A list of leaderboard leaders. The leaders are returned in rank order by how much they’ve cheered. The array is empty if nobody has cheered bits. */
		data: {
			/** An ID that identifies a user on the leaderboard. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** The user’s position on the leaderboard. */
			rank: number;
			/** The number of Bits the user has cheered. */
			score: number;
		}[];
		/** The reporting window’s start and end dates, in RFC3339 format. The dates are calculated by using the started_at and period query parameters. If you don’t specify the started_at query parameter, the fields contain empty strings. */
		date_range: {
			/** The reporting window’s start date. */
			started_at: string;
			/** The reporting window’s end date. */
			ended_at: string;
		};
		/** The number of ranked users in `data`. This is the value in the `count` query parameter or the total number of entries on the leaderboard, whichever is less. */
		total: number;
	}
	export interface GetCheermotes extends ResponseBody {
		/** The list of Cheermotes. The list is in ascending order by the `order` field’s value. */
		data: {
			/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. For example, if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
			prefix: string;
			/** A list of tier levels that the Cheermote supports. Each tier identifies the range of Bits that you can cheer at that tier level and an image that graphically identifies the tier level. */
			tiers: {
				/** The minimum number of Bits that you must cheer at this tier level. The maximum number of Bits that you can cheer at this level is determined by the required minimum Bits of the next tier level minus 1. For example, if `min_bits` is 1 and `min_bits` for the next tier is 100, the Bits range for this tier level is 1 through 99. The minimum Bits value of the last tier is the maximum number of Bits you can cheer using this Cheermote. For example, 10000. */
				min_bits: number;
				/** The tier level. */
				id: "1" | "100" | "500" | "1000" | "5000" | "10000" | "100000";
				/** The hex code of the color associated with this tier level (for example, #979797). */
				color: string;
				/** The animated and static image sets for the Cheermote. The dictionary of images is organized by theme, format, and size. The theme keys are `dark` and `light`. Each theme is a dictionary of formats: `animated` and `static`. Each format is a dictionary of sizes: 1, 1.5, 2, 3, and 4. The value of each size contains the URL to the image. */
				images: Record<"dark" | "light", Record<"animated" | "static", {
					"1": string;
					"1.5": string;
					"2": string;
					"3": string;
					"4": string;
				}>>;
				/** A Boolean value that determines whether users can cheer at this tier level. */
				can_cheer: boolean;
				/** A Boolean value that determines whether this tier level is shown in the Bits card. Is **true** if this tier level is shown in the Bits card. */
				show_in_bits_card: boolean;
			}[];
			/** The type of Cheermote. Possible values are:
			 * - `global_first_party` — A Twitch-defined Cheermote that is shown in the Bits card.
			 * - `global_third_party` — A Twitch-defined Cheermote that is not shown in the Bits card.
			 * - `channel_custom` — A broadcaster-defined Cheermote.
			 * - `display_only` — Do not use; for internal use only.
			 * - `sponsored` — A sponsor-defined Cheermote. When used, the sponsor adds additional Bits to the amount that the user cheered. For example, if the user cheered Terminator100, the broadcaster might receive 110 Bits, which includes the sponsor's 10 Bits contribution.
			 */
			type: "global_first_party" | "global_third_party" | "channel_custom" | "display_only" | "sponsored";
			/** The order that the Cheermotes are shown in the Bits card. The numbers may not be consecutive. For example, the numbers may jump from 1 to 7 to 13. The order numbers are unique within a Cheermote type (for example, global_first_party) but may not be unique amongst all Cheermotes in the response. */
			order: number;
			/** The date and time, in RFC3339 format, when this Cheermote was last updated. */
			last_updated: string;
			/** A Boolean value that indicates whether this Cheermote provides a charitable contribution match during charity campaigns. */
			is_charitable: boolean;
		}[];
	}
	export interface GetExtensionTransactions<ExtensionID extends string> extends ResponseBody {
		/** The list of transactions. */
		data: {
			/** An ID that identifies the transaction. */
			id: string;
			/** The UTC date and time (in RFC3339 format) of the transaction. */
			timestamp: string;
			/** The ID of the broadcaster that owns the channel where the transaction occurred. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The ID of the user that purchased the digital product. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** The type of transaction. */
			product_type: "BITS_IN_EXTENSION";
			/** Contains details about the digital product. */
			product_data: {
				/** An ID that identifies the digital product. */
				sku: string;
				/** Set to `twitch.ext.<extensionID>`. */
				domain: `twitch.ext.${ExtensionID}`;
				/** Contains details about the digital product’s cost. */
				cost: {
					/** The amount exchanged for the digital product. */
					amount: number;
					/** The type of currency exchanged. */
					type: "bits";
				};
				/** A Boolean value that determines whether the product is in development. Is `true` if the digital product is in development and cannot be exchanged. */
				inDevelopment: boolean;
				/** The name of the digital product. */
				displayName: string;
				/** This field is always empty since you may purchase only unexpired products. */
				expiration: "";
				/** A Boolean value that determines whether the data was broadcast to all instances of the extension. Is `true` if the data was broadcast to all instances. */
				broadcast: boolean;
			};
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
			cursor: string;
		};
	}
	export interface GetChannelInformation extends ResponseBody {
		/** A list that contains information about the specified channels. The list is empty if the specified channels weren’t found. */
		data: {
			/** An ID that uniquely identifies the broadcaster. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The broadcaster’s preferred language. The value is an ISO 639-1 two-letter language code (for example, `en` for English). The value is set to “other” if the language is not a Twitch supported language. */
			broadcaster_language: string;
			/** The name of the game that the broadcaster is playing or last played. The value is an empty string if the broadcaster has never played a game. */
			game_name: string;
			/** An ID that uniquely identifies the game that the broadcaster is playing or last played. The value is an empty string if the broadcaster has never played a game. */
			game_id: string;
			/** The title of the stream that the broadcaster is currently streaming or last streamed. The value is an empty string if the broadcaster has never streamed. */
			title: string;
			/**
			 * The value of the broadcaster’s stream delay setting, in seconds. This field’s value defaults to zero unless:
			 * 1. the request specifies a user access token
			 * 2. the ID in the `broadcaster_id` query parameter matches the user ID in the access token
			 * 3. the broadcaster has partner status and they set a non-zero stream delay value.
			 */
			delay: number;
			/** The tags applied to the channel. */
			tags: string[];
			/** The CCLs applied to the channel. */
			content_classification_labels: string[];
			/** Boolean flag indicating if the channel has branded content. */
			is_branded_content: boolean;
		}[];
	}
	export type ModifyChannelInformation = ResponseBody<true, 204>;
	export interface GetChannelEditors extends ResponseBody {
		/** A list of users that are editors for the specified broadcaster. The list is empty if the broadcaster doesn’t have editors. */
		data: {
			/** An ID that uniquely identifies a user with editor permissions. */
			user_id: string;
			/** The user’s display name. */
			user_name: string;
			/** The date and time, in RFC3339 format, when the user became one of the broadcaster’s editors. */
			created_at: string;
		}[];
	}
	export interface GetFollowedChannels extends ResponseBody {
		/** The list of broadcasters that the user follows. The list is in descending order by `followed_at` (with the most recently followed broadcaster first). The list is empty if the user doesn’t follow anyone. */
		data: {
			/** An ID that uniquely identifies the broadcaster that this user is following. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The UTC timestamp when the user started following the broadcaster. */
			followed_at: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
		/** The total number of broadcasters that the user follows. As someone pages through the list, the number may change as the user follows or unfollows broadcasters. */
		total: number;
	}
	export interface GetChannelFollowers extends ResponseBody {
		/** The list of users that follow the specified broadcaster. The list is in descending order by `followed_at` (with the most recent follower first). The list is empty if nobody follows the broadcaster, the specified `user_id` isn’t in the follower list, the user access token is missing the `moderator:read:followers` scope, or the user isn’t the broadcaster or moderator for the channel. */
		data: {
			/** The UTC timestamp when the user started following the broadcaster. */
			followed_at: string;
			/** An ID that uniquely identifies the user that’s following the broadcaster. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
		/** The total number of users that follow this broadcaster. As someone pages through the list, the number of users may change as users follow or unfollow the broadcaster. */
		total: number;
	}
	export interface CreateCustomReward extends ResponseBody {
		/** A list that contains the single custom reward you created. */
		data: GetCustomRewards["data"][0];
	}
	export type DeleteCustomReward = ResponseBody<true, 204>;
	export interface GetCustomRewards extends ResponseBody {
		/** A list of custom rewards. The list is in ascending order by `id`. If the broadcaster hasn't created custom rewards, the list is empty. */
		data: {
			/** The ID that uniquely identifies the broadcaster. */
			broadcaster_id: string;
			/** The broadcaster's login name. */
			broadcaster_login: string;
			/** The broadcaster's display name. */
			broadcaster_name: string;
			/** The ID that uniquely identifies this custom reward. */
			id: string;
			/** The title of the reward. */
			title: string;
			/** The prompt shown to the viewer when they redeem the reward if user input is required (see the `is_user_input_required` field). */
			prompt: string;
			/** The cost of the reward in Channel Points. */
			cost: number;
			/** A set of custom images for the reward. This field is `null` if the broadcaster didn't upload images. */
			image: GetCustomRewards["data"][0]["default_image"] | null;
			/** A set of default images for the reward. */
			default_image: {
				/** The URL to a small version of the image. */
				url_1x: string;
				/** The URL to a medium version of the image. */
				url_2x: string;
				/** The URL to a large version of the image. */
				url_4x: string;
			};
			/** The background color to use for the reward. The color is in Hex format (for example, #00E5CB). */
			background_color: string;
			/** A Boolean value that determines whether the reward is enabled. Is `true` if enabled; otherwise, `false`. Disabled rewards aren't shown to the user. */
			is_enabled: boolean;
			/** A Boolean value that determines whether the user must enter information when redeeming the reward. Is `true` if the user is prompted. */
			is_user_input_required: boolean;
			/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per live stream. */
			max_per_stream_setting: {
				/** A Boolean value that determines whether the reward applies a limit on the number of redemptions allowed per live stream. Is `true` if the reward applies a limit. */
				is_enabled: boolean;
				/** The maximum number of redemptions allowed per live stream. */
				max_per_stream: number;
			};
			/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per user per live stream. */
			max_per_user_per_stream_setting: {
				/** A Boolean value that determines whether the reward applies a limit on the number of redemptions allowed per user per live stream. Is `true` if the reward applies a limit. */
				is_enabled: boolean;
				/** The maximum number of redemptions allowed per user per live stream. */
				max_per_user_per_stream: number;
			};
			/** The settings used to determine whether to apply a cooldown period between redemptions and the length of the cooldown. */
			global_cooldown_setting: {
				/** A Boolean value that determines whether to apply a cooldown period. Is `true` if a cooldown period is enabled. */
				is_enabled: boolean;
				/** The cooldown period, in seconds. */
				global_cooldown_seconds: number;
			};
			/** A Boolean value that determines whether the reward is currently paused. Is `true` if the reward is paused. Viewers can't redeem paused rewards. */
			is_paused: boolean;
			/** A Boolean value that determines whether the reward is currently in stock. Is `true` if the reward is in stock. Viewers can't redeem out of stock rewards. */
			is_in_stock: boolean;
			/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If `false`, status is set to UNFULFILLED and follows the normal request queue process. */
			should_redemptions_skip_request_queue: boolean;
			/** The number of redemptions redeemed during the current live stream. The number counts against the `max_per_stream_setting` limit. This field is `null` if the broadcaster's stream isn't live or `max_per_stream_setting` isn't enabled. */
			redemptions_redeemed_current_stream: number | null;
			/** The timestamp of when the cooldown period expires. Is `null` if the reward isn't in a cooldown state. See the `global_cooldown_setting` field. */
			cooldown_expires_at: string | null;
		}[];
	}
	export interface GetCustomRewardRedemptions extends ResponseBody {
		/** The list of redemptions for the specified reward. The list is empty if there are no redemptions that match the redemption criteria. */
		data: {
			/** The ID that uniquely identifies the broadcaster. */
			broadcaster_id: string;
			/** The broadcaster's login name. */
			broadcaster_login: string;
			/** The broadcaster's display name. */
			broadcaster_name: string;
			/** The ID that uniquely identifies this redemption. */
			id: string;
			/** The user's login name. */
			user_login: string;
			/** The ID that uniquely identifies the user that redeemed the reward. */
			user_id: string;
			/** The user's display name. */
			user_name: string;
			/** The text the user entered at the prompt when they redeemed the reward; otherwise, an empty string if user input was not required. */
			user_input: string;
			/** The state of the redemption. Possible values are: `CANCELED`, `FULFILLED`, `UNFULFILLED` */
			status: 'CANCELED' | 'FULFILLED' | 'UNFULFILLED';
			/** The date and time of when the reward was redeemed, in RFC3339 format. */
			redeemed_at: string;
			/** The reward that the user redeemed. */
			reward: {
				/** The ID that uniquely identifies the redeemed reward. */
				id: string;
				/** The reward's title. */
				title: string;
				/** The prompt displayed to the viewer if user input is required. */
				prompt: string;
				/** The reward's cost, in Channel Points. */
				cost: number;
			};
		}[];
	}
	export interface UpdateCustomReward extends ResponseBody {
		/** The list contains the single reward that you updated. */
		data: GetCustomRewards["data"][0];
	}
	export interface UpdateCustomRewardRedemptionStatus extends ResponseBody {
		/** The list contains the single redemption that you updated. */
		data: GetCustomRewardRedemptions["data"][0];
	}
	export interface GetCharityCampaigns extends ResponseBody {
		/** A list that contains the charity campaign that the broadcaster is currently running. The list is empty if the broadcaster is not running a charity campaign; the campaign information is not available after the campaign ends. */
		data: {
			/** An ID that identifies the charity campaign. */
			id: string;
			/** An ID that identifies the broadcaster that's running the campaign. */
			broadcaster_id: string;
			/** The broadcaster's login name. */
			broadcaster_login: string;
			/** The broadcaster's display name. */
			broadcaster_name: string;
			/** The charity's name. */
			charity_name: string;
			/** A description of the charity. */
			charity_description: string;
			/** A URL to an image of the charity's logo. The image's type is PNG and its size is 100px X 100px. */
			charity_logo: string;
			/** A URL to the charity's website. */
			charity_website: string;
			/** The current amount of donations that the campaign has received. */
			current_amount: {
				/** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
				value: number;
				/** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
				decimal_places: number;
				/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
				currency: string;
			};
			/** The campaign's fundraising goal. This field is `null` if the broadcaster has not defined a fundraising goal. */
			target_amount: GetCharityCampaigns["data"][0]["current_amount"] | null;
		}[];
	}
	export interface GetCharityCampaignDonations extends ResponseBody {
		/** A list that contains the donations that users have made to the broadcaster's charity campaign. The list is empty if the broadcaster is not currently running a charity campaign; the donation information is not available after the campaign ends. */
		data: {
			/** An ID that identifies the donation. The ID is unique across campaigns. */
			id: string;
			/** An ID that identifies the charity campaign that the donation applies to. */
			campaign_id: string;
			/** An ID that identifies a user that donated money to the campaign. */
			user_id: string;
			/** The user's login name. */
			user_login: string;
			/** The user's display name. */
			user_name: string;
			/** An object that contains the amount of money that the user donated. */
			amount: GetCharityCampaigns["data"][0]["current_amount"];
		}[];
		/** An object that contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request's after query parameter. */
			cursor?: string;
		};
	}
	export interface GetChatters extends ResponseBody {
		/** The list of users that are connected to the broadcaster's chat room. The list is empty if no users are connected to the chat room. */
		data: {
			/** The ID of a user that's connected to the broadcaster's chat room. */
			user_id: string;
			/** The user's login name. */
			user_login: string;
			/** The user's display name. */
			user_name: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request's after query parameter. */
			cursor?: string;
		};
		/** The total number of users that are connected to the broadcaster's chat room. As you page through the list, the number of users may change as users join and leave the chat room. */
		total: number;
	}
	export interface GetChannelEmotes extends ResponseBody {
		/** The list of emotes that the specified broadcaster created. If the broadcaster hasn't created custom emotes, the list is empty. */
		data: {
			/** An ID that identifies this emote. */
			id: string;
			/** The name of the emote. This is the name that viewers type in the chat window to get the emote to appear. */
			name: string;
			/** The image URLs for the emote. These image URLs always provide a static, non-animated emote image with a light background. */
			images: {
				/** A URL to the small version (28px x 28px) of the emote. */
				url_1x: `https://static-cdn.jtvnw.net/emoticons/v2/${GetChannelEmotes["data"][0]["id"]}/static/light/1.0`;
				/** A URL to the medium version (56px x 56px) of the emote. */
				url_2x: `https://static-cdn.jtvnw.net/emoticons/v2/${GetChannelEmotes["data"][0]["id"]}/static/light/2.0`;
				/** A URL to the large version (112px x 112px) of the emote. */
				url_4x: `https://static-cdn.jtvnw.net/emoticons/v2/${GetChannelEmotes["data"][0]["id"]}/static/light/3.0`;
			};
			/** The subscriber tier at which the emote is unlocked. This field contains the tier information only if `emote_type` is set to `subscriptions`, otherwise, it's an empty string. */
			tier: string;
			/** The type of emote. */
			emote_type: 'bitstier' | 'follower' | 'subscriptions';
			/** An ID that identifies the emote set that the emote belongs to. */
			emote_set_id: string;
			/** The formats that the emote is available in. */
			format: Array<'static' | 'animated'>;
			/** The sizes that the emote is available in. */
			scale: Array<'1.0' | '2.0' | '3.0'>;
			/** The background themes that the emote is available in. */
			theme_mode: Array<'dark' | 'light'>;
		}[];
		/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
		template: `https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{format}}/{{theme_mode}}/{{scale}}`;
	}
	export interface GetGlobalEmotes extends ResponseBody {
		/** The list of global emotes. */
		data: Omit<GetChannelEmotes["data"][0], "tier" | "emote_type" | "emote_set_id">[];
		/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
		template: GetChannelEmotes["template"];
	}
	export interface GetEmoteSets extends ResponseBody {
		/** The list of emotes found in the specified emote sets. The list is empty if none of the IDs were found. The list is in the same order as the set IDs specified in the request. Each set contains one or more emoticons. */
		data: (Omit<GetChannelEmotes["data"][0], "tier"> & {
			/** The ID of the broadcaster who owns the emote. */
			owner_id: string;
		})[];
		/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
		template: GetChannelEmotes["template"];
	}
	export interface GetChannelChatBadges extends ResponseBody {
		/** The list of chat badges. The list is sorted in ascending order by `set_id`, and within a set, the list is sorted in ascending order by `id`. */
		data: {
			/** An ID that identifies this set of chat badges. For example, Bits or Subscriber. */
			set_id: string;
			/** The list of chat badges in this set. */
			versions: {
				/** An ID that identifies this version of the badge. The ID can be any value. For example, for Bits, the ID is the Bits tier level, but for World of Warcraft, it could be Alliance or Horde. */
				id: string;
				/** A URL to the small version (18px x 18px) of the badge. */
				image_url_1x: string;
				/** A URL to the medium version (36px x 36px) of the badge. */
				image_url_2x: string;
				/** A URL to the large version (72px x 72px) of the badge. */
				image_url_4x: string;
				/** The title of the badge. */
				title: string;
				/** The description of the badge. */
				description: string;
				/** The action to take when clicking on the badge. Set to `null` if no action is specified. */
				click_action: string | null;
				/** The URL to navigate to when clicking on the badge. Set to `null` if no URL is specified. */
				click_url: string | null;
			}[];
		}[];
	}
	export type GetGlobalChatBadges = GetChannelChatBadges;
	export interface GetChatSettings extends ResponseBody {
		/** The list of chat settings. The list contains a single object with all the settings. */
		data: {
			/** The ID of the broadcaster specified in the request. */
			broadcaster_id: string;
			/** A Boolean value that determines whether chat messages must contain only emotes. Is `true` if chat messages may contain only emotes; otherwise, `false`. */
			emote_mode: boolean;
			/** A Boolean value that determines whether the broadcaster restricts the chat room to followers only. Is `true` if the broadcaster restricts the chat room to followers only; otherwise, `false`. */
			follower_mode: boolean;
			/** The length of time, in minutes, that users must follow the broadcaster before being able to participate in the chat room. Is `null` if `follower_mode` is `false`. */
			follower_mode_duration: number | null;
			/** The moderator's ID. The response includes this field only if the request specifies a user access token that includes the `moderator:read:chat_settings` scope. */
			moderator_id?: string;
			/** A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. Is `true` if the broadcaster applies a delay; otherwise, `false`. The response includes this field only if the request specifies a user access token that includes the `moderator:read:chat_settings` scope and owner of token is one of the broadcaster’s moderators. */
			non_moderator_chat_delay?: boolean | null;
			/** The amount of time, in seconds, that messages are delayed before appearing in chat. Is `null` if `non_moderator_chat_delay` is `false`. The response includes this field only if the request specifies a user access token that includes the `moderator:read:chat_settings` scope and owner of token is one of the broadcaster’s moderators. */
			non_moderator_chat_delay_duration?: number | null;
			/** A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Is `true` if the broadcaster applies a delay; otherwise, `false`. */
			slow_mode: boolean;
			/** The amount of time, in seconds, that users must wait between sending messages. Is `null` if `slow_mode` is `false`. */
			slow_mode_wait_time: number | null;
			/** A Boolean value that determines whether only users that subscribe to the broadcaster's channel may talk in the chat room. Is `true` if the broadcaster restricts the chat room to subscribers only; otherwise, `false`. */
			subscriber_mode: boolean;
			/** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room. Is `true` if the broadcaster requires unique messages only; otherwise, `false`. */
			unique_chat_mode: boolean;
		};
	}
	export interface GetSharedChatSession extends ResponseBody {
		data: {
			/** The unique identifier for the shared chat session. */
			session_id: string;
			/** The User ID of the host channel. */
			host_broadcaster_id: string;
			/** The list of participants in the session. */
			participants: {
				/** The User ID of the participant channel. */
				broadcaster_id: string;
			}[];
			/** The UTC date and time (in RFC3339 format) for when the session was created. */
			created_at: string;
			/** The UTC date and time (in RFC3339 format) for when the session was last updated. */
			updated_at: string;
		}[];
	}
	export interface GetUserEmotes extends ResponseBody {
		data: (Omit<GetEmoteSets["data"][0], "images" | "emote_type"> & {
			/**
			 * The type of emote. The possible values are:
			 * - `none` — No emote type was assigned to this emote.
			 * - `bitstier` — A Bits tier emote.
			 * - `follower` — A follower emote.
			 * - `subscriptions` — A subscriber emote.
			 * - `channelpoints` — An emote granted by using channel points.
			 * - `rewards` — An emote granted to the user through a special event.
			 * - `hypetrain` — An emote granted for participation in a Hype Train.
			 * - `prime` — An emote granted for linking an Amazon Prime account.
			 * - `turbo` — An emote granted for having Twitch Turbo.
			 * - `smilies` — Emoticons supported by Twitch.
			 * - `globals` — An emote accessible by everyone.
			 * - `owl2019` — Emotes related to Overwatch League 2019.
			 * - `twofactor` — Emotes granted by enabling two-factor authentication on an account.
			 * - `limitedtime` — Emotes that were granted for only a limited time.
			 */
			emote_type: 'none' | 'bitstier' | 'follower' | 'subscriptions' | 'channelpoints' | 
				'rewards' | 'hypetrain' | 'prime' | 'turbo' | 'smilies' | 'globals' | 
				'owl2019' | 'twofactor' | 'limitedtime';
		})[];
		/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
		template: GetChannelEmotes["template"];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. For more information about pagination support, see [Twitch API Guide - Pagination](https://dev.twitch.tv/docs/api/guide#pagination). */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
			cursor?: string;
		};
	}
	export type UpdateChatSettings = GetChatSettings;
	export type SendChatAnnouncement = ResponseBody<true, 204>;
	export type SendShoutout = ResponseBody<true, 204>;
	export interface SendChatMessage extends ResponseBody {
		data: {
			/** The message id for the message that was sent. */
			message_id: string;
			/** If the message passed all checks and was sent. */
			is_sent: boolean;
			/** The reason the message was dropped, if any. */
			drop_reason?: {
				/** Code for why the message was dropped. */
				code: string;
				/** Message for why the message was dropped. */
				message: string;
			};
		};
	}
	export interface GetUserChatColor extends ResponseBody {
		/** The list of users and the color code they use for their name. */
		data: {
			/** An ID that uniquely identifies the user. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** The Hex color code that the user uses in chat for their name. If the user hasn’t specified a color in their settings, the string is empty. */
			color: string;
		}[];
	}
	export type UpdateUserChatColor = ResponseBody<true, 204>;
	export interface CreateClip extends ResponseBody {
		data: {
			/** A URL that you can use to edit the clip’s title, identify the part of the clip to publish, and publish the clip The URL is valid for up to 24 hours or until the clip is published, whichever comes first. [Learn More](https://help.twitch.tv/s/article/how-to-use-clips) */
			edit_url: string;
			/** An ID that uniquely identifies the clip. */
			id: string;
		}
	}
	export interface GetClips extends ResponseBody {
		/** The list of video clips. For clips returned by game_id or broadcaster_id, the list is in descending order by view count. For lists returned by id, the list is in the same order as the input IDs. */
		data: {
			/** An ID that uniquely identifies the clip. */
			id: string;
			/** A URL to the clip. */
			url: string;
			/** A URL that you can use in an iframe to embed the clip (see [Embedding Video and Clips](https://dev.twitch.tv/docs/embed/video-and-clips)). */
			embed_url: string;
			/** An ID that identifies the broadcaster that the video was clipped from. */
			broadcaster_id: string;
			/** The broadcaster's display name. */
			broadcaster_name: string;
			/** An ID that identifies the user that created the clip. */
			creator_id: string;
			/** The user's display name. */
			creator_name: string;
			/** An ID that identifies the video that the clip came from. This field contains an empty string if the video is not available. */
			video_id: string;
			/** The ID of the game that was being played when the clip was created. */
			game_id: string;
			/** The ISO 639-1 two-letter language code that the broadcaster broadcasts in. For example, en for English. The value is other if the broadcaster uses a language that Twitch doesn't support. */
			language: string;
			/** The title of the clip. */
			title: string;
			/** The number of times the clip has been viewed. */
			view_count: number;
			/** The date and time of when the clip was created. The date and time is in RFC3339 format. */
			created_at: string;
			/** A URL to a thumbnail image of the clip. */
			thumbnail_url: string;
			/** The length of the clip, in seconds. Precision is 0.1. */
			duration: number;
			/** The zero-based offset, in seconds, to where the clip starts in the video (VOD). Is `null` if the video is not available or hasn't been created yet from the live stream (see `video_id`). Note that there's a delay between when a clip is created during a broadcast and when the offset is set. During the delay period, `vod_offset` is `null`. The delay is indeterminant but is typically minutes long. */
			vod_offset: number | null;
			/** A Boolean value that indicates if the clip is featured or not. */
			is_featured: boolean;
		}[];
		/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Set the request's after or before query parameter to this value depending on whether you're paging forwards or backwards. */
			cursor?: string;
		};
	}
	export interface GetConduits extends ResponseBody {
		/** List of information about the client’s conduits. */
		data: {
			/** Conduit ID. */
			id: string;
			/** Number of shards associated with this conduit. */
			shard_count: number;
		}[];
	}
	export interface CreateConduit extends ResponseBody {
		/** Information about the created conduit. */
		data: GetConduits["data"][0];
	}
	export interface UpdateConduit extends ResponseBody {
		/** Updated information about the conduit. */
		data: GetConduits["data"][0];
	}
	export type DeleteConduit = ResponseBody<true, 204>;
	export interface GetConduitShards extends ResponseBody {
		/** List of information about a conduit's shards. */
		data: {
			/** Shard ID. */
			id: string;
			/** The shard status. The subscriber receives events only for enabled shards. Possible values are:
			 * - `enabled` — The shard is enabled.
			 * - `webhook_callback_verification_pending` — The shard is pending verification of the specified callback URL.
			 * - `webhook_callback_verification_failed` — The specified callback URL failed verification.
			 * - `notification_failures_exceeded` — The notification delivery failure rate was too high.
			 * - `websocket_disconnected` — The client closed the connection.
			 * - `websocket_failed_ping_pong` — The client failed to respond to a ping message.
			 * - `websocket_received_inbound_traffic` — The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
			 * - `websocket_internal_error` — The Twitch WebSocket server experienced an unexpected error.
			 * - `websocket_network_timeout` — The Twitch WebSocket server timed out writing the message to the client.
			 * - `websocket_network_error` — The Twitch WebSocket server experienced a network error writing the message to the client.
			 * - `websocket_failed_to_reconnect` - The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
			 */
			status: 
				'enabled' | 'webhook_callback_verification_pending' | 'webhook_callback_verification_failed' |
				'notification_failures_exceeded' | 'websocket_disconnected' | 'websocket_failed_ping_pong' |
				'websocket_received_inbound_traffic' | 'websocket_internal_error' | 'websocket_network_timeout' |
				'websocket_network_error' | 'websocket_failed_to_reconnect';
			/** The transport details used to send the notifications. */
			transport: EventSub.Transport.WebHook | EventSub.Transport.WebSocket.ConnectedAndDisconnected;
		}[];
		/** Contains information used to page through a list of results. The object is empty if there are no more pages left to page through. */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
			cursor?: string;
		}
	}
	export interface UpdateConduitShards extends ResponseBody<true, 202> {
		/** List of successful shard updates. */
		data: GetConduitShards["data"];
		/** List of unsuccessful updates. */
		errors: {
			/** Shard ID. */
			id: string;
			/** The error that occurred while updating the shard. Possible errors:
			 * - `The length of the string in the secret field is not valid`
			 * - `The URL in the transport's callback field is not valid. The URL must use the HTTPS protocol and the 443 port number`
			 * - `The value specified in the method field is not valid`
			 * - `The callback field is required if you specify the webhook transport method`
			 * - `The session_id field is required if you specify the WebSocket transport method`
			 * - `The websocket session is not connected`
			 * - `The shard id is outside of the conduit’s range`
			*/
			message: string;
			/** Error codes used to represent a specific error condition while attempting to update shards. */
			code: string;
		}[];
	}
	export interface GetContentClassificationLabels extends ResponseBody {
		/** A list that contains information about the available content classification labels. */
		data: {
			/** Unique identifier for the CCL. */
			id: string;
			/** Localized description of the CCL. */
			description: string;
			/** Localized name of the CCL. */
			name: string;
		}[];
	}
	// im lazy to make this for methods from Get Drops Entitlements to Update Extension Bits Product
	export interface CreateEventSubSubscription<Subscription_ extends EventSub.Subscription = EventSub.Subscription> extends ResponseBody<true, 202> {
		/** A object that contains the single subscription that you created. */
		data: {
			/** An ID that identifies the subscription. */
			id: string;
			/**
			 * The subscription’s status. The subscriber receives events only for enabled subscriptions. Possible values are:
			 * - `enabled` — The subscription is enabled.
			 * - `webhook_callback_verification_pending` — The subscription is pending verification of the specified callback URL (see [Responding to a challenge request](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#responding-to-a-challenge-request)).
			 */
			status: "enabled" | "webhook_callback_verification_pending";
			/** The subscription’s type. See [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). */
			type: Subscription_["type"];
			/** The version number that identifies this definition of the subscription’s data. */
			version: Subscription_["version"];
			/** The subscription’s parameter values. */
			condition: Subscription_["condition"];
			/** The date and time (in RFC3339 format) of when the subscription was created. */
			created_at: string;
			/** The transport details used to send the notifications. */
			transport: EventSub.Transport.WebHook | EventSub.Transport.WebSocket.Connected | EventSub.Transport.Conduit;
			/** The UTC date and time that the WebSocket connection was established. */
			connected_at: string;
			/** The amount that the subscription counts against your limit. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
			cost: number;
		};
		/** The total number of subscriptions you’ve created. */
		total: number;
		/** The sum of all of your subscription costs. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
		total_cost: number;
		/** The maximum total cost that you’re allowed to incur for all subscriptions you create. */
		max_total_cost: number;
	}
	export type DeleteEventSubSubscription = ResponseBody<true, 204>;
	export interface GetEventSubSubscriptions extends ResponseBody {
		/** The list of subscriptions. The list is ordered by the oldest subscription first. The list is empty if the client hasn't created subscriptions or there are no subscriptions that match the specified filter criteria. */
		data: {
			/** An ID that identifies the subscription. */
			id: string;
			/**
			 * The subscription's status. The subscriber receives events only for enabled subscriptions. Possible values are:
			 * - `enabled` — The subscription is enabled.
			 * - `webhook_callback_verification_pending` — The subscription is pending verification of the specified callback URL.
			 * - `webhook_callback_verification_failed` — The specified callback URL failed verification.
			 * - `notification_failures_exceeded` — The notification delivery failure rate was too high.
			 * - `authorization_revoked` — The authorization was revoked for one or more users specified in the Condition object.
			 * - `moderator_removed` — The moderator that authorized the subscription is no longer one of the broadcaster's moderators.
			 * - `user_removed` — One of the users specified in the Condition object was removed.
			 * - `version_removed` — The subscription to subscription type and version is no longer supported.
			 * - `beta_maintenance` — The subscription to the beta subscription type was removed due to maintenance.
			 * - `websocket_disconnected` — The client closed the connection.
			 * - `websocket_failed_ping_pong` — The client failed to respond to a ping message.
			 * - `websocket_received_inbound_traffic` — The client sent a non-pong message.
			 * - `websocket_connection_unused` — The client failed to subscribe to events within the required time.
			 * - `websocket_internal_error` — The Twitch WebSocket server experienced an unexpected error.
			 * - `websocket_network_timeout` — The Twitch WebSocket server timed out writing the message to the client.
			 * - `websocket_network_error` — The Twitch WebSocket server experienced a network error writing the message to the client.
			 */
			status:
				'enabled' | 'webhook_callback_verification_pending' | 'webhook_callback_verification_failed' |
				'notification_failures_exceeded' | 'authorization_revoked' | 'moderator_removed' |
				'user_removed' | 'version_removed' | 'beta_maintenance' | 'websocket_disconnected' |
				'websocket_failed_ping_pong' | 'websocket_received_inbound_traffic' | 'websocket_connection_unused' |
				'websocket_internal_error' | 'websocket_network_timeout' | 'websocket_network_error';
			/** The subscription's type. */
			type: string;
			/** The version number that identifies this definition of the subscription's data. */
			version: string;
			/** The subscription's parameter values. This is a string-encoded JSON object whose contents are determined by the subscription type. */
			condition: Record<string, unknown>;
			/** The date and time (in RFC3339 format) of when the subscription was created. */
			created_at: string;
			/** The transport details used to send the notifications. */
			transport: EventSub.Transport.WebHook | EventSub.Transport.WebSocket.ConnectedAndDisconnected;
			/** The amount that the subscription counts against your limit. [Read More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
			cost: number;
		}[];
		/** The total number of subscriptions that you've created. */
		total: number;
		/** The sum of all of your subscription costs. [Read More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
		total_cost: number;
		/** The maximum total cost that you're allowed to incur for all subscriptions that you create. */
		max_total_cost: number;
		/** An object that contains the cursor used to get the next page of subscriptions. The object is empty if there are no more pages to get. */
		pagination?: {
			/** The cursor value that you set the after query parameter to. */
			cursor?: string;
		};
	}
	export interface GetTopGames extends ResponseBody {
		/** The list of broadcasts. The broadcasts are sorted by the number of viewers, with the most popular first. */
		data: {
			/** An ID that identifies the category or game. */
			id: string;
			/** The category’s or game’s name. */
			name: string;
			/** A URL to the category’s or game’s box art. You must replace the `{width}x{height}` placeholder with the size of image you want. */
			box_art_url: string;
			/** The ID that [IGDB](https://www.igdb.com/) uses to identify this game. If the IGDB ID is not available to Twitch, this field is set to an empty string. */
			igdb_id: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s after or before query parameter to get the next or previous page of results. */
			cursor?: string;
		};
	}
	export interface GetGames extends ResponseBody {
		/** The list of categories and games. The list is empty if the specified categories and games weren’t found. */
		data: GetTopGames["data"];
	}
	export interface GetCreatorGoals extends ResponseBody {
		/** The list of goals. The list is empty if the broadcaster hasn’t created goals. */
		data: {
			/** An ID that identifies this goal. */
			id: string;
			/** An ID that identifies the broadcaster that created the goal. */
			broadcaster_id: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** 
			 * The type of goal. Possible values are:
			 * - `follower` — The goal is to increase followers.
			 * - `subscription` — The goal is to increase subscriptions. This type shows the net increase or decrease in tier points associated with the subscriptions.
			 * - `subscription_count` — The goal is to increase subscriptions. This type shows the net increase or decrease in the number of subscriptions.
			 * - `new_subscription` — The goal is to increase subscriptions. This type shows only the net increase in tier points associated with the subscriptions (it does not account for users that unsubscribed since the goal started).
			 * - `new_subscription_count` — The goal is to increase subscriptions. This type shows only the net increase in the number of subscriptions (it does not account for users that unsubscribed since the goal started)
			 */
			type: 'follower' | 'subscription' | 'subscription_count' | 'new_subscription' | 'new_subscription_count';
			/** A description of the goal. Is an empty string if not specified. */
			description: string;
			/** 
			 * The goal’s current value. The goal’s `type` determines how this value is increased or decreased.
			 * - If `type` is follower, this field is set to the broadcaster's current number of followers. This number increases with new followers and decreases when users unfollow the broadcaster.
			 * - If `type` is subscription, this field is increased and decreased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased or decreased by 2, not 1.
			 * - If `type` is subscription_count, this field is increased by 1 for each new subscription and decreased by 1 for each user that unsubscribes.
			 * - If `type` is new_subscription, this field is increased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased by 2, not 1.
			 * - If `type` is new_subscription_count, this field is increased by 1 for each new subscription.
			 */
			current_amount: number;
			/** The goal’s target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
			target_amount: number;
			/** The UTC date and time (in RFC3339 format) that the broadcaster created the goal. */
			created_at: string;
		}[];
	}
	// here must be Channel Guest Star things but who needs this anyways?
	export interface GetHypeTrainEvents extends ResponseBody {
		/** The list of Hype Train events. The list is empty if the broadcaster hasn’t run a Hype Train within the last 5 days. */
		data: {
			/** An ID that identifies this event. */
			id: string;
			/** The type of event. The string is in the form, hypetrain.{event_name}. The request returns only progress event types (i.e., hypetrain.progression). */
			event_type: string;
			/** The UTC date and time (in RFC3339 format) that the event occurred. */
			event_timestamp: string;
			/** The version number of the definition of the event’s data. For example, the value is 1 if the data in `event_data` uses the first definition of the event’s data. */
			version: string;
			/** The event’s data. */
			event_data: {
				/** The ID of the broadcaster that’s running the Hype Train. */
				broadcaster_id: string;
				/** The UTC date and time (in RFC3339 format) that another Hype Train can start. */
				cooldown_end_time: string;
				/** The UTC date and time (in RFC3339 format) that the Hype Train ends. */
				expires_at: string;
				/** The value needed to reach the next level. */
				goal: number;
				/** An ID that identifies this Hype Train. */
				id: string;
				/** The most recent contribution towards the Hype Train’s goal. */
				last_contribution: {
					/** The total amount contributed. If `type` is BITS, `total` represents the amount of Bits used. If `type` is SUBS, `total` is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
					total: number;
					/** The contribution method used. Possible values are:
					 * - `BITS` — Cheering with Bits.
					 * - `SUBS` — Subscription activity like subscribing or gifting subscriptions.
					 * - `OTHER` — Covers other contribution methods not listed. */
					type: 'BITS' | 'SUBS' | 'OTHER';
					/** The ID of the user that made the contribution. */
					user: string;
				};
				/** The highest level that the Hype Train reached (the levels are 1 through 5). */
				level: number;
				/** The UTC date and time (in RFC3339 format) that this Hype Train started. */
				started_at: string;
				/** The top contributors for each contribution type. For example, the top contributor using BITS (by aggregate) and the top contributor using SUBS (by count). */
				top_contributions: GetHypeTrainEvents["data"][0]["event_data"]["last_contribution"];
				/** The current total amount raised. */
				total: number;
			};
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. <a href="/docs/api/guide#pagination">Read More</a> */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
	}
	export interface CheckAutomodStatus extends ResponseBody {
		/** The list of messages and whether Twitch would approve them for chat. */
		data: {
			/** The caller-defined ID passed in the request. */
			msg_id: string;
			/** A Boolean value that indicates whether Twitch would approve the message for chat or hold it for moderator review or block it from chat. Is `true` if Twitch would approve the message; otherwise, `false` if Twitch would hold the message for moderator review or block it from chat. */
			is_permitted: boolean;
		}[];
	}
	export type ManageHeldAutoModMessages = ResponseBody<true, 204>;
	export interface GetAutoModSettings extends ResponseBody {
		/** The list of AutoMod settings. The list contains a single object that contains all the AutoMod settings. */
		data: {
			/** The broadcaster’s ID. */
			broadcaster_id: string;
			/** The moderator’s ID. */
			moderator_id: string;
			/** The default AutoMod level for the broadcaster. This field is `null` if the broadcaster has set one or more of the individual settings. */
			overall_level: number;
			/** The Automod level for discrimination against disability. */
			disability: number;
			/** The Automod level for hostility involving aggression. */
			aggression: number;
			/** The AutoMod level for discrimination based on sexuality, sex, or gender. */
			sexuality_sex_or_gender: number;
			/** The Automod level for discrimination against women. */
			misogyny: number;
			/** The Automod level for hostility involving name calling or insults. */
			bullying: number;
			/** The Automod level for profanity. */
			swearing: number;
			/** The Automod level for racial discrimination. */
			race_ethnicity_or_religion: number;
			/** The Automod level for sexual content. */
			sex_based_terms: number;
		};
	}
	export type UpdateAutoModSettings = GetAutoModSettings;
	export interface GetBannedUsers extends ResponseBody {
		/** The list of users that were banned or put in a timeout. */
		data: {
			/** The ID of the banned user. */
			user_id: string;
			/** The banned user’s login name. */
			user_login: string;
			/** The banned user’s display name. */
			user_name: string;
			/** The UTC date and time (in RFC3339 format) of when the timeout expires, or an empty string if the user is permanently banned. */
			expires_at: string;
			/** The UTC date and time (in RFC3339 format) of when the user was banned. */
			created_at: string;
			/** The reason the user was banned or put in a timeout if the moderator provided one. */
			reason: string;
			/** The ID of the moderator that banned the user or put them in a timeout. */
			moderator_id: string;
			/** The moderator’s login name. */
			moderator_login: string;
			/** The moderator’s display name. */
			moderator_name: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. <a href="/docs/api/guide#pagination">Read More</a> */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
	}
	export interface BanUser extends ResponseBody {
		/** A list that contains the user you successfully banned or put in a timeout. */
		data: {
			/** The broadcaster whose chat room the user was banned from chatting in. */
			broadcaster_id: string;
			/** The moderator that banned or put the user in the timeout. */
			moderator_id: string;
			/** The user that was banned or put in a timeout. */
			user_id: string;
			/** The UTC date and time (in RFC3339 format) that the ban or timeout was placed. */
			created_at: string;
			/** The UTC date and time (in RFC3339 format) that the timeout will end. Is `null` if the user was banned instead of being put in a timeout. */
			end_time: string;
		};
	}
	export type UnbanUser = ResponseBody<true, 204>;
	export interface GetUnbanRequests extends ResponseBody {
		/** A list that contains information about the channel's unban requests. */
		data: {
			/** Unban request ID. */
			id: string;
			/** User ID of broadcaster whose channel is receiving the unban request. */
			broadcaster_id: string;
			/** The broadcaster's display name. */
			broadcaster_name: string;
			/** The broadcaster's login name. */
			broadcaster_login: string;
			/** User ID of moderator who approved/denied the request. */
			moderator_id: string;
			/** The moderator's login name. */
			moderator_login: string;
			/** The moderator's display name. */
			moderator_name: string;
			/** User ID of the requestor who is asking for an unban. */
			user_id: string;
			/** The user's login name. */
			user_login: string;
			/** The user's display name. */
			user_name: string;
			/** Text of the request from the requesting user. */
			text: string;
			/** Status of the request. */
			status: 'pending' | 'approved' | 'denied' | 'acknowledged' | 'canceled';
			/** Timestamp of when the unban request was created. */
			created_at: string;
			/** Timestamp of when moderator/broadcaster approved or denied the request. */
			resolved_at: string;
			/** Text input by the resolver (moderator) of the unban. request */
			resolution_text: string;
		}[];
		/** Contains information used to page through a list of results. The object is empty if there are no more pages left to page through. */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
			cursor?: string;
		};
	}
	export interface ResolveUnbanRequest<Status extends 'approved' | 'denied' = 'approved' | 'denied'> extends ResponseBody {
		data: Omit<GetUnbanRequests["data"][0], "status"> & {
			/** Status of the request. */
			status: Status;
		};
	}
	export interface GetBlockedTerms extends ResponseBody {
		/** The list of blocked terms. The list is in descending order of when they were created (see the `created_at` timestamp). */
		data: {
			/** The broadcaster that owns the list of blocked terms. */
			broadcaster_id: string;
			/** The moderator that blocked the word or phrase from being used in the broadcaster’s chat room. */
			moderator_id: string;
			/** An ID that identifies this blocked term. */
			id: string;
			/** The blocked word or phrase. */
			text: string;
			/** The UTC date and time (in RFC3339 format) that the term was blocked. */
			created_at: string;
			/** The UTC date and time (in RFC3339 format) that the term was updated. When the term is added, this timestamp is the same as `created_at`. The timestamp changes as AutoMod continues to deny the term. */
			updated_at: string;
			/** The UTC date and time (in RFC3339 format) that the blocked term is set to expire. After the block expires, users may use the term in the broadcaster’s chat room. This field is `null` if the term was added manually or was permanently blocked by AutoMod. */
			expires_at: string;
			/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
			pagination: {
				/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
				cursor?: string;
			};
		}[];
	}
	export interface AddBlockedTerm extends ResponseBody {
		/** A list that contains the single blocked term that the broadcaster added. */
		data: {
			/** The broadcaster that owns the list of blocked terms. */
			broadcaster_id: string;
			/** The moderator that blocked the word or phrase from being used in the broadcaster’s chat room. */
			moderator_id: string;
			/** An ID that identifies this blocked term. */
			id: string;
			/** The blocked word or phrase. */
			text: string;
			/** The UTC date and time (in RFC3339 format) that the term was blocked. */
			created_at: string;
			/** The UTC date and time (in RFC3339 format) that the term was updated. When the term is added, this timestamp is the same as `created_at`. The timestamp changes as AutoMod continues to deny the term. */
			updated_at: string;
			/** The UTC date and time (in RFC3339 format) that the blocked term is set to expire. After the block expires, users may use the term in the broadcaster’s chat room. This field is `null` if the term was added manually or was permanently blocked by AutoMod. */
			expires_at: string | null;
			/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. https://dev.twitch.tv/docs/api/guide#pagination */
			pagination: {
				/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
				cursor?: string;
			};
		};
	}
	export type RemoveBlockedTerm = ResponseBody<true, 204>;
	export type DeleteChatMessage = ResponseBody<true, 204>;
	export interface GetModeratedChannels extends ResponseBody {
		/** The list of channels that the user has moderator privileges in. */
		data: {
			/** An ID that uniquely identifies the channel this user can moderate. */
			broadcaster_id: string;
			/** The channel’s login name. */
			broadcaster_login: string;
			/** The channels’ display name. */
			broadcaster_name: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
			cursor?: string;
		};
	}
	export interface GetModerators extends ResponseBody {
		/** The list of moderators. */
		data: {
			/** The ID of the user that has permission to moderate the broadcaster’s channel. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv//docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
	}
	export type AddChannelModerator = ResponseBody<true, 204>;
	export type RemoveChannelModerator = ResponseBody<true, 204>;
	export interface GetChannelVips extends ResponseBody {
		/** The list of VIPs. The list is empty if the broadcaster doesn’t have VIP users. */
		data: {
			/** An ID that uniquely identifies the VIP user. */
			user_id: string;
			/** The user’s display name. */
			user_name: string;
			/** The user’s login name. */
			user_login: string;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
	}
	export type AddChannelVip = ResponseBody<true, 204>;
	export type RemoveChannelVip = ResponseBody<true, 204>;
	export interface UpdateShieldModeStatus extends ResponseBody {
		/** Object with the broadcaster’s updated Shield Mode status. */
		data: {
			/** A Boolean value that determines whether Shield Mode is active. Is `true` if Shield Mode is active; otherwise, `false`. */
			is_active: boolean;
			/** An ID that identifies the moderator that last activated Shield Mode. */
			moderator_id: string;
			/** The moderator’s login name. */
			moderator_login: string;
			/** The moderator’s display name. */
			moderator_name: string;
			/** The UTC timestamp (in RFC3339 format) of when Shield Mode was last activated. */
			last_activated_at: string;
		};
	}
	export interface GetShieldModeStatus extends ResponseBody {
		/** Object with the broadcaster’s Shield Mode status. */
		data: {
			/** A Boolean value that determines whether Shield Mode is active. Is `true` if the broadcaster activated Shield Mode; otherwise, `false`. */
			is_active: boolean;
			/** An ID that identifies the moderator that last activated Shield Mode. Is an empty string if Shield Mode hasn’t been previously activated. */
			moderator_id: string;
			/** The moderator’s login name. Is an empty string if Shield Mode hasn’t been previously activated. */
			moderator_login: string;
			/** The moderator’s display name. Is an empty string if Shield Mode hasn’t been previously activated. */
			moderator_name: string;
			/** The UTC timestamp (in RFC3339 format) of when Shield Mode was last activated. Is an empty string if Shield Mode hasn’t been previously activated. */
			last_activated_at: string;
		};
	}
	export interface WarnChatUser extends ResponseBody {
		/** A list that contains information about the warning. */
		data: {
			/** The ID of the channel in which the warning will take effect. */
			broadcaster_id: string;
			/** The ID of the warned user. */
			user_id: string;
			/** The ID of the user who applied the warning. */
			moderator_id: string;
			/** The reason provided for warning. */
			reason: string;
		};
	}
	export interface GetPolls extends ResponseBody {
		/** A list of polls. The polls are returned in descending order of start time unless you specify IDs in the request, in which case they're returned in the same order as you passed them in the request. The list is empty if the broadcaster hasn't created polls. */
		data: {
			/** An ID that identifies the poll. */
			id: string;
			/** An ID that identifies the broadcaster that created the poll. */
			broadcaster_id: string;
			/** The broadcaster's display name. */
			broadcaster_name: string;
			/** The broadcaster's login name. */
			broadcaster_login: string;
			/** The question that viewers are voting on. For example, `What game should I play next?` The title may contain a maximum of 60 characters. */
			title: string;
			/** A list of choices that viewers can choose from. The list will contain a minimum of two choices and up to a maximum of five choices. */
			choices: {
				/** An ID that identifies this choice. */
				id: string;
				/** The choice's title. The title may contain a maximum of 25 characters. */
				title: string;
				/** The total number of votes cast for this choice. */
				votes: number;
				/** The number of votes cast using Channel Points. */
				channel_points_votes: number;
				/** Not used. */
				bits_votes: 0;
			}[];
			/** Not used. */
			bits_voting_enabled: false;
			/** Not used. */
			bits_per_vote: 0;
			/** A Boolean value that indicates whether viewers may cast additional votes using Channel Points. For information about Channel Points, see [Channel Points Guide](https://help.twitch.tv/s/article/channel-points-guide) */
			channel_points_voting_enabled: boolean;
			/** The number of points the viewer must spend to cast one additional vote. */
			channel_points_per_vote: number;
			/**
			 * The poll's status. Valid values are:
			 * - `ACTIVE` — The poll is running.
			 * - `COMPLETED` — The poll ended on schedule (see the `duration` field).
			 * - `TERMINATED` — The poll was terminated before its scheduled end.
			 * - `ARCHIVED` — The poll has been archived and is no longer visible on the channel.
			 * - `MODERATED` — The poll was deleted.
			 * - `INVALID` — Something went wrong while determining the state.
			 */
			status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID';
			/** The length of time (in seconds) that the poll will run for. */
			duration: number;
			/** The UTC date and time (in RFC3339 format) of when the poll began. */
			started_at: string;
			/** The UTC date and time (in RFC3339 format) of when the poll ended. If `status` is ACTIVE, this field is set to `null`. */
			ended_at: string | null;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request's `after` query parameter. */
			cursor?: string;
		};
	}
	export interface CreatePoll extends ResponseBody {
		/** An object that contains the poll that you created. */
		data: Omit<GetPolls["data"][0], "status"> & {
			/** The poll's status. */
			status: "ACTIVE";
		};
	}
	export interface EndPoll<Status extends 'TERMINATED' | 'ARCHIVED' = 'TERMINATED' | 'ARCHIVED'> extends ResponseBody {
		/** An object that contains the poll that you ended. */
		data: Omit<GetPolls["data"][0], "status"> & {
			/** The poll's status. */
			status: Status;
		};
	}
	export interface GetPredictions extends ResponseBody {
		/** The broadcaster’s list of Channel Points Predictions. The list is sorted in descending ordered by when the prediction began (the most recent prediction is first). The list is empty if the broadcaster hasn’t created predictions. */
		data: {
			/** An ID that identifies this prediction. */
			id: string;
			/** An ID that identifies the broadcaster that created the prediction. */
			broadcaster_id: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The question that the prediction asks. For example, `Will I finish this entire pizza?` */
			title: string;
			/** The ID of the winning outcome. Is `null` unless `status` is `RESOLVED`. */
			winning_outcome_id: string | null;
			/** The list of possible outcomes for the prediction. */
			outcomes: {
				/** An ID that identifies this outcome. */
				id: string;
				/** The outcome’s text. */
				title: string;
				/** The number of unique viewers that chose this outcome. */
				users: number;
				/** The number of Channel Points spent by viewers on this outcome. */
				channel_points: number;
				/** A list of viewers who were the top predictors; otherwise, `null` if none. */
				top_predictors: {
					/** An ID that identifies the viewer. */
					user_id: string;
					/** The viewer’s display name. */
					user_name: string;
					/** The viewer’s login name. */
					user_login: string;
					/** The number of Channel Points the viewer spent. */
					channel_points_used: number;
					/** The number of Channel Points distributed to the viewer. */
					channel_points_won: number;
				}[] | null;
				/** The color that visually identifies this outcome in the UX. If the number of outcomes is two, the color is `BLUE` for the first outcome and `PINK` for the second outcome. If there are more than two outcomes, the color is `BLUE` for all outcomes. */
				color: 'BLUE' | 'PINK';
			}[];
			/** The length of time (in seconds) that the prediction will run for. */
			prediction_window: number;
			/** The prediction’s status. Valid values are:
			 * - `ACTIVE` — The Prediction is running and viewers can make predictions.
			 * - `CANCELED` — The broadcaster canceled the Prediction and refunded the Channel Points to the participants.
			 * - `LOCKED` — The broadcaster locked the Prediction, which means viewers can no longer make predictions.
			 * - `RESOLVED` — The winning outcome was determined and the Channel Points were distributed to the viewers who predicted the correct outcome. */
			status: 'ACTIVE' | 'CANCELED' | 'LOCKED' | 'RESOLVED';
			/** The UTC date and time of when the Prediction began. */
			created_at: string;
			/** The UTC date and time of when the Prediction ended. If `status` is `ACTIVE`, this is set to `null`. */
			ended_at: string | null;
			/** The UTC date and time of when the Prediction was locked. If `status` is not `LOCKED`, this is set to `null`. */
			locked_at: string | null;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
			cursor?: string;
		};
	}
	export interface CreatePrediction extends ResponseBody {
		/** An object that contains the single prediction that you created. */
		data: Omit<GetPredictions["data"][0], "status"> & {
			/** The prediction’s status. */
			status: 'ACTIVE';
		};
	}
	export interface EndPrediction extends ResponseBody {
		/** An object that contains the single prediction that you ended. */
		data: Omit<GetPredictions["data"][0], "status"> & {
			/** The prediction’s status. */
			status: 'RESOLVED' | 'CANCELED' | 'LOCKED';
		};
	}
	export interface StartRaid extends ResponseBody {
		/** An object with information about the pending raid. */
		data: {
			/** The UTC date and time, in RFC3339 format, of when the raid was requested. */
			created_at: string;
			/** A Boolean value that indicates whether the channel being raided contains mature content. */
			is_mature: boolean;
		};
	}
	export type CancelRaid = ResponseBody<true, 204>;
	// im lazy to make this for methods from Get Channel Stream Schedule to Delete Channel Stream Schedule Segment
	export interface SearchCategories extends ResponseBody {
		/** The list of games or categories that match the query. The list is empty if there are no matches. */
		data: {
			/** A URL to an image of the game’s box art or streaming category. */
			box_art_url: string;
			/** The name of the game or category. */
			name: string;
			/** An ID that uniquely identifies the game or category. */
			id: string;
		}[];
	}
	export interface SearchChannels extends ResponseBody {
		/** The list of channels that match the query. The list is empty if there are no matches. */
		data: {
			/** The ISO 639-1 two-letter language code of the language used by the broadcaster. For example, `en` for English. If the broadcaster uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang), the value is `other`. */
			broadcaster_language: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			display_name: string;
			/** The ID of the game that the broadcaster is playing or last played. */
			game_id: string;
			/** The name of the game that the broadcaster is playing or last played. */
			game_name: string;
			/** An ID that uniquely identifies the channel (this is the broadcaster’s ID). */
			id: string;
			/** A Boolean value that determines whether the broadcaster is streaming live. Is `true` if the broadcaster is streaming live; otherwise, `false`. */
			is_live: boolean;
			/** **IMPORTANT** As of February 28, 2023, this field is deprecated and returns only an empty array. If you use this field, please update your code to use the `tags` field. */
			tag_ids: [];
			/** The tags applied to the channel. */
			tags: string[];
			/** A URL to a thumbnail of the broadcaster’s profile image. */
			thumbnail_url: string;
			/** The stream’s title. Is an empty string if the broadcaster didn’t set it. */
			title: string;
			/** The UTC date and time (in RFC3339 format) of when the broadcaster started streaming. The string is empty if the broadcaster is not streaming live. */
			started_at: string;
		}[];
	}
	export interface GetStreamKey extends ResponseBody {
		/** A list that contains the channel’s stream key. */
		data: {
			/** The channel’s stream key. */
			stream_key: string;
		};
	}
	export interface GetStreams extends ResponseBody {
		/** The list of streams. */
		data: {
			/** An ID that identifies the stream. You can use this ID later to look up the video on demand (VOD). */
			id: string;
			/** The ID of the user that’s broadcasting the stream. */
			user_id: string;
			/** The user’s login name. */
			user_login: string;
			/** The user’s display name. */
			user_name: string;
			/** The ID of the category or game being played. */
			game_id: string;
			/** The name of the category or game being played. */
			game_name: string;
			/** The type of stream. If an error occurs, this field is set to an empty string. */
			type: 'live' | '';
			/** The stream’s title. Is an empty string if not set. */
			title: string;
			/** The tags applied to the stream. */
			tags: string[];
			/** The number of users watching the stream. */
			viewer_count: number;
			/** The UTC date and time (in RFC3339 format) of when the broadcast began. */
			started_at: string;
			/** The language that the stream uses. This is an ISO 639-1 two-letter language code or `other` if the stream uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). */
			language: string;
			/** A URL to an image of a frame from the last 5 minutes of the stream. Replace the width and height placeholders in the URL (`{width}x{height}`) with the size of the image you want, in pixels. */
			thumbnail_url: string;
			/** **IMPORTANT** As of February 28, 2023, this field is deprecated and returns only an empty array. If you use this field, please update your code to use the `tags` field. */
			tag_ids: [];
			/** A Boolean value that indicates whether the stream is meant for mature audiences. */
			is_mature: boolean;
		}[];
		/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Set the request’s `after` or `before` query parameter to this value depending on whether you’re paging forwards or backwards. */
			cursor?: string;
		};
	}
	export type GetFollowedStreams = GetStreams;
	// CreateStreamMarker
	// GetStreamMarkers
	export interface GetBroadcasterSubscriptions extends ResponseBody {
		/** The list of users that subscribe to the broadcaster. The list is empty if the broadcaster has no subscribers. */
		data: ({
			/** An ID that identifies the broadcaster. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** The name of the subscription. */
			plan_name: string;
			/**
			 * The type of subscription. Possible values are:
			 * - `1000` — Tier 1
			 * - `2000` — Tier 2
			 * - `3000` — Tier 3
			 */
			tier: '1000' | '2000' | '3000';
			/** An ID that identifies the subscribing user. */
			user_id: string;
			/** The user’s display name. */
			user_name: string;
			/** The user’s login name. */
			user_login: string;
		} & ({
			/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
			is_gift: true;
			/** The ID of the user that gifted the subscription to the user. */
			gifter_id: string;
			/** The gifter’s login name. */
			gifter_login: string;
			/** The gifter’s display name. */
			gifter_name: string;
		} | {
			/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
			is_gift: false;
			/** The ID of the user that gifted the subscription to the user. Is an empty string if `is_gift` is `false`. */
			gifter_id: string;
			/** The gifter’s login name. Is an empty string if `is_gift` is `false`. */
			gifter_login: string;
			/** The gifter’s display name. Is an empty string if `is_gift` is `false`. */
			gifter_name: string;
		}))[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next or previous page of results. Use the cursor to set the request’s `after` or `before` query parameter depending on whether you’re paging forwards or backwards. */
			cursor?: string;
		};
		/** The current number of subscriber points earned by this broadcaster. Points are based on the subscription tier of each user that subscribes to this broadcaster. For example, a Tier 1 subscription is worth 1 point, Tier 2 is worth 2 points, and Tier 3 is worth 6 points. The number of points determines the number of emote slots that are unlocked for the broadcaster (see [Subscriber Emote Slots](https://help.twitch.tv/s/article/subscriber-emote-guide#emoteslots)). */
		points: number;
		/** The total number of users that subscribe to this broadcaster. */
		total: number;
	}
	export interface CheckUserSubscription extends ResponseBody {
		/** An object with information about the user’s subscription. */
		data: {
			/** An ID that identifies the broadcaster. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/**
			 * The type of subscription. Possible values are:
			 * - `1000` — Tier 1
			 * - `2000` — Tier 2
			 * - `3000` — Tier 3
			 */
			tier: '1000' | '2000' | '3000';
		} & ({
			/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
			is_gift: true;
			/** The ID of the user that gifted the subscription. */
			gifter_id: string;
			/** The gifter’s login name. */
			gifter_login: string;
			/** The gifter’s display name. */
			gifter_name: string;
		} | {
			/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
			is_gift: false;
		});
	}
	export interface GetChannelTeams extends ResponseBody {
		/** The list of teams that the broadcaster is a member of. Returns an empty array if the broadcaster is not a member of a team. */
		data: {
			/** An ID that identifies the broadcaster. */
			broadcaster_id: string;
			/** The broadcaster’s login name. */
			broadcaster_login: string;
			/** The broadcaster’s display name. */
			broadcaster_name: string;
			/** A URL to the team’s background image. */
			background_image_url: string;
			/** A URL to the team’s banner. */
			banner: string;
			/** The UTC date and time (in RFC3339 format) of when the team was created. */
			created_at: string;
			/** The UTC date and time (in RFC3339 format) of the last time the team was updated. */
			updated_at: string;
			/** The team’s description. The description may contain formatting such as Markdown, HTML, newline (\\n) characters, etc. */
			info: string;
			/** A URL to a thumbnail image of the team’s logo. */
			thumbnail_url: string;
			/** The team’s name. */
			team_name: string;
			/** The team’s display name. */
			team_display_name: string;
			/** An ID that identifies the team. */
			id: string;
		}[];
	}
	export interface GetTeams extends ResponseBody {
		/** A list that contains the single team that you requested. */
		data: {
			/** The list of team members. */
			users: {
				/** An ID that identifies the team member. */
				user_id: string;
				/** The team member’s login name. */
				user_login: string;
				/** The team member’s display name. */
				user_name: string;
			}[];
			/** A URL to the team’s background image. */
			background_image_url: string;
			/** A URL to the team’s banner. */
			banner: string;
			/** The UTC date and time (in RFC3339 format) of when the team was created. */
			created_at: string;
			/** The UTC date and time (in RFC3339 format) of the last time the team was updated. */
			updated_at: string;
			/** The team’s description. The description may contain formatting such as Markdown, HTML, newline (\\n) characters, etc. */
			info: string;
			/** A URL to a thumbnail image of the team’s logo. */
			thumbnail_url: string;
			/** The team’s name. */
			team_name: string;
			/** The team’s display name. */
			team_display_name: string;
			/** An ID that identifies the team. */
			id: string;
		}[];
	}
	export interface GetUsers extends ResponseBody {
		data: {
			/** An ID that identifies the user. */
			id: string;
			/** The user’s login name. */
			login: string;
			/** The user’s display name. */
			display_name: string;
			/** The type of user. Possible values are:
			 * - `admin` — Twitch administrator
			 * - `global_mod`
			 * - `staff` — Twitch staff
			 * - `""` — Normal user
			 */
			type: "admin" | "global_mod" | "staff" | "";
			/** The type of broadcaster. Possible values are:
			 * - `affiliate` — An affiliate broadcaster [affiliate broadcaster](https://help.twitch.tv/s/article/joining-the-affiliate-program%20target=)
			 * - `partner` — A partner broadcaster [partner broadcaster](https://help.twitch.tv/s/article/partner-program-overview)
			 * - `""` — A normal broadcaster
			 */
			broadcaster_type: "affiliate" | "partner" | "";
			/** The user’s description of their channel. */
			description: string;
			/** A URL to the user’s profile image. */
			profile_image_url: string;
			/** A URL to the user’s offline image. */
			offline_image_url: string;
			/** The number of times the user’s channel has been viewed. **NOTE**: This field has been deprecated (see [Get Users API endpoint – “view_count” deprecation](https://discuss.dev.twitch.tv/t/get-users-api-endpoint-view-count-deprecation/37777)). Any data in this field is not valid and should not be used. */
			view_count: number;
			/** The user’s verified email address. The object includes this field only if the user access token includes the **user:read:email** scope. If the request contains more than one user, only the user associated with the access token that provided consent will include an email address — the email address for all other users will be empty. */
			email?: string;
			/** The UTC date and time that the user’s account was created. The timestamp is in RFC3339 format. */
			created_at: string;
		}[];
	}
	export interface GetUserBlockList extends ResponseBody {
		/** The list of blocked users. The list is in descending order by when the user was blocked. */
		data: {
			/** An ID that identifies the blocked user. */
			user_id: string;
			/** The blocked user’s login name. */
			user_login: string;
			/** The blocked user’s display name. */
			display_name: string;
		}[];
	}
	export type BlockUser = ResponseBody<true, 204>;
	export type UnblockUser = ResponseBody<true, 204>;
	// GetUserExtensions
	// GetUserActiveExtensions
	// UpdateUserExtensions
	export interface GetVideos extends ResponseBody {
		/** The list of published videos that match the filter criteria. */
		data: {
			/** An ID that identifies the video. */
			id: string;
			/** The ID of the stream that the video originated from if the video\'s type is "archive;" otherwise, `null`. */
			stream_id: string | null;
			/** The ID of the broadcaster that owns the video. */
			user_id: string;
			/** The broadcaster\'s login name. */
			user_login: string;
			/** The broadcaster\'s display name. */
			user_name: string;
			/** The video\'s title. */
			title: string;
			/** The video\'s description. */
			description: string;
			/** The date and time, in UTC, of when the video was created. The timestamp is in RFC3339 format. */
			created_at: string;
			/** The date and time, in UTC, of when the video was published. The timestamp is in RFC3339 format. */
			published_at: string;
			/** The video\'s URL. */
			url: string;
			/** A URL to a thumbnail image of the video. Before using the URL, you must replace the `%{width}` and `%{height}` placeholders with the width and height of the thumbnail you want returned. Due to current limitations, `${width}` must be 320 and `${height}` must be 180. */
			thumbnail_url: string;
			/** The video\'s viewable state. */
			viewable: 'public';
			/** The number of times that users have watched the video. */
			view_count: number;
			/** The ISO 639-1 two-letter language code that the video was broadcast in. For example, the language code is DE if the video was broadcast in German. For a list of supported languages, see [Supported Stream Language](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). The language value is "other" if the video was broadcast in a language not in the list of supported languages. */
			language: string;
			/** The video\'s type. Possible values are:
			 * - `archive` — An on-demand video (VOD) of one of the broadcaster\'s past streams.
			 * - `highlight` — A highlight reel of one of the broadcaster\'s past streams. See [Creating Highlights](https://help.twitch.tv/s/article/creating-highlights-and-stream-markers).
			 * - `upload` — A video that the broadcaster uploaded to their video library. See Upload under [Video Producer](https://help.twitch.tv/s/article/video-on-demand?language=en_US#videoproducer). */
			type: 'archive' | 'highlight' | 'upload';
			/** The video\'s length in ISO 8601 duration format. For example, 3m21s represents 3 minutes, 21 seconds. */
			duration: string;
			/** The segments that Twitch Audio Recognition muted; otherwise, `null`. */
			muted_segments: {
				/** The duration of the muted segment, in seconds. */
				duration: number;
				/** The offset, in seconds, from the beginning of the video to where the muted segment begins. */
				offset: number;
			}[] | null;
		}[];
		/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		pagination?: {
			/** The cursor used to get the next page of results. Use the cursor to set the request\'s `after` or `before` query parameter depending on whether you\'re paging forwards or backwards through the results. */
			cursor?: string;
		};
	}
	export interface DeleteVideos extends ResponseBody {
		/** The list of IDs of the videos that were deleted. */
		data: string[];
	}
	export type SendWhisper = ResponseBody<true, 204>;
	export type OAuth2Validate<S extends Authorization.Scope[]> = Authorization<S> & ResponseBody;
	export type OAuth2Revoke = ResponseBody;
	export namespace OAuth2Token {
		export interface ClientCredentials extends ResponseBody {
			/** App access token gotten with client credentials grant flow */
			access_token: string;
			/** How long, in seconds, the token is valid for */
			expires_in: number;
			/** Type of token */
			token_type: "bearer";
		}
		export interface AuthorizationCode<S extends Authorization.Scope[]> extends ResponseBody {
			/** User access token gotten with authorization code grant flow */
			access_token: string;
			/** How long, in seconds, the access token is valid for */
			expires_in: number;
			/** Token to use in `Request.OAuth2Token.RefreshToken` when access token expires */
			refresh_token: string;
			/** Authorization scopes which contains this access token */
			scope: S;
			/** Type of token */
			token_type: "bearer";
		}
		export interface RefreshToken<S extends Authorization.Scope[]> extends ResponseBody {
			/** User access token gotten with authorization code grant flow */
			access_token: string;
			/** How long, in seconds, the access token is valid for */
			expires_in: number;
			/** Token to use in `Request.OAuth2Token.RefreshToken` when access token expires */
			refresh_token: string;
			/** Authorization scopes which contains this access token */
			scope: S;
			/** Type of token */
			token_type: "bearer";
		}
	}
}

export interface ResponseBodyError extends ResponseBody<false, 400 | 401 | 404 | 409 | 410 | 422 | 425 | 429> {
	/** The error message of request. */
	message: string;
}
export namespace ResponseBodyError {
	export interface OAuth2Validate<Token extends string = string> extends ResponseBodyError {
		/** The access token you specified in first argument of `Request.OAuth2Validate` */
		token: Token;
	}
}

function getError<ResponseBodyError_ = ResponseBodyError>(error: unknown) {
	var message: string = `Unknown error`;
	var ok = false;
	var status = 400;

	if (error instanceof Error) message = `${error.message}`;
	else if (typeof error === 'string') message = `${error}`;
	else return { ok, status, message } as ResponseBodyError_;

	if (message.startsWith(`#`)) {
		const index = message.indexOf(' ');
		status = parseInt(message.substring(2, index));
		message = message.substring(index + 1);
	}

	return { ok, status, message } as ResponseBodyError_;
}
/** @param data0_to_data `response.data = response.data[0];` */
async function getResponse<ResponseBody_ = ResponseBody>(request: Response, data0_to_data?: boolean) {
	const response: any = await request.json();
	response.ok = request.ok;
	response.status = request.status;
	if (data0_to_data && request.ok) response.data = response.data[0];
	return response as ResponseBody_;
}

export namespace Request {
	/**
	 * Starts a commercial on the specified channel. [Read More](https://dev.twitch.tv/docs/api/reference/#start-commercial)
	 * 
	 * **NOTE**: Only partners and affiliates may run commercials and they must be streaming live at the time.
	 * 
	 * **NOTE**: Only the broadcaster may start a commercial; the broadcaster’s editors and moderators may not start commercials on behalf of the broadcaster.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:edit:commercial** scope.
	 * @param length The length of the commercial to run, in seconds. Twitch tries to serve a commercial that’s the requested length, but it may be shorter or longer. The maximum length you should request is 180 seconds.
	 */
	export async function StartCommercial<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:edit:commercial">>, length: number): Promise<ResponseBody.StartCommercial | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/commercial", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ broadcaster_id: authorization.user_id, length }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * This endpoint returns ad schedule related information, including snooze, when the last ad was run, when the next ad is scheduled, and if the channel is currently in pre-roll free time. Note that a new ad cannot be run until 8 minutes after running a previous ad. [Read More](https://dev.twitch.tv/docs/api/reference/#get-ad-schedule)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:ads** scope.
	 */
	export async function GetAdSchedule<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:ads">>): Promise<ResponseBody.GetAdSchedule | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/ads", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request, true);
		} catch (e) { return getError(e) }
	}
	/**
	 * If available, pushes back the timestamp of the upcoming automatic mid-roll ad by 5 minutes. This endpoint duplicates the snooze functionality in the creator dashboard’s Ads Manager. [Read More](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:ads** scope.
	 */
	export async function SnoozeNextAd<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:ads">>): Promise<ResponseBody.SnoozeNextAd | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/ads/schedule/snooze", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request);
		} catch (e) { return getError(e) }
	}
	/**
	 * Gets an [analytics report](https://dev.twitch.tv/docs/insights) for one or more extensions. The response contains the URLs used to download the reports (CSV files). [Learn More](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **analytics:read:extensions** scope.
	 * @param extension_id The extension's client ID. If specified, the response contains a report for the specified extension. If not specified, the response includes a report for each extension that the authenticated user owns.
	 * @param started_at The reporting window's start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). The start date must be on or after January 31, 2018. If you specify an earlier date, the API ignores it and uses January 31, 2018. If you specify a start date, you must specify an end date. If you don't specify a start and end date, the report includes all available data since January 31, 2018. The report contains one row of data for each day in the reporting window.
	 * @param ended_at The reporting window's end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-27T00:00:00Z). The report is inclusive of the end date. Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that's earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
	 * @param first The maximum number of report URLs to return per page in the response. The minimum page size is 1 URL per page and the maximum is 100 URLs per page. The default is 20. **NOTE**: While you may specify a maximum value of 100, the response will contain at most 20 URLs per page.
	 * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value. This parameter is ignored if the `extension_id` parameter is set.
	 */
	export async function GetExtensionAnalytics<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "analytics:read:extensions">>, extension_id?: string, started_at?: string, ended_at?: string, first?: number, after?: string): Promise<ResponseBody.GetExtensionAnalytics | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/analytics/extensions", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ extension_id, type: "overview_v2", started_at, ended_at, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets an [analytics report](https://dev.twitch.tv/docs/insights) for one or more games. The response contains the URLs used to download the reports (CSV files). [Learn More](https://dev.twitch.tv/docs/api/reference/#get-game-analytics)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **analytics:read:games** scope.
	 * @param game_id The game’s client ID. If specified, the response contains a report for the specified game. If not specified, the response includes a report for each of the authenticated user’s games.
	 * @param started_at The reporting window’s start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). If you specify a start date, you must specify an end date. The start date must be within one year of today’s date. If you specify an earlier date, the API ignores it and uses a date that’s one year prior to today’s date. If you don’t specify a start and end date, the report includes all available data for the last 365 days from today. The report contains one row of data for each day in the reporting window.
	 * @param ended_at The reporting window’s end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). The report is inclusive of the end date. Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that’s earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
	 * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value. This parameter is ignored if `game_id` parameter is set.
	 */
	export async function GetGameAnalytics<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "analytics:read:games">>, game_id?: string, started_at?: string, ended_at?: string, first?: number, after?: number): Promise<ResponseBody.GetGameAnalytics | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/analytics/games", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ game_id, type: "overview_v2", started_at, ended_at, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the Bits leaderboard for the authenticated broadcaster. [Read More](https://dev.twitch.tv/docs/api/reference/#get-bits-leaderboard)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **bits:read** scope.
	 * @param count The number of results to return. The minimum count is 1 and the maximum is 100. The default is 10.
	 * @param period
	 * The time period over which data is aggregated (uses the PST time zone). Possible values are:
	 * - `day` — A day spans from 00:00:00 on the day specified in started_at and runs through 00:00:00 of the next day.
	 * - `week` — A week spans from 00:00:00 on the Monday of the week specified in started_at and runs through 00:00:00 of the next Monday.
	 * - `month` — A month spans from 00:00:00 on the first day of the month specified in started_at and runs through 00:00:00 of the first day of the next month.
	 * - `year` — A year spans from 00:00:00 on the first day of the year specified in started_at and runs through 00:00:00 of the first day of the next year.
	 * - `all` — Default. The lifetime of the broadcaster's channel.
	 * @param started_at The start date, in RFC3339 format, used for determining the aggregation period. Specify this parameter only if you specify the `period` query parameter. The start date is ignored if `period` is `all`. Note that the date is converted to PST before being used, so if you set the start time to `2022-01-01T00:00:00.0Z` and period to month, the actual reporting period is December 2021, not January 2022. If you want the reporting period to be January 2022, you must set the start time to `2022-01-01T08:00:00.0Z` or `2022-01-01T00:00:00.0-08:00`.
	 * @param user_id An ID that identifies a user that cheered bits in the channel. If `count` is greater than 1, the response may include users ranked above and below the specified user. To get the leaderboard’s top leaders, don’t specify a user ID.
	 */
	export async function GetBitsLeaderboard<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "bits:read">>, count?: number, period?: "day" | "week" | "month" | "year" | "all", started_at?: string, user_id?: string): Promise<ResponseBody.GetBitsLeaderboard | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/bits/leaderboard", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ count, period, started_at, user_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of Cheermotes that users can use to cheer Bits in any Bits-enabled channel’s chat room. Cheermotes are animated emotes that viewers can assign Bits to. [Read More](https://dev.twitch.tv/docs/api/reference/#get-cheermotes)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).
	 * @param broadcaster_id The ID of the broadcaster whose custom Cheermotes you want to get. Specify the broadcaster’s ID if you want to include the broadcaster’s Cheermotes in the response (not all broadcasters upload Cheermotes). If not specified, the response contains only global Cheermotes. If the broadcaster uploaded Cheermotes, the `type` field in the response is set to `channel_custom`.
	 */
	export async function GetCheermotes(authorization: Authorization, broadcaster_id?: string): Promise<ResponseBody.GetBitsLeaderboard | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/bits/cheermotes", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets an extension’s list of transactions. A transaction records the exchange of a currency (for example, Bits) for a digital product. [Read More](https://dev.twitch.tv/docs/api/reference/#get-extension-transactions)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).
	 * @param extension_id The ID of the extension whose list of transactions you want to get.
	 * @param id A transaction ID used to filter the list of transactions. You may specify a maximum of 100 IDs.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value.
	 */
	export async function GetExtensionTransactions<S extends Authorization.Scope[]>(authorization: Authorization.App, extension_id: string, id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetExtensionTransactions<typeof extension_id> | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/extensions/transactions", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ extension_id, id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about one or more channels. [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-information)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).
	 * @param broadcaster_id The ID of the broadcaster whose channel you want to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that are not found.
	 */
	export async function GetChannelInformation(authorization: Authorization, broadcaster_id: string | string[]): Promise<ResponseBody.GetChannelInformation | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates a channel’s properties of token owner. [Read More](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:broadcast** scope.
	 * @param body All fields are optional, but you must specify at least one field
	 */
	export async function ModifyChannelInformation<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:broadcast">>, body: RequestBody.ModifyChannelInformation): Promise<ResponseBody.ModifyChannelInformation | ResponseBodyError> {
		try {
			if (Object.keys(body).length === 0) throw `You must specify at least one field in request body!`;
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id: authorization.user_id }).setBody(body).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s list editors. [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-editors)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:editors** scope.
	 */
	export async function GetChannelEditors<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:editors">>): Promise<ResponseBody.GetChannelEditors | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/editors", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of broadcasters that the specified user follows. You can also use this endpoint to see whether a user follows a specific broadcaster. [Read More](https://dev.twitch.tv/docs/api/reference/#get-followed-channels)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:follows** scope.
	 * @param broadcaster_id A broadcaster’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this broadcaster if the user follows them. If not specified, the response contains all broadcasters that the user follows.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value.
	 */
	export async function GetFollowedChannels<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:follows">>, broadcaster_id?: string, first?: number, after?: string): Promise<ResponseBody.GetFollowedChannels | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/followed", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ user_id: authorization.user_id, broadcaster_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of users that follow the specified broadcaster. You can also use this endpoint to see whether a specific user follows the broadcaster.
	 * @param authorization
	 * - [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:followers** scope.
	 * - The ID in the broadcaster_id query parameter must match the user ID in the access token or the user ID in the access token must be a moderator for the specified broadcaster.
	 * 
	 * This endpoint will return specific follower information only if both of the above are true. If a scope is not provided or the user isn’t the broadcaster or a moderator for the specified channel, only the total follower count will be included in the response.
	 * @param broadcaster_id The broadcaster’s ID. Returns the list of users that follow this broadcaster.
	 * @param user_id A user’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this user if they follow the broadcaster. If not specified, the response contains all users that follow the broadcaster. Using this parameter requires both a user access token with the `moderator:read:followers` scope and the user ID in the access token match the broadcaster_id or be the user ID for a moderator of the specified broadcaster.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value.
	 */
	export async function GetChannelFollowers(authorization: Authorization.User, broadcaster_id: string, user_id?: string, first?: number, after?: string): Promise<ResponseBody.GetChannelFollowers | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/followers", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Creates a Custom Reward in the broadcaster’s channel. The maximum number of custom rewards per channel is 50, which includes both enabled and disabled rewards. [Read More](https://dev.twitch.tv/docs/api/reference/#create-custom-rewards)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
	 */
	export async function CreateCustomReward<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, body: RequestBody.CreateCustomReward): Promise<ResponseBody.CreateCustomReward | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).setBody(body).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Deletes a custom reward that the broadcaster created. [Read More](https://dev.twitch.tv/docs/api/reference/#delete-custom-reward)
	 *
	 * The app used to create the reward is the only app that may delete it. If the reward’s redemption status is UNFULFILLED at the time the reward is deleted, its redemption status is marked as FULFILLED.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
	 * @param id The ID of the custom reward to delete.
	 */
	export async function DeleteCustomReward<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, id: string): Promise<ResponseBody.DeleteCustomReward | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of custom rewards that the broadcaster created. [Read More](https://dev.twitch.tv/docs/api/reference/#get-custom-reward)
	 *
	 * **NOTE**: A channel may offer a maximum of 50 rewards, which includes both enabled and disabled rewards.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:redemptions** or **channel:manage:redemptions** scope.
	 * @param id A list of IDs to filter the rewards by. You may specify a maximum of 50 IDs. Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
	 * @param only_manageable_rewards A Boolean value that determines whether the response contains only the custom rewards that the app may manage (the app is identified by the ID in the Client-Id header). Set to `true` to get only the custom rewards that the app may manage. The default is `false`.
	 */
	export async function GetCustomRewards<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:redemptions" | "channel:manage:redemptions">>, id?: string | string[], only_manageable_rewards?: boolean): Promise<ResponseBody.GetCustomRewards | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, id, only_manageable_rewards }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of redemptions for the specified custom reward. The app used to create the reward is the only app that may get the redemptions. [Read More](https://dev.twitch.tv/docs/api/reference/#get-custom-reward-redemption)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:redemptions** and **channel:manage:redemptions** scopes.
	 * @param reward_id The ID that identifies the custom reward whose redemptions you want to get.
	 * @param status The status of the redemptions to return. This field is required only if you don’t specify the `id`. Canceled and fulfilled redemptions are returned for only a few days after they’re canceled or fulfilled.
	 * @param id A list of IDs to filter the redemptions by. You may specify a maximum of 50 IDs. Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
	 * @param sort The order to sort redemptions by. The possible case-sensitive values are:The default is OLDEST.)
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value.
	 * @param first The maximum number of redemptions to return per page in the response. The minimum page size is 1 redemption per page and the maximum is 50. The default is 20.
	 */
	export async function GetCustomRewardRedemptions<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:redemptions" | "channel:manage:redemptions">>, reward_id: string, status?: string, id?: string | string[], sort?: string, after?: string, first?: number): Promise<ResponseBody.GetCustomRewardRedemptions | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, reward_id, status, id, sort, after, first }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates a custom reward. The app used to create the reward is the only app that may update the reward. [Read More](https://dev.twitch.tv/docs/api/reference/#update-custom-reward)
	 *
	 * The body of the request should contain only the fields you’re updating.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/api/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
	 * @param id The ID of the reward to update.
	 */
	export async function UpdateCustomReward<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, id: string, body: RequestBody.UpdateCustomReward): Promise<ResponseBody.UpdateCustomReward | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, id }).setBody(body).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates a redemption’s status. You may update a redemption only if its status is UNFULFILLED. The app used to create the reward is the only app that may update the redemption. [Read More](https://dev.twitch.tv/docs/api/reference/#update-redemption-status)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
	 * @param id A list of IDs that identify the redemptions to update. You may specify a maximum of 50 IDs.
	 * @param reward_id The ID that identifies the reward that’s been redeemed.
	 * @param status The status to set the redemption to. Setting the status to `CANCELED` refunds the user’s channel points.
	 */
	export async function UpdateCustomRewardRedemptionStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, id: string | string[], reward_id: string, status: "CANCELED" | "FULFILLED"): Promise<ResponseBody.UpdateCustomRewardRedemptionStatus | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ id, broadcaster_id: authorization.user_id, reward_id }).setBody({ status }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about the charity campaign that a broadcaster is running. For example, the campaign’s fundraising goal and the current amount of donations. [Read More](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign)
	 *
	 * To receive events when progress is made towards the campaign’s goal or the broadcaster changes the fundraising goal, subscribe to the [channel.charity_campaign.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelcharity_campaignprogress) subscription type.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:charity** scope.
	 */
	export async function GetCharityCampaigns<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:charity">>): Promise<ResponseBody.GetCharityCampaigns | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/charity/campaigns", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the list of donations that users have made to the broadcaster’s active charity campaign. [Read More](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations)
	 *
	 * To receive events as donations occur, subscribe to the [channel.charity_campaign.donate](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelcharity_campaigndonate) subscription type.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:charity** scope.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 * @param after The cursor used to get the next page of results. The `Pagination` object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetCharityCampaignDonations<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:charity">>, first?: number, after?: string): Promise<ResponseBody.GetCharityCampaignDonations | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/charity/donations", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the list of users that are connected to the broadcaster’s chat session. [Read More](https://dev.twitch.tv/docs/api/reference/#get-chatters)
	 *
	 * **NOTE**: There is a delay between when users join and leave a chat and when the list is updated accordingly.
	 *
	 * To determine whether a user is a moderator or VIP, use the [Get Moderators](https://dev.twitch.tv/docs/api/reference#get-moderators) and [Get VIPs](https://dev.twitch.tv/docs/api/reference#get-vips) endpoints. You can check the roles of up to 100 users.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:chatters** scope.
	 * @param broadcaster_id The ID of the broadcaster whose list of chatters you want to get.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 1,000. The default is 100.
	 * @param after The cursor used to get the next page of results. The `Pagination` object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetChatters<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:chatters">>, broadcaster_id: string, first?: number, after?: string): Promise<ResponseBody.GetChatters | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/chatters", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s list of custom emotes. Broadcasters create these custom emotes for users who subscribe to or follow the channel or cheer Bits in the channel’s chat window. [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-emotes)
	 *
	 * For information about the custom emotes, see [subscriber emotes](https://help.twitch.tv/s/article/subscriber-emote-guide), [Bits tier emotes](https://help.twitch.tv/s/article/custom-bit-badges-guide?language=bg#slots), and [follower emotes](https://blog.twitch.tv/en/2021/06/04/kicking-off-10-years-with-our-biggest-emote-update-ever/).
	 *
	 * **NOTE**: With the exception of custom follower emotes, users may use custom emotes in any Twitch chat.
	 *
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id An ID that identifies the broadcaster whose emotes you want to get.
	 */
	export async function GetChannelEmotes(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChannelEmotes | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the list of [global emotes](https://www.twitch.tv/creatorcamp/en/learn-the-basics/emotes/). Global emotes are [Twitch-created emotes](https://dev.twitch.tv/docs/irc/emotes) that users can use in any Twitch chat. [Read More](https://dev.twitch.tv/docs/api/reference/#get-global-emotes)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id An ID that identifies the broadcaster whose emotes you want to get.
	 */
	export async function GetGlobalEmotes(authorization: Authorization): Promise<ResponseBody.GetGlobalEmotes | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes/global", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets emotes for one or more specified emote sets. [Read More](https://dev.twitch.tv/docs/api/reference/#get-emote-sets)
	 * 
	 * An emote set groups emotes that have a similar context. For example, Twitch places all the subscriber emotes that a broadcaster uploads for their channel in the same emote set.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param emote_set_id An ID that identifies the emote set to get. You may specify a maximum of 25 IDs. The response contains only the IDs that were found and ignores duplicate IDs. To get emote set IDs, use the `GetChannelEmotes`.
	 */
	export async function GetEmoteSets(authorization: Authorization, emote_set_id: string | string[]): Promise<ResponseBody.GetEmoteSets | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes/set", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ emote_set_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s list of custom chat badges. The list is empty if the broadcaster hasn’t created custom chat badges. For information about custom badges, see [subscriber badges](https://help.twitch.tv/s/article/subscriber-badge-guide) and [Bits badges](https://help.twitch.tv/s/article/custom-bit-badges-guide). [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id The ID of the broadcaster whose chat badges you want to get.
	 */
	export async function GetChannelChatBadges(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChannelChatBadges | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/badge", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets Twitch’s list of chat badges, which users may use in any channel’s chat room. For information about chat badges, see [Twitch Chat Badges Guide](https://help.twitch.tv/s/article/twitch-chat-badges-guide). [Read More](https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id The ID of the broadcaster whose chat badges you want to get.
	 */
	export async function GetGlobalChatBadges(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetGlobalChatBadges | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/badges/global", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s chat settings. [Read More](https://dev.twitch.tv/docs/api/reference/#get-chat-settings)
	 * 
	 * For an overview of chat settings, see [Chat Commands for Broadcasters and Moderators](https://help.twitch.tv/s/article/chat-commands#AllMods) and [Moderator Preferences](https://help.twitch.tv/s/article/setting-up-moderation-for-your-twitch-channel#modpreferences).
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id The ID of the broadcaster whose chat settings you want to get.
	 */
	export async function GetChatSettings(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChatSettings | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/settings", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.type === "user" ? authorization.user_id : undefined }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Retrieves the active shared chat session for a channel. [Read More](https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id The User ID of the channel broadcaster.
	 */
	export async function GetSharedChatSession(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetSharedChatSession | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/shared_chat/session", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Retrieves emotes available to the user across all channels.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:emotes** scope.
	 * @param broadcaster_id The User ID of a broadcaster you wish to get follower emotes of. Using this query parameter will guarantee inclusion of the broadcaster’s follower emotes in the response body. **NOTE**: If the owner of token is subscribed to the broadcaster specified, their follower emotes will appear in the response body regardless if this query parameter is used.
	 * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
	 */
	export async function GetUserEmotes<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:emotes">>, broadcaster_id?: string, after?: string) {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes/user", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ user_id: authorization.user_id, broadcaster_id, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates the broadcaster’s chat settings.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_settings** scope.
	 * @param broadcaster_id The ID of the broadcaster whose chat settings you want to update.
	 * @param body All fields are optional. Specify only those fields that you want to update.
	 */
	export async function UpdateChatSettings<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:chat_settings">>, broadcaster_id: string, body: RequestBody.UpdateChatSettings): Promise<ResponseBody.UpdateChatSettings | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/settings", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody(body).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Sends an announcement to the broadcaster’s chat room.
	 * 
	 * **Rate Limits**: One announcement may be sent every 2 seconds.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:announcements** scope.
	 * @param broadcaster_id The ID of the broadcaster that owns the chat room to send the announcement to.
	 */
	export async function SendChatAnnouncement<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:announcements">>, broadcaster_id: string): Promise<ResponseBody.SendChatAnnouncement | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/announcements", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Sends a Shoutout to the specified broadcaster. Typically, you send Shoutouts when you or one of your moderators notice another broadcaster in your chat, the other broadcaster is coming up in conversation, or after they raid your broadcast.
	 * 
	 * Twitch’s Shoutout feature is a great way for you to show support for other broadcasters and help them grow. Viewers who do not follow the other broadcaster will see a pop-up Follow button in your chat that they can click to follow the other broadcaster. [Learn More](https://help.twitch.tv/s/article/shoutouts)
	 * 
	 * **Rate Limits**: The broadcaster may send a Shoutout once every 2 minutes. They may send the same broadcaster a Shoutout once every 60 minutes.
	 * 
	 * To receive notifications when a Shoutout is sent or received, subscribe to the [channel.shoutout.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshoutoutcreate) and [channel.shoutout.receive](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshoutoutreceive) subscription types. The `channel.shoutout.create` event includes cooldown periods that indicate when the broadcaster may send another Shoutout without exceeding the endpoint’s rate limit.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:shoutouts** scope.
	 * @param from_broadcaster_id The ID of the broadcaster that’s sending the Shoutout.
	 * @param to_broadcaster_id The ID of the broadcaster that’s receiving the Shoutout.
	 */
	export async function SendShoutout<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:shoutouts">>, from_broadcaster_id: string, to_broadcaster_id: string): Promise<ResponseBody.SendShoutout | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/shoutouts", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ from_broadcaster_id, to_broadcaster_id, moderator_id: authorization.user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Sends a message as token owner to the broadcaster’s chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#send-chat-message)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:write:chat** scope
	 * @param broadcaster_id The ID of the broadcaster whose chat room the message will be sent to
	 * @param message The message to send. The message is limited to a maximum of 500 characters. Chat messages can also include emoticons. To include emoticons, use the name of the emote. The names are case sensitive. Don’t include colons around the name (e.g., :bleedPurple:). If Twitch recognizes the name, Twitch converts the name to the emote before writing the chat message to the chat room
	 * @param reply_parent_message_id The ID of the chat message being replied to
	 */
	export async function SendChatMessage<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:write:chat">>, broadcaster_id: string, message: string, reply_parent_message_id?: string): Promise<ResponseBody.SendChatMessage | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/messages", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, sender_id: authorization.user_id, message, reply_parent_message_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the color used for the user’s name in chat.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param user_id The ID of the user whose username color you want to get. To specify more than one user, include the `user_id` parameter for each user to get. For example, `&user_id=1234&user_id=5678`. The maximum number of IDs that you may specify is 100. The API ignores duplicate IDs and IDs that weren’t found.
	 */
	export async function GetUserChatColor(authorization: Authorization, user_id: string): Promise<ResponseBody.GetUserChatColor | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/color", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ user_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates the color used for the user’s name in chat.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:chat_color** scope.
	 * @param color
	 * The color to use for the user's name in chat. All users may specify one of the following named color values:
	 * - `blue`
	 * - `blue_violet`
	 * - `cadet_blue`
	 * - `chocolate`
	 * - `coral`
	 * - `dodger_blue`
	 * - `firebrick`
	 * - `golden_rod`
	 * - `green`
	 * - `hot_pink`
	 * - `orange_red`
	 * - `red`
	 * - `sea_green`
	 * - `spring_green`
	 * - `yellow_green`
	 * 
	 * Turbo and Prime users may specify a named color or a Hex color code like #9146FF. If you use a Hex color code, remember to URL encode it.
	 */
	export async function UpdateUserChatColor<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:chat_color">>, color: string): Promise<ResponseBody.UpdateUserChatColor | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/color", "PUT").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ color }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Creates a clip from the broadcaster’s stream.
	 * 
	 * This API captures up to 90 seconds of the broadcaster’s stream. The 90 seconds spans the point in the stream from when you called the API. For example, if you call the API at the 4:00 minute mark, the API captures from approximately the 3:35 mark to approximately the 4:05 minute mark. Twitch tries its best to capture 90 seconds of the stream, but the actual length may be less. This may occur if you begin capturing the clip near the beginning or end of the stream.
	 * 
	 * By default, Twitch publishes up to the last 30 seconds of the 90 seconds window and provides a default title for the clip. To specify the title and the portion of the 90 seconds window that’s used for the clip, use the URL in the response’s `edit_url` field. You can specify a clip that’s from 5 seconds to 60 seconds in length. The URL is valid for up to 24 hours or until the clip is published, whichever comes first.
	 *
	 * Creating a clip is an asynchronous process that can take a short amount of time to complete. To determine whether the clip was successfully created, call Get Clips using the clip ID that this request returned. If [Get Clips](https://dev.twitch.tv/docs/api/reference/#get-clips) returns the clip, the clip was successfully created. If after 15 seconds Get Clips hasn’t returned the clip, assume it failed.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **clips:edit** scope.
	 * @param broadcaster_id The ID of the broadcaster whose stream you want to create a clip from.
	 * @param has_delay A Boolean value that determines whether the API captures the clip at the moment the viewer requests it or after a delay. If `false` (default), Twitch captures the clip at the moment the viewer requests it (this is the same clip experience as the Twitch UX). If `true`, Twitch adds a delay before capturing the clip (this basically shifts the capture window to the right slightly).
	 */
	export async function CreateClip<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "clips:edit">>, broadcaster_id: string, has_delay?: boolean): Promise<ResponseBody.CreateClip | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/clips", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, has_delay }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets one or more video clips that were captured from streams. For information about clips, see [How to use clips](https://help.twitch.tv/s/article/how-to-use-clips).
	 * 
	 * When using pagination for clips, note that the maximum number of results returned over multiple requests will be approximately 1,000. If additional results are necessary, paginate over different query parameters such as multiple `started_at` and `ended_at` timeframes to refine the search.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param query
	 * **broadcaster_id** — An ID that identifies the broadcaster whose video clips you want to get. Use this parameter to get clips that were captured from the broadcaster’s streams.
	 * 
	 * **game_id** — An ID that identifies the game whose clips you want to get. Use this parameter to get clips that were captured from streams that were playing this game.
	 * 
	 * **id** — An ID that identifies the clip to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that aren’t found.
	 * @param started_at The start date used to filter clips. The API returns only clips within the start and end date window. Specify the date and time in RFC3339 format.
	 * @param ended_at 	The end date used to filter clips. If not specified, the time window is the start date plus one week. Specify the date and time in RFC3339 format.
	 * @param first The maximum number of clips to return per page in the response. The minimum page size is 1 clip per page and the maximum is 100. The default is 20.
	 * @param before The cursor used to get the previous page of results. The `Pagination` object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 * @param after The cursor used to get the next page of results. The `Pagination` object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 * @param is_featured A Boolean value that determines whether the response includes featured clips. If `true`, returns only clips that are featured. If `false`, returns only clips that aren’t featured. All clips are returned if this parameter is not present.
	 */
	export async function GetClips(authorization: Authorization, query: {broadcaster_id: string} | {game_id: string} | {id: string | string[]}, started_at?: string, ended_at?: string, first?: number, before?: string, after?: string, is_featured?: boolean): Promise<ResponseBody.GetClips | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/clips", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch(query).setSearch({ started_at, ended_at, first, before, after, is_featured }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the [conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) for a client ID.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
	 */
	export async function GetConduits(authorization: Authorization.App): Promise<ResponseBody.GetConduits | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Creates a new [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
	 * @param shard_count The number of shards to create for this conduit.
	 */
	export async function CreateConduit(authorization: Authorization.App, shard_count: number): Promise<ResponseBody.CreateConduit | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ shard_count }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates a [conduit’s](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) shard count. To delete shards, update the count to a lower number, and the shards above the count will be deleted. For example, if the existing shard count is 100, by resetting shard count to 50, shards 50-99 are disabled.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
	 * @param id Conduit ID.
	 * @param shard_count The new number of shards for this conduit.
	 */
	export async function UpdateConduit(authorization: Authorization.App, id: string, shard_count: string): Promise<ResponseBody.UpdateConduit | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ id, shard_count }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Deletes a specified [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/). Note that it may take some time for Eventsub subscriptions on a deleted conduit to show as disabled when calling `GetEventSubSubscriptions`.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
	 * @param id Conduit ID.
	 */
	export async function DeleteConduit(authorization: Authorization.App, id: string): Promise<ResponseBody.DeleteConduit | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a lists of all shards for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
	 * @param conduit_id Conduit ID.
	 * @param status Status to filter by.
	 * @param after The cursor used to get the next page of results. The pagination object in the response contains the cursor’s value.
	 */
	export async function GetConduitShards(authorization: Authorization.App, conduit_id: string, status?: string, after?: string): Promise<ResponseBody.GetConduitShards | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits/shards", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ conduit_id, status, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates shard(s) for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).
	 * 
	 * **NOTE**: Shard IDs are indexed starting at 0, so a conduit with a `shard_count` of 5 will have shards with IDs 0 through 4.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
	 * @param conduit_id Conduit ID.
	 * @param shards List of shards to update.
	 */
	export async function UpdateConduitShards(authorization: Authorization.App, conduit_id: string, shards: {
		/** Shard ID. */
		id: string;
		/** The transport details that you want Twitch to use when sending you notifications. */
		transport: EventSub.Transport.WebHook | EventSub.Transport.WebSocket;
	}[]
	): Promise<ResponseBody.UpdateConduitShards | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits/shards", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ conduit_id, shards }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about Twitch content classification labels.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param locale Locale for the Content Classification Labels. You may specify a maximum of 1 locale.
	 */
	export async function GetContentClassificationLabels(authorization: Authorization, locale: "en-US" | "bg-BG" | "cs-CZ" | "da-DK" | "de-DE" | "el-GR" | "en-GB" | "es-ES" | "es-MX" | "fi-FI" | "fr-FR" | "hu-HU" | "it-IT" | "ja-JP" | "ko-KR" | "nl-NL" | "no-NO" | "pl-PL" | "pt-BT" | "pt-PT" | "ro-RO" | "ru-RU" | "sk-SK" | "sv-SE" | "th-TH" | "tr-TR" | "vi-VN" | "zh-CN" | "zh-TW"): Promise<ResponseBody.GetContentClassificationLabels | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/content_classification_labels", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ locale }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Creates an EventSub subscription. If you using `EventSub.startWebSocket` method, you must use this function in `onSessionWelcome` callback. [Read More](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
	 * @param authorization
	 * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token. If the subscription type requires user authorization, the user must have granted your app (client ID) permissions to receive those events before you subscribe to them. For example, to subscribe to [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe) events, your app must get a user access token that includes the `channel:read:subscriptions` scope, which adds the required permission to your app access token’s client ID
	 * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. If the subscription type requires user authorization, the token must include the required scope. However, if the subscription type doesn’t include user authorization, the token may include any scopes or no scopes
	 * 3. If you use [Conduits to receive events](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/), the request must specify an app access token. The request will fail if you use a user access token
	 * @param subscription `EventSub.Subscription` type to subscribe
	 */
	export async function CreateEventSubSubscription<Subscription_ extends EventSub.Subscription>(authorization: Authorization, subscription: Subscription_): Promise<ResponseBody.CreateEventSubSubscription<Subscription_> | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/subscriptions", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody(subscription).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Deletes an EventSub subscription. [Read More(https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)
	 * @param authorization
	 * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token
	 * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes
	 * @param id The ID of the subscription to delete
	 */
	export async function DeleteEventSubSubscription(authorization: Authorization, id: string): Promise<ResponseBody.DeleteEventSubSubscription | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/subscriptions", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of EventSub subscriptions that the client in the access token created.
	 * @param authorization 
	 * 1. If you use [Webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events) or [Conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) to receive events, the request must specify an app access token. The request will fail if you use a user access token.
	 * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes.
	 * @param status Filter subscriptions by its status. Possible values are:
	 * - `enabled` — The subscription is enabled.
	 * - `webhook_callback_verification_pending` — The subscription is pending verification of the specified callback URL.
	 * - `webhook_callback_verification_failed` — The specified callback URL failed verification.
	 * - `notification_failures_exceeded` — The notification delivery failure rate was too high.
	 * - `authorization_revoked` — The authorization was revoked for one or more users specified in the Condition object.
	 * - `moderator_removed` — The moderator that authorized the subscription is no longer one of the broadcaster's moderators.
	 * - `user_removed` — One of the users specified in the Condition object was removed.
	 * - `chat_user_banned` - The user specified in the Condition object was banned from the broadcaster's chat.
	 * - `version_removed` — The subscription to subscription type and version is no longer supported.
	 * - `beta_maintenance` — The subscription to the beta subscription type was removed due to maintenance.
	 * - `websocket_disconnected` — The client closed the connection.
	 * - `websocket_failed_ping_pong` — The client failed to respond to a ping message.
	 * - `websocket_received_inbound_traffic` — The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
	 * - `websocket_connection_unused` — The client failed to subscribe to events within the required time.
	 * - `websocket_internal_error` — The Twitch WebSocket server experienced an unexpected error.
	 * - `websocket_network_timeout` — The Twitch WebSocket server timed out writing the message to the client.
	 * - `websocket_network_error` — The Twitch WebSocket server experienced a network error writing the message to the client.
	 * - `websocket_failed_to_reconnect` - The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
	 * @param type Filter subscriptions by subscription type.
	 * @param user_id Filter subscriptions by user ID. The response contains subscriptions where this ID matches a user ID that you specified in the **Condition** object when you [created the subscription](https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription).
	 * @param subscription_id Returns an array with the subscription matching the ID (as long as it is owned by the client making the request), or an empty array if there is no matching subscription.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor's value.
	 */
	export async function GetEventSubSubscriptions(authorization: Authorization, status?: EventSub.SubscriptionType, type?: ReturnType<typeof EventSub.Subscription[keyof typeof EventSub.Subscription]>["type"], user_id?: string, subscription_id?: string, after?: string): Promise<ResponseBody.GetEventSubSubscriptions | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/subscriptions", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ status, type, user_id, subscription_id, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about all broadcasts on Twitch.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide/#pagination)
	 * @param before The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide/#pagination)
	 */
	export async function GetTopGames(authorization: Authorization, first?: number, after?: string, before?: string): Promise<ResponseBody.GetTopGames | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/games/top", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ first, after, before }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about specified categories or games.
	 * 
	 * You may get up to 100 categories or games by specifying their ID or name. You may specify all IDs, all names, or a combination of IDs and names. If you specify a combination of IDs and names, the total number of IDs and names must not exceed 100.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param name The name of the category or game to get. The name must exactly match the category’s or game’s title. You may specify a maximum of 100 names. The endpoint ignores duplicate names and names that weren’t found.
	 * @param id The ID of the category or game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found.
	 * @param igdb_id The [IGDB](https://www.igdb.com/) ID of the game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found.
	 */
	export async function GetGames(authorization: Authorization, name?: string | string[], id?: string | string[], igdb_id?: string | string[]): Promise<ResponseBody.GetGames | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/games", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ name, id, igdb_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s list of active goals. Use this endpoint to get the current progress of each goal.
	 * 
	 * Instead of polling for the progress of a goal, consider [subscribing](https://dev.twitch.tv/docs/eventsub/manage-subscriptions) to receive notifications when a goal makes progress using the [channel.goal.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelgoalprogress) subscription type. [Read More](https://dev.twitch.tv/docs/api/goals#requesting-event-notifications)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:goals** scope.
	 */
	export async function GetCreatorGoals<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:goals">>): Promise<ResponseBody.GetCreatorGoals | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/goals", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about the broadcaster’s current or most recent Hype Train event.
	 * 
	 * Instead of polling for events, consider [subscribing](https://dev.twitch.tv/docs/eventsub/manage-subscriptions) to Hype Train events ([Begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelhype_trainbegin), [Progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelhype_trainprogress), [End](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelhype_trainend)).
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:hype_train** scope.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 1.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetHypeTrainEvents<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:hype_train">>, first?: number, after?: string): Promise<ResponseBody.GetHypeTrainEvents | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/hypetrain/events", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Checks whether AutoMod would flag the specified message for review.
	 * 
	 * AutoMod is a moderation tool that holds inappropriate or harassing chat messages for moderators to review. Moderators approve or deny the messages that AutoMod flags; only approved messages are released to chat. AutoMod detects misspellings and evasive language automatically. For information about AutoMod, see [How to Use AutoMod](https://help.twitch.tv/s/article/how-to-use-automod).
	 * 
	 * **Rate Limits**: Rates are limited per channel based on the account type rather than per access token.
	 * - `Normal`: 5 per minute, 50 per hour
	 * - `Affiliate`: 10 per minute, 100 per hour
	 * - `Partner`: 30 per minute, 300 per hour
	 * 
	 * The above limits are in addition to the standard [Twitch API rate limits](https://dev.twitch.tv/docs/api/guide#twitch-rate-limits). The rate limit headers in the response represent the Twitch rate limits and not the above limits.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderation:read** scope.
	 */
	export async function CheckAutomodStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderation:read">>): Promise<ResponseBody.CheckAutomodStatus | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/enforcements/status", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Allow or deny the message that AutoMod flagged for review. For information about AutoMod, see [How to Use AutoMod](https://help.twitch.tv/s/article/how-to-use-automod).
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:automod** scope.
	 * @param msg_id The ID of the message to allow or deny.
	 * @param action The action to take for the message.
	 */
	export async function ManageHeldAutoModMessages<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:automod">>, msg_id: string, action: "ALLOW" | "DENY"): Promise<ResponseBody.ManageHeldAutoModMessages | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/automod/message", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ user_id: authorization.user_id, msg_id, action, }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s AutoMod settings. The settings are used to automatically block inappropriate or harassing messages from appearing in the broadcaster’s chat room.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:automod_settings** scope.
	 * @param broadcaster_id The ID of the broadcaster whose AutoMod settings you want to get.
	 */
	export async function GetAutoModSettings<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:automod_settings">>, broadcaster_id: string): Promise<ResponseBody.GetAutoModSettings | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/automod/settings", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates the broadcaster’s AutoMod settings. The settings are used to automatically block inappropriate or harassing messages from appearing in the broadcaster’s chat room.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:automod** scope.
	 * @param broadcaster_id The ID of the broadcaster whose AutoMod settings you want to update.
	 * @param body
	 * Basically you need to get response from `GetAutoModSettings`, update the fields you want to change, and pass that response to this parameter.
	 * 
	 * You may set either `overall_level` or the individual settings like `aggression`, but not both.
	 * 
	 * Setting `overall_level` applies default values to the individual settings. However, setting `overall_level` to 4 does not necessarily mean that it applies 4 to all the individual settings. Instead, it applies a set of recommended defaults to the rest of the settings. For example, if you set `overall_level` to 2, Twitch provides some filtering on discrimination and sexual content, but more filtering on hostility (see the first example response).
	 * 
	 * If `overall_level` is currently set and you update swearing to 3, `overall_level` will be set to `null` and all settings other than swearing will be set to 0. The same is true if individual settings are set and you update `overall_level` to 3 — all the individual settings are updated to reflect the default level.
	 * 
	 * Note that if you set all the individual settings to values that match what `overall_level` would have set them to, Twitch changes AutoMod to use the default AutoMod level instead of using the individual settings.
	 * 
	 * Valid values for all levels are from 0 (no filtering) through 4 (most aggressive filtering). These levels affect how aggressively AutoMod holds back messages for moderators to review before they appear in chat or are denied (not shown).
	 */
	export async function UpdateAutoModSettings<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:automod">>, broadcaster_id: string, body: Omit<ResponseBody.GetAutoModSettings["data"], "broadcaster_id" | "moderator_id">): Promise<ResponseBody.UpdateAutoModSettings | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/automod/settings", "PUT").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ body }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets all users that the broadcaster banned or put in a timeout.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderation:read** or **moderator:manage:banned_users** scope.
	 * @param user_id A list of user IDs used to filter the results. You may specify a maximum of 100 IDs. The returned list includes only those users that were banned or put in a timeout. The list is returned in the same order that you specified the IDs.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 * @param before The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetBannedUsers<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderation:read" | "moderator:manage:banned_users">>, user_id?: string | string[], first?: number, after?: string, before?: string): Promise<ResponseBody.GetBannedUsers | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/banned", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after, before }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Bans a user from participating in the specified broadcaster’s chat room or puts them in a timeout.
	 * 
	 * For information about banning or putting users in a timeout, see [Ban a User](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat#TheBanFeature) and [Timeout a User](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat#TheTimeoutFeature).
	 * 
	 * If the user is currently in a timeout, you can call this endpoint to change the duration of the timeout or ban them altogether. If the user is currently banned, you cannot call this method to put them in a timeout instead.
	 * 
	 * To remove a ban or end a timeout, see `UnbanUser` function.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:banned_users** scopes.
	 * @param broadcaster_id The ID of the broadcaster whose chat room the user is being banned from.
	 * @param user_id The ID of the user to ban or put in a timeout.
	 * @param duration To ban a user indefinitely, don’t include this field. To put a user in a timeout, include this field and specify the timeout period, in seconds. The minimum timeout is 1 second and the maximum is 1,209,600 seconds (2 weeks). To end a user’s timeout early, set this field to 1, or use the `UnbanUser` function.
	 * @param reason The reason the you’re banning the user or putting them in a timeout. The text is user defined and is limited to a maximum of 500 characters.
	 */
	export async function BanUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:banned_users">>, broadcaster_id: string, user_id: string, duration?: number, reason?: string): Promise<ResponseBody.BanUser | ResponseBodyError> {
		const data = { user_id, duration, reason };
		if (!duration) delete data.duration;
		if (!reason) delete data.reason;

		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/bans", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ data }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Removes the ban or timeout that was placed on the specified user.
	 * 
	 * To ban a user, see `BanUser` function.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:banned_users** scopes.
	 * @param broadcaster_id The ID of the broadcaster whose chat room the user is banned from chatting in.
	 * @param user_id The ID of the user to remove the ban or timeout from.
	 */
	export async function UnbanUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:banned_users">>, broadcaster_id: string, user_id: string): Promise<ResponseBody.UnbanUser | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/bans", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of unban requests for a broadcaster’s channel.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:unban_requests** or **moderator:manage:banned_users** scope.
	 * @param broadcaster_id The ID of the broadcaster whose channel is receiving unban requests.
	 * @param status Filter by a status.
	 * @param user_id The ID used to filter what unban requests are returned.
	 * @param after Cursor used to get next page of results. Pagination object in response contains cursor value.
	 * @param first The maximum number of items to return per page in response.
	 */
	export async function GetUnbanRequests<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:unban_requests" | "moderator:manage:unban_requests">>, broadcaster_id: string, status?: "pending" | "approved" | "denied" | "acknowledged" | "canceled", user_id?: string, after?: string, first?: number): Promise<ResponseBody.GetUnbanRequests | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/unban_requests", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, status, user_id, after, first }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Resolves an unban request by approving or denying it.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:banned_users** scope.
	 * @param broadcaster_id The ID of the broadcaster whose channel is approving or denying the unban request.
	 * @param unban_request_id The ID of unban request.
	 * @param status Resolution status.
	 * @param resolution_text Message supplied by the unban request resolver. The message is limited to a maximum of 500 characters.
	 */
	export async function ResolveUnbanRequest<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:unban_requests">>, broadcaster_id: string, unban_request_id: string, status: "approved" | "denied", resolution_text?: string): Promise<ResponseBody.ResolveUnbanRequest<typeof status> | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/unban_requests", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, unban_request_id, status, resolution_text }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s list of non-private, blocked words or phrases. These are the terms that the broadcaster or moderator added manually or that were denied by AutoMod. [Read More](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:blocked_terms** or **moderator:manage:blocked_terms** scope.
	 * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value
	 */
	export async function GetBlockedTerms<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:blocked_terms" | "moderator:manage:blocked_terms">>, broadcaster_id: string, first?: number, after?: string): Promise<ResponseBody.GetBlockedTerms | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/blocked_terms", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Adds a word or phrase as token owner to the broadcaster’s list of blocked terms. These are the terms that the broadcaster doesn’t want used in their chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope.
	 * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
	 * @param text The word or phrase to block from being used in the broadcaster’s chat room. The term must contain a minimum of 2 characters and may contain up to a maximum of 500 characters. Terms may include a wildcard character (*). The wildcard character must appear at the beginning or end of a word or set of characters. For example, \*foo or foo\*. If the blocked term already exists, the response contains the existing blocked term
	 */
	export async function AddBlockedTerm<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:blocked_terms">>, broadcaster_id: string, text: string): Promise<ResponseBody.AddBlockedTerm | ResponseBodyError> {
		try {
			if (text.length < 2) throw "The length of the term in the text field is too short. The term must contain a minimum of 2 characters.";
			if (text.length > 500) throw "The length of the term in the text field is too long. The term may contain up to a maximum of 500 characters.";

			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/blocked_terms", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ text }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Removes the word or phrase as token owner from the broadcaster’s list of blocked terms. [Read More](https://dev.twitch.tv/docs/api/reference/#remove-blocked-term)
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope.
	 * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
	 * @param id The ID of the blocked term to remove from the broadcaster’s list of blocked terms
	 */
	export async function RemoveBlockedTerm<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:blocked_terms">>, broadcaster_id: string, id: string): Promise<ResponseBody.RemoveBlockedTerm | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/blocked_terms", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, id }).fetch()
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Removes a single chat message or all chat messages from the broadcaster’s chat room.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_messages** scope.
	 * @param broadcaster_id The ID of the broadcaster that owns the chat room to remove messages from.
	 * @param message_id The ID of the message to remove. Restrictions:
	 * - The message must have been created within the last 6 hours.
	 * - The message must not belong to the broadcaster.
	 * - The message must not belong to another moderator.
	 * 
	 * If not specified, the request removes all messages in the broadcaster’s chat room.
	 */
	export async function DeleteChatMessage<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:chat_messages">>, broadcaster_id: string, message_id?: string): Promise<ResponseBody.DeleteChatMessage | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/chat", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id, message_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of channels that the specified user has moderator privileges in.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:moderated_channels** scope.
	 * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
	 * @param first The maximum number of items to return per page in the response. Minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 */
	export async function GetModeratedChannels<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:moderated_channels">>, after?: string, first?: number): Promise<ResponseBody.GetModeratedChannels | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/channels", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ user_id: authorization.user_id, after, first }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets all users allowed to moderate the broadcaster’s chat room.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderation:read** or **channel:manage:moderators** scope.
	 * @param user_id A list of user IDs used to filter the results. You may specify a maximum of 100 IDs. The returned list includes only the users from the list who are moderators in the broadcaster’s channel. The list is returned in the same order as you specified the IDs.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
	 */
	export async function GetModerators<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderation:read" | "channel:manage:moderators">>, user_id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetModerators | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/moderators", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Adds a moderator to the broadcaster’s chat room.
	 * 
	 * **Rate Limits**: The broadcaster may add a maximum of 10 moderators within a 10-second window.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:moderators** scope.
	 * @param user_id The ID of the user to add as a moderator in the broadcaster’s chat room.
	 */
	export async function AddChannelModerator<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:moderators">>, user_id: string): Promise<ResponseBody.AddChannelModerator | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/moderators", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Removes a moderator from the broadcaster’s chat room.
	 * 
	 * **Rate Limits**: The broadcaster may remove a maximum of 10 moderators within a 10-second window.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:moderators** scope.
	 * @param user_id The ID of the user to remove as a moderator from the broadcaster’s chat room.
	 */
	export async function RemoveChannelModerator<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:moderators">>, user_id: string): Promise<ResponseBody.RemoveChannelModerator | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/moderators", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of the broadcaster’s VIPs.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:vips** or **channel:manage:vips** scope.
	 * @param user_id Filters the list for specific VIPs. To specify more than one user, include the `user_id` parameter for each user to get. For example, `&user_id=1234&user_id=5678`. The maximum number of IDs that you may specify is 100. Ignores the ID of those users in the list that aren’t VIPs.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
	 */
	export async function GetChannelVips<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:vips" | "channel:manage:vips">>, user_id?: string, first?: number, after?: string): Promise<ResponseBody.GetChannelVips | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/vips", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Adds the specified user as a VIP in the broadcaster’s channel.
	 * 
	 * **Rate Limits**: The broadcaster may add a maximum of 10 VIPs within a 10-second window.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:vips** scope.
	 * @param user_id The ID of the user to give VIP status to.
	 */
	export async function AddChannelVip<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:vips">>, user_id: string): Promise<ResponseBody.AddChannelVip | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/vips", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Removes the specified user as a VIP in the broadcaster’s channel.
	 * 
	 * If the broadcaster is removing the user’s VIP status, the ID in the `broadcaster_id` query parameter must match the user ID in the access token; otherwise, if the user is removing their VIP status themselves, the ID in the `user_id` query parameter must match the user ID in the access token.
	 * 
	 * **Rate Limits**: The broadcaster may remove a maximum of 10 VIPs within a 10-second window.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:vips** scope.
	 * @param broadcaster_id The ID of the broadcaster who owns the channel where the user has VIP status.
	 * @param user_id The ID of the user to remove VIP status from.
	 */
	export async function RemoveChannelVip<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:vips">>, broadcaster_id: string, user_id: string): Promise<ResponseBody.RemoveChannelVip | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/vips", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Activates or deactivates the broadcaster’s Shield Mode.
	 * 
	 * Twitch’s Shield Mode feature is like a panic button that broadcasters can push to protect themselves from chat abuse coming from one or more accounts. When activated, Shield Mode applies the overrides that the broadcaster configured in the Twitch UX. If the broadcaster hasn’t configured Shield Mode, it applies default overrides.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:shield_mode** scope.
	 * @param broadcaster_id The ID of the broadcaster whose Shield Mode you want to activate or deactivate.
	 * @param is_active A Boolean value that determines whether to activate Shield Mode. Set to `true` to activate Shield Mode; otherwise, `false` to deactivate Shield Mode.
	 */
	export async function UpdateShieldModeStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:shield_mode">>, broadcaster_id: string, is_active: boolean): Promise<ResponseBody.UpdateShieldModeStatus | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/shield_mode", "PUT").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ is_active }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the broadcaster’s Shield Mode activation status.
	 * 
	 * To receive notification when the broadcaster activates and deactivates Shield Mode, subscribe to the [channel.shield_mode.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshield_modebegin) and [channel.shield_mode.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshield_modeend) subscription types.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:shield_mode** or **moderator:manage:shield_mode** scope.
	 * @param broadcaster_id The ID of the broadcaster whose Shield Mode activation status you want to get.
	 */
	export async function GetShieldModeStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:shield_mode" | "moderator:manage:shield_mode">>, broadcaster_id: string): Promise<ResponseBody.GetShieldModeStatus | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/shield_mode", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Warns a user in the specified broadcaster’s chat room, preventing them from chat interaction until the warning is acknowledged. New warnings can be issued to a user when they already have a warning in the channel (new warning will replace old warning).
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:warnings** scope.
	 * @param broadcaster_id The ID of the channel in which the warning will take effect.
	 * @param user_id The ID of the twitch user to be warned.
	 * @param reason A custom reason for the warning. **Max 500 chars.**
	 */
	export async function WarnChatUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:warnings">>, broadcaster_id: string, user_id: string, reason: string): Promise<ResponseBody.WarnChatUser | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/warnings", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ data: { user_id, reason } }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of polls that the broadcaster created.
	 * 
	 * Polls are available for 90 days after they’re created.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:polls** or **channel:manage:polls** scope.
	 * @param id A list of IDs that identify the polls to return. You may specify a maximum of 20 IDs. Specify this parameter only if you want to filter the list that the request returns. The endpoint ignores duplicate IDs and those not owned by this broadcaster.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 20 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetPolls<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:polls" | "channel:manage:polls">>, id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetPolls | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/polls", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Creates a poll that viewers in the broadcaster’s channel can vote on.
	 * 
	 * The poll begins as soon as it’s created. You may run only one poll at a time.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:polls** scope.
	 * @param title The question that viewers will vote on. For example, `What game should I play next?` The question may contain a maximum of 60 characters.
	 * @param choices A list of choices that viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 5 choices. The choice may contain a maximum of 25 characters.
	 * @param duration The length of time (in seconds) that the poll will run for. The minimum is 15 seconds and the maximum is 1800 seconds (30 minutes).
	 * @param channel_points_voting_enabled A Boolean value that indicates whether viewers may cast additional votes using Channel Points. If `true`, the viewer may cast more than one vote but each additional vote costs the number of Channel Points specified in `channel_points_per_vote`. The default is `false` (viewers may cast only one vote). For information about Channel Points, see [Channel Points Guide](https://help.twitch.tv/s/article/channel-points-guide).
	 * @param channel_points_per_vote The number of points that the viewer must spend to cast one additional vote. The minimum is 1 and the maximum is 1000000. Set only if `channel_points_voting_enabled` is `true`.
	 */
	export async function CreatePoll<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:polls">>, title: string, choices: string[], duration: number, channel_points_voting_enabled?: boolean, channel_points_per_vote?: number): Promise<ResponseBody.CreatePoll | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/polls", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ broadcaster_id: authorization.user_id, title, choices: choices.map(v => { return { title: v } }), duration, channel_points_voting_enabled, channel_points_per_vote }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Ends an active poll. You have the option to end it or end it and archive it.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:polls** scope.
	 * @param id The ID of the poll to update.
	 * @param status The status to set the poll to.
	 */
	export async function EndPoll<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:polls">>, id: string, status: "TERMINATED" | "ARCHIVED"): Promise<ResponseBody.EndPoll<typeof status> | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/polls", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ broadcaster_id: authorization.user_id, id, status }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of Channel Points Predictions that the broadcaster created.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:predictions** or **channel:manage:predictions** scope.
	 * @param id The ID of the prediction to get. You may specify a maximum of 25 IDs. The endpoint ignores duplicate IDs and those not owned by the broadcaster.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 25 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetPredictions<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:predictions" | "channel:manage:predictions">>, id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetPredictions | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/predictions", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Creates a Channel Points Prediction.
	 * 
	 * With a Channel Points Prediction, the broadcaster poses a question and viewers try to predict the outcome. The prediction runs as soon as it’s created. The broadcaster may run only one prediction at a time.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:predictions** scope.
	 * @param title The question that the broadcaster is asking. For example, `Will I finish this entire pizza?` The title is limited to a maximum of 45 characters.
	 * @param outcomes The list of possible outcomes that the viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 10 choices. The choice is limited to a maximum of 25 characters.
	 * @param prediction_window The length of time (in seconds) that the prediction will run for. The minimum is 30 seconds and the maximum is 1800 seconds (30 minutes).
	 */
	export async function CreatePrediction<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:predictions">>, title: string, outcomes: string[], prediction_window: number): Promise<ResponseBody.CreatePrediction | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/predictions", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ broadcaster_id: authorization.user_id, title, outcomes: outcomes.map(v => { return { title: v } }), prediction_window }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Locks, resolves, or cancels a Channel Points Prediction.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:predictions** scope.
	 * @param id The ID of the prediction to end.
	 * @param status The status to set the prediction to. Possible values are:
	 * - `RESOLVED` — The winning outcome is determined and the Channel Points are distributed to the viewers who predicted the correct outcome.
	 * - `CANCELED` — The broadcaster is canceling the prediction and sending refunds to the participants.
	 * - `LOCKED` — The broadcaster is locking the prediction, which means viewers may no longer make predictions.
	 * 
	 * The broadcaster can update an active prediction to LOCKED, RESOLVED, or CANCELED; and update a locked prediction to RESOLVED or CANCELED.
	 * 
	 * The broadcaster has up to 24 hours after the prediction window closes to resolve the prediction. If not, Twitch sets the status to CANCELED and returns the points.
	 * @param winning_outcome_id The ID of the winning outcome. You must set this parameter if you set `status` to RESOLVED.
	 */
	export async function EndPrediction<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:predictions">>, id: string, status: "RESOLVED" | "CANCELED" | "LOCKED", winning_outcome_id?: string): Promise<ResponseBody.EndPrediction | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/predictions", "PATCH").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setBody({ broadcaster_id: authorization.user_id, id, status, winning_outcome_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Raid another channel by sending the broadcaster’s viewers to the targeted channel.
	 * 
	 * When you call the API from a chat bot or extension, the Twitch UX pops up a window at the top of the chat room that identifies the number of viewers in the raid. The raid occurs when the broadcaster clicks **Raid Now** or after the 90-second countdown expires.
	 * 
	 * To determine whether the raid successfully occurred, you must subscribe to the [Channel Raid](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelraid) event. For more information, see [Get notified when a raid begins](https://dev.twitch.tv/docs/api/raids#get-notified-when-a-raid-begins).
	 * 
	 * To cancel a pending raid, use the `CancelRaid` function.
	 * 
	 * **Rate Limit**: The limit is 10 requests within a 10-minute window.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:raids** scope.
	 * @param to_broadcaster_id The ID of the broadcaster to raid.
	 */
	export async function StartRaid<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:raids">>, to_broadcaster_id: string): Promise<ResponseBody.StartRaid | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/raids", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ from_broadcaster_id: authorization.user_id, to_broadcaster_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Cancel a pending raid.
	 * 
	 * You can cancel a raid at any point up until the broadcaster clicks **Raid Now** in the Twitch UX or the 90-second countdown expires.
	 * 
	 * **Rate Limit**: The limit is 10 requests within a 10-minute window.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:raids** scope.
	 */
	export async function CancelRaid<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:raids">>): Promise<ResponseBody.CancelRaid | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/raids", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the games or categories that match the specified query. [Read More](https://dev.twitch.tv/docs/api/reference/#search-categories)
	 * 
	 * To match, the category’s name must contain all parts of the query string. For example, if the query string is 42, the response includes any category name that contains 42 in the title. If the query string is a phrase like *love computer*, the response includes any category name that contains the words love and computer anywhere in the name. The comparison is case insensitive.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param query The search string.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function SearchCategories(authorization: Authorization, query: string, first?: number, after?: string): Promise<ResponseBody.SearchCategories | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/search/categories", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ query, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the channels that match the specified query and have streamed content within the past 6 months.
	 * 
	 * The fields that the API uses for comparison depends on the value that the `live_only` is set to. If `live_only` is `false`, the API matches on the broadcaster’s login name. However, if `live_only` is `true`, the API matches on the broadcaster’s name and category name.
	 * 
	 * To match, the beginning of the broadcaster’s name or category must match the query string. The comparison is case insensitive. If the query string is `angel_of_death`, it matches all names that begin with `angel_of_death`. However, if the query string is a phrase like `angel of death`, it matches to names starting with `angelofdeath` or names starting with `angel_of_death`.
	 *
	 * By default, the results include both live and offline channels. To get only live channels set the `live_only` to `true`.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param query The search string.
	 * @param live_only A Boolean value that determines whether the response includes only channels that are currently streaming live. Set to `true` to get only channels that are streaming live; otherwise, `false` to get live and offline channels. The default is `false`.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function SearchChannels(authorization: Authorization, query: string, live_only?: boolean, first?: number, after?: string): Promise<ResponseBody.SearchChannels | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/search/channels", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ query, live_only, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the channel’s stream key.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:stream_key** scope.
	 */
	export async function GetStreamKey<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:stream_key">>): Promise<ResponseBody.GetStreamKey | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/streams/key", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of all streams. The list is in descending order by the number of viewers watching the stream. Because viewers come and go during a stream, it’s possible to find duplicate or missing streams in the list as you page through the results.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param user_id A user ID used to filter the list of streams. Returns only the streams of those users that are broadcasting. You may specify a maximum of 100 IDs.
	 * @param user_login A user login name used to filter the list of streams. Returns only the streams of those users that are broadcasting. You may specify a maximum of 100 login names.
	 * @param game_id A game (category) ID used to filter the list of streams. Returns only the streams that are broadcasting the game (category). You may specify a maximum of 100 IDs.
	 * @param type The type of stream to filter the list of streams by. The default is `all`.
	 * @param language A language code used to filter the list of streams. Returns only streams that broadcast in the specified language. Specify the language using an ISO 639-1 two-letter language code or other if the broadcast uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). 
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param before The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetStreams(authorization: Authorization, user_id?: string | string[], user_login?: string | string[], game_id?: string | string[], type?: "all" | "live", language?: string | string[], first?: number, before?: string, after?: string): Promise<ResponseBody.GetStreams | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/streams", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ user_id, user_login, game_id, type, language, first, before, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the list of broadcasters that the user follows and that are streaming live.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:follows** scope.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 100.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetFollowedStreams<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:follows">>, first?: number, after?: string): Promise<ResponseBody.GetFollowedStreams | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/streams/followed", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ user_id: authorization.user_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets a list of users that subscribe to the specified broadcaster.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:subscriptions** scope.
	 * @param user_id Filters the list to include only the specified subscribers. You may specify a maximum of 100 subscribers.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
	 * @param after The cursor used to get the next page of results. Do not specify if you set the `user_id` query parameter. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 * @param before The cursor used to get the previous page of results. Do not specify if you set the `user_id` query parameter. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetBroadcasterSubscriptions<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:subscriptions">>, user_id?: string | string[], first?: number, after?: string, before?: string): Promise<ResponseBody.GetBroadcasterSubscriptions | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after, before }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Checks whether the user subscribes to the broadcaster’s channel.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:subscriptions** scope.
	 * @param broadcaster_id The ID of a partner or affiliate broadcaster.
	 */
	export async function CheckUserSubscription<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:subscriptions">>, broadcaster_id: string): Promise<ResponseBody.CheckUserSubscription | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions/user", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, user_id: authorization.user_id }).fetch();
			return await getResponse(request, true);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the list of Twitch teams that the broadcaster is a member of.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param broadcaster_id The ID of the broadcaster whose teams you want to get.
	 */
	export async function GetChannelTeams(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChannelTeams | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions/user", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about the specified [Twitch team](https://help.twitch.tv/s/article/twitch-teams).
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param name The name of the team to get. This parameter and the `id` parameter are mutually exclusive; you must specify the team’s name or ID but not both.
	 * @param id The ID of the team to get. This parameter and the `name` parameter are mutually exclusive; you must specify the team’s name or ID but not both.
	 */
	export async function GetTeams(authorization: Authorization, name?: string, id?: string): Promise<ResponseBody.GetChannelTeams | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions/user", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ name, id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about one or more users. [Read More](https://dev.twitch.tv/docs/api/reference/#get-users)
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param query Specifies query of request:
	 * - You may look up users using their user ID, login name, or both but the sum total of the number of users you may look up is 100. For example, you may specify 50 IDs and 50 names or 100 IDs or names, but you cannot specify 100 IDs and 100 names.
	 * - If you don’t specify IDs or login names, the request returns information about the user in the access token if you specify a user access token.
	 * - To include the user’s verified email address in the response, you must use a user access token that includes the **user:read:email** scope.
	 */
	export async function GetUsers(authorization: Authorization, query: {
		/** The ID of the user to get. To specify more than one user, include the id parameter for each user to get. For example, `id=1234&id=5678`. The maximum number of IDs you may specify is 100 */
		id?: string;
		/** The login name of the user to get. To specify more than one user, include the login parameter for each user to get. For example, `login=foo&login=bar`. The maximum number of login names you may specify is 100 */
		login?: string;
	}): Promise<ResponseBody.GetUsers | ResponseBodyError>
	{
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/users", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch(query).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Updates the token owner channel description.
	 * 
	 * To include the user’s verified email address in the response, the user access token must also include the **user:read:email** scope.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:edit** scope.
	 * @param description The string to update the channel’s description to. The description is limited to a maximum of 300 characters.
	 */
	export async function UpdateUserDescription<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:edit">>, description: string): Promise<ResponseBody.GetUsers | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/users", "PUT").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ description }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets the [list of users that the broadcaster has blocked](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat?language=en_US#BlockWhispersandMessagesfromStrangers).
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:blocked_users** scope.
	 * @param broadcaster_id The ID of the broadcaster whose list of blocked users you want to get.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function GetUserBlockList<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:blocked_users">>, broadcaster_id: string, first?: number, after?: string): Promise<ResponseBody.GetUserBlockList | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/users/blocks", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ broadcaster_id, first, after }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Blocks the specified user from interacting with or having contact with the broadcaster.
	 * 
	 * To learn more about blocking users, see [Block Other Users on Twitch](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat?language=en_US#BlockWhispersandMessagesfromStrangers).
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:blocked_users** scope.
	 * @param target_user_id The ID of the user to block. The API ignores the request if the broadcaster has already blocked the user.
	 * @param source_context The location where the harassment took place that is causing the broadcaster to block the user.
	 * @param reason The reason that the broadcaster is blocking the user.
	 */
	export async function BlockUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:blocked_users">>, target_user_id: string, source_context?: "chat" | "whisper", reason?: "harassment" | "spam" | "other"): Promise<ResponseBody.BlockUser | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/users/blocks", "PUT").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ target_user_id, source_context, reason }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Removes the user from the broadcaster’s list of blocked users.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:blocked_users** scope.
	 * @param target_user_id The ID of the user to remove from the broadcaster’s list of blocked users. The API ignores the request if the broadcaster hasn’t blocked the user.
	 */
	export async function UnblockUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:blocked_users">>, target_user_id: string): Promise<ResponseBody.UnblockUser | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/users/blocks", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ target_user_id }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Gets information about one or more published videos. You may get videos by ID, by user, or by game/category.
	 * 
	 * You may apply several filters to get a subset of the videos. The filters are applied as an AND operation to each video. For example, if `language` is set to `de` and `game_id` is set to 21779, the response includes only videos that show playing League of Legends by users that stream in German. The filters apply only if you get videos by user ID or game ID.
	 * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param query Query
	 * - `id` — A list of IDs that identify the videos you want to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate IDs and IDs that weren't found (if there's at least one valid ID).
	 * - `user_id` — The ID of the user whose list of videos you want to get.
	 * - `game_id` — A category or game ID. The response contains a maximum of 500 videos that show this content. To get category/game IDs, use the `SearchCategories` function.
	 * @param language A filter used to filter the list of videos by the language that the video owner broadcasts in. For example, to get videos that were broadcast in German, set this parameter to the ISO 639-1 two-letter code for German (i.e., DE). For a list of supported languages, see [Supported Stream Language](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). If the language is not supported, use `other`. Specify this parameter only if you specified the `game_id`.
	 * @param period A filter used to filter the list of videos by when they were published. For example, videos published in the last week. The default is `all`, which returns videos published in all periods. Specify this parameter only if you specified the `game_id` or `user_id`.
	 * @param sort The order to sort the returned videos in. Possible values are:
	 * - `time` — Sort the results in descending order by when they were created (i.e., latest video first).
	 * - `trending` — Sort the results in descending order by biggest gains in viewership (i.e., highest trending video first).
	 * - `views` — Sort the results in descending order by most views (i.e., highest number of views first).
	 * 
	 * The default is `time`.
	 * 
	 * Specify this parameter only if you specify the `game_id or user_id` query parameter.
	 * @param type A filter used to filter the list of videos by the video's type. Possible values are:
	 * - `all`
	 * - `archive` — On-demand videos (VODs) of past streams.
	 * - `highlight` — Highlight reels of past streams.
	 * - `upload` — External videos that the broadcaster uploaded using the Video Producer.
	 * 
	 * The default is `all`, which returns all video types.
	 * 
	 * Specify this parameter only if you specify the `game_id` or user_id` query parameter.
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. Specify this parameter only if you specify the `game_id` or `user_id` query parameter.
	 * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value. Specify this parameter only if you specify the `user_id` query parameter.
	 * @param before The cursor used to get the previous page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value. Specify this parameter only if you specify the `user_id` query parameter.
	 */
	export async function GetVideos(authorization: Authorization, query: {id: string | string[]} | {user_id: string} | {game_id: string}, language?: string, period?: "all" | "day" | "month" | "week", sort?: "time" | "trending" | "views", type?: "all" | "archive" | "highlight" | "upload", first?: number, after?: string, before?: string): Promise<ResponseBody.GetVideos | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/videos", "GET").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch(query).setSearch({ language, period, sort, type, first, after, before }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Deletes one or more videos. You may delete past broadcasts, highlights, or uploads.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:videos** scope.
	 * @param id The list of videos to delete. You can delete a maximum of 5 videos per request. Ignores invalid video IDs. If the user doesn’t have permission to delete one of the videos in the list, none of the videos are deleted.
	 */
	export async function DeleteVideos<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:videos">>, id: string | string[]): Promise<ResponseBody.DeleteVideos | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/videos", "DELETE").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`
			}).setSearch({ id }).fetch();
			return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Sends a whisper message to the specified user.
	 * 
	 * **NOTE**: The user sending the whisper must have a verified phone number (see the **Phone Number** setting in your [Security and Privacy](https://www.twitch.tv/settings/security) settings).
	 * 
	 * **NOTE**: The API may silently drop whispers that it suspects of violating Twitch policies. (The API does not indicate that it dropped the whisper; it returns a 204 status code as if it succeeded.)
	 * 
	 * **Rate Limits**: You may whisper to a maximum of 40 unique recipients per day. Within the per day limit, you may whisper a maximum of 3 whispers per second and a maximum of 100 whispers per minute.
	 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:whispers** scope.
	 * @param to_user_id The ID of the user to receive the whisper.
	 * @param message The whisper message to send. The message must not be empty. The maximum message lengths are:
	 * - 500 characters if the user you're sending the message to hasn't whispered you before.
	 * - 10000 characters if the user you're sending the message to has whispered you before.
	 * 
	 * Messages that exceed the maximum length are truncated.
	 */
	export async function SendWhisper<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:whispers">>, to_user_id: string, message: string): Promise<ResponseBody.SendWhisper | ResponseBodyError> {
		try {
			const request = await new FetchBuilder("https://api.twitch.tv/helix/whispers", "POST").setHeaders({
				"Client-Id": authorization.client_id,
				"Authorization": `Bearer ${authorization.token}`,
				"Content-Type": "application/json"
			}).setSearch({ from_user_id: authorization.user_id, to_user_id }).setBody({ message }).fetch();
			return request.ok ? {ok: true, status: 204} : await getResponse(request);
		} catch(e) { return getError(e) }
	}
	/**
	 * Validates access token and if its valid, returns data of it. [Read More](https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token)
	 * @param authorization Access token data or token itself to validate
	 */
	export async function OAuth2Validate<S extends Authorization.Scope[]>(token_data: Authorization<S>["token"] | Authorization<S>): Promise<ResponseBody.OAuth2Validate<S> | ResponseBodyError.OAuth2Validate<Authorization<S>["token"]>> {
		const token = typeof token_data === "string" ? token_data : token_data.token;
		if (token.length < 1) return getError("#401 invalid access token");
		try {
			const request = await new FetchBuilder("https://id.twitch.tv/oauth2/validate", "GET").setHeaders({
				"Authorization": `Bearer ${token}`
			}).fetch();
			const response: any = await getResponse(request);
			if (response.status === 200) {
				response.token = token;
				if (!response.scopes) response.scopes = [];
				response.user_login = response.login;
				delete response.login;
				response.type = (response.user_id || response.user_login) ? "user" : "app";
			}
			return response;
		} catch(e) { return getError(e) }
	}
	/**
	 * If your app no longer needs an access token, you can revoke it by this method. [Read More](https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-token)
	 * @param authorization Access token data to revoke
	 */
	export async function OAuth2Revoke(authorization: Authorization): Promise<ResponseBody.OAuth2Revoke | ResponseBodyError> {
		try {
			if (authorization.token.length < 1) throw "invalid access token";
			const request = await new FetchBuilder("https://id.twitch.tv/oauth2/revoke", "POST").setHeaders({
				"Content-Type": "application/x-www-form-urlencoded"
			}).setSearch({ client_id: authorization.client_id, token: authorization.token }).fetch();
			if (request.ok) return {ok: true, status: 200};
			else return await getResponse(request);
		} catch(e) { return getError(e) }
	}
	export namespace OAuth2Token {
		/**
		 * Gets app access token from [client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow)
		 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
		 * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
		 */
		export async function ClientCredentials(client_id: string, client_secret: string): Promise<ResponseBody.OAuth2Token.ClientCredentials | ResponseBodyError> {
			try {
				const request = await new FetchBuilder("https://id.twitch.tv/oauth2/token", "POST").setHeaders({
					"Content-Type": "x-www-form-urlencoded"
				}).setSearch({ client_id, client_secret, grant_type: "client_credentials" }).fetch();
				return await getResponse(request);
			} catch(e) { return getError(e) }
		}
		/**
		 * Gets user access token and refresh token from [authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
		 * 
		 * User access token expires in **1-4 hours**
		 * 
		 * Refresh token expires in **30 days** (only if your app is **Public**)
		 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
		 * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
		 * @param redirect_uri Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) redirect URI.
		 * @param code The code that the `/authorize` response returned in the `code` query parameter.
		 */
		export async function AuthorizationCode<S extends Authorization.Scope[]>(client_id: string, client_secret: string, redirect_uri: string, code: string): Promise<ResponseBody.OAuth2Token.AuthorizationCode<S> | ResponseBodyError> {
			try {
				const request = await new FetchBuilder("https://id.twitch.tv/oauth2/token", "POST").setHeaders({
					"Content-Type": "x-www-form-urlencoded"
				}).setSearch({ client_id, client_secret, redirect_uri, code, grant_type: "authorization_code" }).fetch();
				const response: any = await getResponse(request);
				if (request.ok) {
					if (!response.scopes) response.scopes = [];
				}
				return response;
			} catch(e) { return getError(e) }
		}
		/**
		 * Gets user access token from refresh token. [Read More](https://dev.twitch.tv/docs/authentication/refresh-tokens/#how-to-use-a-refresh-token)
		 * 
		 * User access token expires in **1-4 hours**
		 * 
		 * Refresh token expires in **30 days** (only if your app is **Public**), also this method returns new refresh token, so save it too!
		 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
		 * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
		 * @param refresh_token The refresh token issued to the client.
		 */
		export async function RefreshToken<S extends Authorization.Scope[]>(client_id: string, client_secret: string, refresh_token: string): Promise<ResponseBody.OAuth2Token.RefreshToken<S> | ResponseBodyError> {
			try {
				const request = await new FetchBuilder("https://id.twitch.tv/oauth2/token", "POST").setHeaders({
					"Content-Type": "x-www-form-urlencoded"
				}).setSearch({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }).fetch();
				const response: any = await getResponse(request);
				if (request.ok) {
					if (!response.scopes) response.scopes = [];
				}
				return response;
			} catch(e) { return getError(e) }
		}
	}
}