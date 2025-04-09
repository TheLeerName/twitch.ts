import { AdvancedFetch as fetch, AdvancedRequestInit as RequestInit } from './advanced-fetch';

export namespace EventSub {
	export async function startWebSocket(access_token: string) {
		const response = await Request.OAuth2Validate(access_token);
		if (response.status !== 200) throw `ValidateError: token isn't valid.\n${JSON.stringify(response)}`;

		const connection = new Connection(new WebSocket(WebSocketURL), {
			client_id: response.client_id,
			token: access_token,
			login: response.login,
			scopes: response.scopes,
			user_id: response.user_id,
			expires_in: response.expires_in
		});

		await new Promise<void>(resolve => {
			connection.ws.onmessage = e => {
				const message: Message.Any = JSON.parse(e.data);
				if (Message.isSessionWelcome(message)) {
					connection.session = message.payload.session;
					resolve();
				}
			};
		});

		async function onMessage(e: MessageEvent) {
			if (connection.keepalive_timeout) {
				clearTimeout(connection.keepalive_timeout);
				delete connection.keepalive_timeout;
			}

			const message: Message.Any = JSON.parse(e.data);
			connection.onMessage(message);
			if (Message.isSessionWelcome(message)) {
				const is_reconnected = connection.session.status === "reconnecting";
				connection.session = message.payload.session;
				connection.onSessionWelcome(message, is_reconnected);
			}
			else if (Message.isSessionKeepalive(message)) {
				connection.keepalive_timeout = setTimeout(() => connection.ws.close(4005, `NetworkTimeout: client doesn't received any message within ${connection.session.keepalive_timeout_seconds} seconds`), (connection.session.keepalive_timeout_seconds + 2) * 1000);
				connection.onSessionKeepalive(message);
			}
			else if (Message.isSessionReconnect(message)) {
				connection.session.status = "reconnecting";
				connection.ws.onmessage = (_) => {};
				connection.ws.onclose = (_) => {};
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
			}, 500);

			connection.onClose(e.code, e.reason);
		}

		connection.ws.onmessage = onMessage;
		connection.ws.onclose = onClose;

		return connection;
	}

	export const WebSocketURL = "wss://eventsub.wss.twitch.tv/ws";

	export class Connection {
		ws: WebSocket;
		access: Connection.Access;
		session: Connection.Session;

		keepalive_timeout?: NodeJS.Timeout | number;

		constructor(ws: WebSocket, access: Connection.Access) {
			this.ws = ws;
			this.access = access;
		}

		async onClose(code: number, reason: string) {}
		async onMessage(message: Message.Any) {}
		async onSessionWelcome(message: Message.SessionWelcome, is_reconnected: boolean) {}
		async onSessionKeepalive(message: Message.SessionKeepalive) {}
		async onNotification(message: Message.Notification) {}
		async onSessionReconnect(message: Message.SessionReconnect) {}
		async onRevocation(message: Message.Revocation) {}
	}
	export namespace Connection {
		export type Session = EventSub.Session<"connected" | "reconnecting">;
		export type Access = {
			client_id: string;
			token: string;
			login: string;
			scopes: string[];
			user_id: string;
			expires_in: number;
		};
	}

	/** An object that contains information about the connection. */
	export interface Session<Status extends string = "connected", KeepaliveTimeoutSeconds extends number | null = number, ReconnectURL extends string | null = null> {
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
		export interface Subscription<MessageType extends string = string, SubscriptionType extends string = string, SubscriptionVersion extends Subscription.Version = Subscription.Version> extends Metadata<MessageType> {
			/** The type of event sent in the message. */
			subscription_type: SubscriptionType;
			/** The version number of the subscription type's definition. This is the same value specified in the subscription request. */
			subscription_version: SubscriptionVersion;
		}
	}

	/** Subscription-related parameters */
	export interface Subscription<Type extends string = string, Version extends Subscription.Version = Subscription.Version, Condition extends Subscription.Condition = Subscription.Condition, Transport extends Subscription.Transport = Subscription.Transport> {
		/** The subscription type name. */
		type: Type;
		/** The subscription version. */
		version: Version;
		/** Subscription-specific parameters. */
		condition: Condition;
		/** Transport-specific parameters. */
		transport: Transport;
	}
	export namespace Subscription {
		/** Definition of the subscription. */
		export type Version = "1" | "2";

		/** Parameters under which the event subscription fires. */
		export type Condition = {};
		export namespace Condition {
			/** Parameters under which the event subscription fires. */
			export interface ChannelChatMessage extends Condition {
				/** The User ID of the channel to receive chat message events for. */
				broadcaster_user_id: string;
				/** The User ID to read chat as. */
				user_id: string;
			}
		}

		/** Defines the transport details that you want Twitch to use when sending you event notifications. */
		export interface Transport {
			/** The transport method. */
			method: "websocket";
			/** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message). */
			session_id: string;
		}
		/** @param session_id An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message). */
		export function Transport(session_id: string): Transport {return {method: "websocket", session_id}}
		export namespace Transport {
			/** Defines the transport details that you want Twitch to use when sending you event notifications. */
			export interface CreateEventSubSubscription extends Transport {
				/** The UTC date and time that the WebSocket connection was established. */
				connected_at: string;
			}
			/** Defines the transport details that you want Twitch to use when sending you event notifications. */
			export interface GetEventSubSubscription extends CreateEventSubSubscription {
				/** The UTC date and time that the WebSocket connection was lost. */
				disconnected_at: string;
			}
		}

		/** The `channel.chat.message` subscription type sends a notification when any user sends a message to a channel’s chat room. Requires `user:read:chat` scope from the chatting user. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status. [Read More](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage) */
		export type ChannelChatMessage = Subscription<"channel.chat.message", "1", Condition.ChannelChatMessage, Transport>;
		export function ChannelChatMessage(session_id: string, broadcaster_user_id: string, user_id: string): ChannelChatMessage {
			return {type: "channel.chat.message", version: "1", condition: {broadcaster_user_id, user_id}, transport: Transport(session_id)}
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
	}
	export namespace Payload {
		export interface ChannelChatMessage extends Payload<Subscription.ChannelChatMessage> {
			/** The event’s data. For information about the event’s data, see the subscription type’s description in [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types). */
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
					fragments: Array<MessageFragment.Text | MessageFragment.Cheermote | MessageFragment.Emote | MessageFragment.Mention>;
				};
				/**
				 * The type of message. Possible values:
				 * - `text`
				 * - `channel_points_highlighted`
				 * - `channel_points_sub_only`
				 * - `user_intro`
				 * - `power_ups_message_effect`
				 * - `power_ups_gigantified_emote`
				 */
				message_type: "text" | "channel_points_highlighted" | "channel_points_sub_only" | "user_intro" | "power_ups_message_effect" | "power_ups_gigantified_emote";
				/** List of chat badges. */
				badges: Array<{
					/** An ID that identifies this set of chat badges. For example, Bits or Subscriber. */
					set_id: string;
					/** An ID that identifies this version of the badge. */
					id: string;
					/** Contains metadata related to the chat badges. Currently only for subscriber months. */
					info: string;
				}>;
				/** 
				 * **Optional**. Metadata if this message is a cheer.
				 */
				cheer?: {
					/** The amount of Bits the user cheered. */
					bits: number;
				};
				/** 
				 * The color of the user's name in the chat room. 
				 * This is a hexadecimal RGB color code in the form `#<RGB>`. 
				 * May be empty if never set.
				 */
				color: string;
				/** 
				 * **Optional**. Metadata if this message is a reply.
				 */
				reply?: {
					/** An ID that uniquely identifies the parent message that this message is replying to. */
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
				};
				/** 
				 * **Optional**. The ID of a channel points custom reward that was redeemed.
				 */
				channel_points_custom_reward_id?: string;
				/** 
				 * **Optional**. The broadcaster user ID of the channel the message was sent from.
				 * Null when in the same channel as the broadcaster.
				 */
				source_broadcaster_user_id?: string | null;
				/** 
				 * **Optional**. The user name of the broadcaster of the channel the message was sent from.
				 * Null when in the same channel as the broadcaster.
				 */
				source_broadcaster_user_name?: string | null;
				/** 
				 * **Optional**. The login of the broadcaster of the channel the message was sent from.
				 * Null when in the same channel as the broadcaster.
				 */
				source_broadcaster_user_login?: string | null;
				/** 
				 * **Optional**. The UUID that identifies the source message from the channel the message was sent from.
				 * Null when in the same channel as the broadcaster.
				 */
				source_message_id?: string | null;
				/** 
				 * **Optional**. The list of chat badges for the chatter in the channel the message was sent from.
				 * Null when in the same channel as the broadcaster.
				 */
				source_badges?: Array<{
					/** The ID that identifies this set of chat badges. */
					set_id: string;
					/** The ID that identifies this version of the badge. */
					id: string;
					/** Contains metadata related to the chat badges. */
					info: string;
				}> | null;
			};
		}
	}

	/** Chat message fragment. */
	export interface MessageFragment<Type extends string = string> {
		/** The type of message fragment. */
		type: string;
		/** Message text in fragment. */
		text: string;
	}
	export namespace MessageFragment {
		export type Text = MessageFragment<"text">;
		export interface Cheermote extends MessageFragment<"cheermote"> {
			/** Metadata pertaining to the cheermote. */
			cheermote: {
				/**
				 * The name portion of the Cheermote string that you use in chat to cheer Bits.
				 * The full Cheermote string is the concatenation of {prefix} + {number of Bits}.
				 * For example, if the prefix is "Cheer" and you want to cheer 100 Bits,
				 * the full Cheermote string is Cheer100.
				 */
				prefix: string;
				/** The amount of Bits cheered. */
				bits: number;
				/** The tier level of the cheermote. */
				tier: number;
			};
		}
		export interface Emote extends MessageFragment<"emote"> {
			/** Metadata pertaining to the emote. */
			emote: {
				/** An ID that uniquely identifies this emote. */
				id: string;
				/** An ID that identifies the emote set that the emote belongs to. */
				emote_set_id: string;
				/** The ID of the broadcaster who owns the emote. */
				owner_id: string;
				/**
				 * The formats that the emote is available in. Possible values:
				 * - `animated` - An animated GIF is available for this emote
				 * - `static` - A static PNG file is available for this emote
				 */
				format: Array<"animated" | "static">;
			};
		}
		export interface Mention extends MessageFragment<"mention"> {
			/** Metadata pertaining to the mention. */
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

	export namespace Message {
		export type Any = SessionWelcome | SessionKeepalive | Notification | SessionReconnect | Revocation;
		export function isSessionWelcome(data: Any): data is SessionWelcome { return data.metadata.message_type === "session_welcome" }
		export function isSessionKeepalive(data: Any): data is SessionKeepalive { return data.metadata.message_type === "session_keepalive" }
		export function isNotification(data: Any): data is Notification { return data.metadata.message_type === "notification" }
		export function isSessionReconnect(data: Any): data is SessionReconnect { return data.metadata.message_type === "session_reconnect" }
		export function isRevocation(data: Any): data is Revocation { return data.metadata.message_type === "revocation" }

		/** Defines the first message that the EventSub WebSocket server sends after your client connects to the server. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message) */
		export interface SessionWelcome {
			/** An object that identifies the message. */
			metadata: Metadata<"session_welcome">;
			/** An object that contains the message. */
			payload: {
				/** An object that contains information about the connection. */
				session: Session;
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
			export function isChannelChatMessage(data: EventSub.Message.Notification): data is ChannelChatMessage { return data.metadata.subscription_type === "channel.chat.message" && data.metadata.subscription_version === "1" }
			/** Defines a message that the EventSub WebSocket server sends your client when the `channel.chat.message` event occurs. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#notification-message) */
			export type ChannelChatMessage = Message.Notification<Payload.ChannelChatMessage>;
		}

		/** Defines the message that the EventSub WebSocket server sends if the server must drop the connection. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#reconnect-message) */
		export interface SessionReconnect {
			/** An object that identifies the message. */
			metadata: Metadata<"session_reconnect">;
			/** An object that contains the message. */
			payload: {
				/** An object that contains information about the connection. */
				session: Session<"reconnecting", null, string>;
			};
		}

		/** Defines the message that the EventSub WebSocket server sends if the user no longer exists or they revoked the authorization token that the subscription relied on. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#revocation-message) */
		export interface Revocation {
			/** An object that identifies the message. */
			metadata: Metadata.Subscription<"revocation", string, Subscription.Version>;
			/** An object that contains the message. */
			payload: Payload<Subscription, "authorization_revoked" | "user_removed" | "version_removed">;
		}
	}
}

export namespace RequestBody {
	/** https://dev.twitch.tv/docs/api/reference/#modify-channel-information */
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
}

export interface ResponseBody<Status extends number = 200> {
	/** The code status of request. */
	status: Status;
}
export namespace ResponseBody {
	/** https://dev.twitch.tv/docs/api/reference/#get-blocked-terms */
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
	/** https://dev.twitch.tv/docs/api/reference/#add-blocked-term */
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
	/** https://dev.twitch.tv/docs/api/reference/#remove-blocked-term */
	export type RemoveBlockedTerm = ResponseBody<204>;
	/** https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token */
	export interface OAuth2Validate extends ResponseBody {
		client_id: string;
		login: string;
		scopes: string[];
		user_id: string;
		expires_in: number;
	}
	/** https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-tokens */
	export type OAuth2Revoke = ResponseBody;
	/** https://dev.twitch.tv/docs/api/reference/#get-users */
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
	/** https://dev.twitch.tv/docs/api/reference/#send-chat-message */
	export interface SendChatMessage extends ResponseBody {
		data: {
			/** The message id for the message that was sent. */
			message_id: string;
			/** If the message passed all checks and was sent. */
			is_sent: boolean;
			/** The reason the message was dropped, if any. */
			drop_reason: {
				/** Code for why the message was dropped. */
				code: string;
				/** Message for why the message was dropped. */
				message: string;
			} | null;
		};
	}
	/** https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription */
	export interface CreateEventSubSubscription<Subscription extends EventSub.Subscription = EventSub.Subscription> extends ResponseBody<202> {
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
			type: Subscription["type"];
			/** The version number that identifies this definition of the subscription’s data. */
			version: Subscription["version"];
			/** The subscription’s parameter values. */
			condition: Subscription["condition"];
			/** The date and time (in RFC3339 format) of when the subscription was created. */
			created_at: string;
			/** The transport details used to send the notifications. */
			transport: EventSub.Subscription.Transport.CreateEventSubSubscription;
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
	/** https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription */
	export type DeleteEventSubSubscription = ResponseBody<204>;
	/** https://dev.twitch.tv/docs/api/reference/#modify-channel-information */
	export type ModifyChannelInformation = ResponseBody<204>;
	/** https://dev.twitch.tv/docs/api/reference/#search-categories */
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
}

export interface ResponseBodyError<Status extends number = number> extends ResponseBody<400 | Status | 500> {
	/** The error message of request. */
	message: string;
}
export namespace ResponseBodyError {
	/** https://dev.twitch.tv/docs/api/reference/#get-blocked-terms */
	export type GetBlockedTerms = ResponseBodyError<401 | 403>;
	/** https://dev.twitch.tv/docs/api/reference/#add-blocked-term */
	export type AddBlockedTerm = ResponseBodyError<401 | 403>;
	/** https://dev.twitch.tv/docs/api/reference/#remove-blocked-term */
	export type RemoveBlockedTerm = ResponseBodyError<401 | 403>;
	/** https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token */
	export interface OAuth2Validate extends ResponseBodyError<401> {
		access_token: string;
	}
	/** https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-token */
	export type OAuth2Revoke = ResponseBodyError<404>;
	/** https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription */
	export type CreateEventSubSubscription = ResponseBodyError<401 | 403 | 409 | 429>;
	/** https://dev.twitch.tv/docs/api/reference/#get-users */
	export type GetUsers = ResponseBodyError<401>;
	/** https://dev.twitch.tv/docs/api/reference/#send-chat-message */
	export type SendChatMessage = ResponseBodyError<401 | 403 | 422>;
	/** https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription */
	export type DeleteEventSubSubscription = ResponseBodyError<401 | 404>;
	/** https://dev.twitch.tv/docs/api/reference/#modify-channel-information */
	export type ModifyChannelInformation = ResponseBodyError<401 | 403 | 409>;
	/** https://dev.twitch.tv/docs/api/reference/#search-categories */
	export type SearchCategories = ResponseBodyError<401>;
}

export namespace Request {
	/**
	 * Gets the broadcaster’s list of non-private, blocked words or phrases. These are the terms that the broadcaster or moderator added manually or that were denied by AutoMod. [Read More](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:blocked_terms** or **moderator:manage:blocked_terms** scope
	 * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
	 * @param moderator_id 	The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value
	 */
	export async function GetBlockedTerms(client_id: string, access_token: string, broadcaster_id: string, moderator_id: string, first?: string, after?: string, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/moderation/blocked_terms";
			if (!init) init = {};
			if (!init.method) init.method = "GET";
			if (!init.headers) init.headers = {
				"Authorization": `Bearer ${access_token}`,
				"Client-Id": client_id,
				"Content-Type": "application/json"
			};
			if (!init.search) init.search = {broadcaster_id, moderator_id, first, after};

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			return response as ResponseBody.GetBlockedTerms | ResponseBodyError.GetBlockedTerms;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.GetBlockedTerms;
		}
	}
	/**
	 * Adds a word or phrase to the broadcaster’s list of blocked terms. These are the terms that the broadcaster doesn’t want used in their chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:blocked_terms** or **moderator:manage:blocked_terms** scope.
	 * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
	 * @param moderator_id 	The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token
	 * @param text The word or phrase to block from being used in the broadcaster’s chat room. The term must contain a minimum of 2 characters and may contain up to a maximum of 500 characters. Terms may include a wildcard character (*). The wildcard character must appear at the beginning or end of a word or set of characters. For example, \*foo or foo\*. If the blocked term already exists, the response contains the existing blocked term
	 */
	export async function AddBlockedTerm(client_id: string, access_token: string, broadcaster_id: string, moderator_id: string, text: string, init?: RequestInit) {
		try {
			if (text.length < 2) throw "The length of the term in the text field is too short. The term must contain a minimum of 2 characters.";
			if (text.length > 500) throw "The length of the term in the text field is too long. The term may contain up to a maximum of 500 characters.";

			const url = "https://api.twitch.tv/helix/moderation/blocked_terms";
			if (!init) init = {};
			if (!init.method) init.method = "POST";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`,
				"Content-Type": "application/json"
			};
			if (!init.search) init.search = {broadcaster_id, moderator_id};
			if (!init.body) init.body = JSON.stringify({text});

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			if (response.status === 200) response.data = response.data[0];
			return response as ResponseBody.AddBlockedTerm | ResponseBodyError.AddBlockedTerm;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.AddBlockedTerm;
		}
	}
	/**
	 * Removes the word or phrase from the broadcaster’s list of blocked terms. [Read More](https://dev.twitch.tv/docs/api/reference/#remove-blocked-term)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope
	 * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
	 * @param moderator_id 	The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token
	 * @param id The ID of the blocked term to remove from the broadcaster’s list of blocked terms
	 */
	export async function RemoveBlockedTerm(client_id: string, access_token: string, broadcaster_id: string, moderator_id: string, id: string, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/moderation/blocked_terms";
			if (!init) init = {};
			if (!init.method) init.method = "DELETE";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`
			};
			if (!init.search) init.search = {broadcaster_id, moderator_id, id};

			const request = await fetch(url, init);
			if (request.status === 204) return {status: 204} as ResponseBody.RemoveBlockedTerm;
			else return await request.json() as ResponseBodyError.RemoveBlockedTerm;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.RemoveBlockedTerm;
		}
	}
	/**
	 * Validates access token and if its valid, returns data of it. [Read More](https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token)
	 * @param access_token The access token to validate
	 */
	export async function OAuth2Validate(access_token: string, init?: RequestInit) {
		try {
			if (access_token.length < 1) return {status: 401, message: "invalid access token"} as ResponseBodyError.OAuth2Validate;

			const url = "https://id.twitch.tv/oauth2/validate";
			if (!init) init = {};
			if (!init.method) init.method = "GET";
			if (!init.headers) init.headers = {
				"Authorization": `Bearer ${access_token}`
			};

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			return response as ResponseBody.OAuth2Validate | ResponseBodyError.OAuth2Validate;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.OAuth2Validate;
		}
	}
	/**
	 * If your app no longer needs an access token, you can revoke it by this method. [Read More](https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-token)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token The access token to revoke
	 */
	export async function OAuth2Revoke(client_id: string, access_token: string, init?: RequestInit) {
		try {
			if (access_token.length < 1) throw "invalid access token";

			const url = "https://id.twitch.tv/oauth2/revoke";
			if (!init) init = {};
			if (!init.method) init.method = "POST";
			if (!init.headers) init.headers = {
				"Content-Type": "application/x-www-form-urlencoded"
			};
			if (!init.search) init.search = {client_id, token: access_token};

			const request = await fetch(url, init);
			if (request.status === 200) return {status: 200} as ResponseBody.OAuth2Revoke;
			else return await request.json() as ResponseBodyError.OAuth2Revoke;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.OAuth2Revoke;
		}
	}
	/**
	 * Creates an EventSub subscription. [Read More](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token
	 * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token. If the subscription type requires user authorization, the user must have granted your app (client ID) permissions to receive those events before you subscribe to them. For example, to subscribe to [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe) events, your app must get a user access token that includes the `channel:read:subscriptions` scope, which adds the required permission to your app access token’s client ID
	 * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. If the subscription type requires user authorization, the token must include the required scope. However, if the subscription type doesn’t include user authorization, the token may include any scopes or no scopes
	 * 3. If you use [Conduits to receive events](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/), the request must specify an app access token. The request will fail if you use a user access token
	 * @param subscription `EventSub.Subscription` type to subscribe
	 */
	export async function CreateEventSubSubscription<Subscription extends EventSub.Subscription>(client_id: string, access_token: string, subscription: Subscription, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/eventsub/subscriptions";
			if (!init) init = {};
			if (!init.method) init.method = "POST";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`,
				"Content-Type": "application/json"
			};
			if (!init.body) init.body = JSON.stringify(subscription);

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			if (response.status === 202) response.data = response.data[0];

			return response as ResponseBody.CreateEventSubSubscription<Subscription> | ResponseBodyError.CreateEventSubSubscription;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.CreateEventSubSubscription;
		}
	}
	/**
	 * Deletes an EventSub subscription. [Read More(https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token
	 * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token
	 * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes
	 * @param id The ID of the subscription to delete
	 */
	export async function DeleteEventSubSubscription(client_id: string, access_token: string, id: string, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/eventsub/subscriptions";
			if (!init) init = {};
			if (!init.method) init.method = "DELETE";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`,
				"Content-Type": "application/json"
			};
			if (!init.search) init.search = {id};

			const request = await fetch(url, init);
			if (request.status === 204) return {status: 204} as ResponseBody.DeleteEventSubSubscription;
			else return await request.json() as ResponseBodyError.DeleteEventSubSubscription;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.DeleteEventSubSubscription;
		}
	}
	/**
	 * Gets information about one or more users. [Read More](https://dev.twitch.tv/docs/api/reference/#get-users)
	 * 1. You may look up users using their user ID, login name, or both but the sum total of the number of users you may look up is 100. For example, you may specify 50 IDs and 50 names or 100 IDs or names, but you cannot specify 100 IDs and 100 names.
	 * 2. If you don’t specify IDs or login names, the request returns information about the user in the access token if you specify a user access token.
	 * 3. To include the user’s verified email address in the response, you must use a user access token that includes the **user:read:email** scope.
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param id The ID of the user to get. To specify more than one user, include the id parameter for each user to get. For example, `id=1234&id=5678`. The maximum number of IDs you may specify is 100
	 * @param login The login name of the user to get. To specify more than one user, include the login parameter for each user to get. For example, `login=foo&login=bar`. The maximum number of login names you may specify is 100
	 */
	export async function GetUsers(client_id: string, access_token: string, id?: string, login?: string, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/users";
			if (!init) init = {};
			if (!init.method) init.method = "GET";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`
			};
			if (!init.search) init.search = {id, login};

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			return response as ResponseBody.GetUsers | ResponseBodyError.GetUsers;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.GetUsers;
		}
	}
	/**
	 * Sends a message to the broadcaster’s chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#send-chat-message)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the `user:write:chat` scope. If app access token used, then additionally requires `user:bot` scope from chatting user, and either `channel:bot` scope from broadcaster or moderator status
	 * @param broadcaster_id The ID of the broadcaster whose chat room the message will be sent to
	 * @param sender_id The ID of the user sending the message. This ID must match the user ID in the user access token
	 * @param message The message to send. The message is limited to a maximum of 500 characters. Chat messages can also include emoticons. To include emoticons, use the name of the emote. The names are case sensitive. Don’t include colons around the name (e.g., :bleedPurple:). If Twitch recognizes the name, Twitch converts the name to the emote before writing the chat message to the chat room
	 * @param reply_parent_message_id The ID of the chat message being replied to
	 */
	export async function SendChatMessage(client_id: string, access_token: string, broadcaster_id: string, sender_id: string, message: string, reply_parent_message_id?: string, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/chat/messages";
			if (!init) init = {};
			if (!init.method) init.method = "POST";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`,
				"Content-Type": "application/json"
			};
			if (!init.search) init.search = {broadcaster_id, sender_id, message, reply_parent_message_id};

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			if (response.status === 200) response.data = response.data[0];
			return response as ResponseBody.SendChatMessage | ResponseBodyError.SendChatMessage;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.SendChatMessage;
		}
	}
	/**
	 * Updates a channel’s properties. [Read More](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:broadcast** scope
	 * @param broadcaster_id The ID of the broadcaster whose channel you want to update. This ID must match the user ID in the user access token
	 * @param body All fields are optional, but you must specify at least one field
	 */
	export async function ModifyChannelInformation(client_id: string, access_token: string, broadcaster_id: string, body: RequestBody.ModifyChannelInformation, init?: RequestInit) {
		try {
			if (Object.keys(body).length === 0) throw `You must specify at least one field in request body!`;

			const url = "https://api.twitch.tv/helix/channels";
			if (!init) init = {};
			if (!init.method) init.method = "PATCH";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`,
				"Content-Type": "application/json"
			};
			if (!init.search) init.search = {broadcaster_id};
			if (!init.body) init.body = JSON.stringify(body);

			const request = await fetch(url, init);
			if (request.status === 204) return {status: 204} as ResponseBody.ModifyChannelInformation;
			else return await request.json() as ResponseBodyError.ModifyChannelInformation;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.ModifyChannelInformation;
		}
	}
	/** Gets the games or categories that match the specified query. [Read More](https://dev.twitch.tv/docs/api/reference/#search-categories)
	 * - To match, the category’s name must contain all parts of the query string. For example, if the query string is 42, the response includes any category name that contains 42 in the title. If the query string is a phrase like *love computer*, the response includes any category name that contains the words love and computer anywhere in the name. The comparison is case insensitive.
	 * @param client_id Your app’s client ID. See [Registering your app](https://dev.twitch.tv/docs/authentication/register-app)
	 * @param access_token [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
	 * @param query The search string
	 * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
	 * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
	 */
	export async function SearchCategories(client_id: string, access_token: string, query: string, first?: number, after?: string, init?: RequestInit) {
		try {
			const url = "https://api.twitch.tv/helix/search/categories";
			if (!init) init = {};
			if (!init.method) init.method = "GET";
			if (!init.headers) init.headers = {
				"Client-Id": client_id,
				"Authorization": `Bearer ${access_token}`,
				"Content-Type": "application/json"
			};
			if (!init.search) init.search = {query, first, after};

			const request = await fetch(url, init);
			const response: any = await request.json();
			response.status = request.status;
			return response as ResponseBody.SearchCategories | ResponseBodyError.SearchCategories;
		} catch(e) {
			return {status: 400, message: e.toString()} as ResponseBodyError.SearchCategories;
		}
	} 
}