class FetchBuilder {
    constructor(url, method) {
        this.url = "";
        this.search = {};
        this.hash = {};
        this.headers = {};
        this.method = "GET";
        this.body = null;
        this.abort_controller = null;
        this.timeout = FetchBuilder.global_timeout;
        this.url = url;
        if (method)
            this.method = method;
    }
    /** @param search URL search/query parameters */
    setSearch(search) {
        for (const [k, v] of Object.entries(search))
            if (v)
                this.search[encodeURI(k)] = Array.isArray(v) ? v.map(vv => encodeURI(`${vv}`)) : encodeURI(`${v}`);
        return this;
    }
    /** @param hash URL hash/fragment parameters */
    setHash(hash) {
        for (const [k, v] of Object.entries(hash))
            if (v)
                this.hash[encodeURI(k)] = Array.isArray(v) ? v.map(vv => encodeURI(`${vv}`)) : encodeURI(`${v}`);
        return this;
    }
    /** @param headers an object literal to set request's headers. */
    setHeaders(headers) {
        for (const [k, v] of Object.entries(headers))
            if (v)
                this.headers[k] = `${v}`;
        return this;
    }
    setMethod(method) {
        this.method = method ?? "GET";
        return this;
    }
    setBody(body) {
        if (typeof body === "string")
            this.body = body;
        else if (body)
            this.body = JSON.stringify(body);
        else
            this.body = body;
        return this;
    }
    /** @param abort_controller if not `null`, RequestTimeout will be disabled */
    setAbortController(abort_controller) {
        this.abort_controller = abort_controller;
        return this;
    }
    /** @param timeout in milliseconds, if `false`, RequestTimeout will be disabled */
    setTimeout(timeout) {
        this.timeout = timeout === false ? 0 : timeout;
        return this;
    }
    /** @param timeout in milliseconds, if `false`, RequestTimeout will be disabled */
    static setGlobalTimeout(timeout) {
        this.global_timeout = timeout === false ? 0 : timeout;
    }
    fetch() {
        var url = this.url;
        var added = false;
        var postfix = "?";
        for (const [k, v] of Object.entries(this.search)) {
            if (Array.isArray(v))
                for (const v_entry of v)
                    postfix += `${k}=${v_entry}&`;
            else
                postfix += `${k}=${v}&`;
            added = true;
        }
        if (added)
            url += postfix.substring(0, postfix.length - 1);
        added = false;
        postfix = "#";
        for (const [k, v] of Object.entries(this.hash)) {
            if (Array.isArray(v))
                for (const v_entry of v)
                    postfix += `${k}=${v_entry}&`;
            else
                postfix += `${k}=${v}&`;
            added = true;
        }
        if (added)
            url += postfix.substring(0, postfix.length - 1);
        const init = {};
        init.method = this.method;
        init.headers = this.headers;
        if (this.body)
            init.body = this.body;
        if (this.abort_controller)
            init.signal = this.abort_controller.signal;
        else if (this.timeout > 0) {
            const controller = new AbortController();
            init.signal = controller.signal;
        }
        return fetch(url, init);
    }
}
FetchBuilder.global_timeout = 5000;
export var EventSub;
(function (EventSub) {
    /**
     * Starts WebSocket for subscribing and getting EventSub events
     * - Reconnects in `reconnect_ms`, if WebSocket was closed
     * - Reconnects immediately, if gets `session_reconnect` message
     * - When getting not first `session_welcome` message when `reconnect_url` is `false` or when recreating ws session (if your app is reopened or internet was down), please delete old events via `Request.DeleteEventSubSubscription`, you will need a id of subscription, store it somewhere
     * @param reconnect_ms If less then `1`, WebSocket will be not reconnected after `onClose()`, default value is `500`
     */
    function startWebSocket(token_data, reconnect_ms) {
        if (!reconnect_ms)
            reconnect_ms = 500;
        const connection = new Connection(new WebSocket(EventSub.WebSocketURL), token_data);
        var previous_message_id;
        function giveCloseCodeToClient(code = 1000, reason = "client disconnected") {
            connection.ws.onclose?.({ code, reason });
            connection.ws.onclose = () => { };
            connection.ws.close();
        }
        function storeFirstConnectedTimestamp(e) {
            const date = new Date();
            connection.first_connected_timestamp_iso = date.toISOString();
            connection.first_connected_timestamp = date.getTime();
        }
        async function onMessage(e) {
            if (connection.keepalive_timeout) {
                clearTimeout(connection.keepalive_timeout);
                delete connection.keepalive_timeout;
            }
            const message = JSON.parse(e.data);
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
                connection.keepalive_timeout = setTimeout(() => giveCloseCodeToClient(4005, `client doesn't received any message within ${connection.session.keepalive_timeout_seconds} seconds`), (connection.session.keepalive_timeout_seconds + 2) * 1000);
                connection.onSessionKeepalive(message);
            }
            else if (Message.isSessionReconnect(message)) {
                connection.session = message.payload.session;
                connection.ws_old = connection.ws;
                connection.ws_old.onmessage = () => { };
                connection.ws_old.onclose = () => { };
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
        async function onClose(e) {
            setTimeout(() => {
                connection.ws = new WebSocket(EventSub.WebSocketURL);
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
    EventSub.startWebSocket = startWebSocket;
    EventSub.WebSocketURL = "wss://eventsub.wss.twitch.tv/ws";
    class Connection {
        /** Returns connected timestamp of this websocket in ISO format (session_reconnect will reset this) */
        getConnectedTimestampISO() {
            return this.session.connected_at;
        }
        /** Returns connected timestamp of this websocket (session_reconnect will reset this) */
        getConnectedTimestamp() {
            return new Date(this.getConnectedTimestampISO()).getTime();
        }
        constructor(ws, authorization) {
            this.ws = ws;
            this.authorization = authorization;
        }
        /**
         * Calls on closing WebSocket
         * @param code WebSocket connection close code
         * @param reason WebSocket connection close reason
         */
        async onClose(code, reason) { }
        /** Calls on getting any EventSub message, any specified message callback will be called **after** this callback */
        async onMessage(message) { }
        /**
         * Calls on getting `session_welcome` message. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#welcome-message)
         * - For subscribing to events with `Request.CreateEventSubSubscription`, you must use it **only** if `is_reconnected` is `false`, because after reconnecting new connection will include the same subscriptions that the old connection had
         * @param is_reconnected **DO NOT** subscribe to events if its `true`!
         */
        async onSessionWelcome(message, is_reconnected) { }
        /** Calls on getting `session_keepalive` message, these messages indicates that the WebSocket connection is healthy. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#keepalive-message) */
        async onSessionKeepalive(message) { }
        /** Calls on getting `notification` message, these messages are sent when an event that you subscribe to occurs. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#notification-message) */
        async onNotification(message) { }
        /** Calls on getting `session_reconnect` message, these messages are sent if the edge server that the client is connected to needs to be swapped. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#reconnect-message) */
        async onSessionReconnect(message) { }
        /** Calls on getting `revocation` message, these messages are sent if Twitch revokes a subscription. [Read More](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#revocation-message) */
        async onRevocation(message) { }
        /** Closes the connection with code `1000` */
        async close() {
            await this.onClose(1000, `client closed the connection`);
            this.ws.onclose = _ => { };
            this.ws.onmessage = _ => { };
            this.ws.close();
        }
    }
    EventSub.Connection = Connection;
    (function (Connection) {
        function is(connection) {
            return connection.ws != null && connection.authorization != null;
        }
        Connection.is = is;
    })(Connection = EventSub.Connection || (EventSub.Connection = {}));
    let Transport;
    (function (Transport) {
        /**
         * @param callback The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. See [Processing an event](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#processing-an-event). **NOTE**: Redirects are not followed.
         * @param secret The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. For information about how the secret is used, see [Verifying the event message](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#verifying-the-event-message).
         */
        function WebHook(callback, secret) { return { method: "webhook", callback, secret }; }
        Transport.WebHook = WebHook;
        /** @param session_id An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message) */
        function WebSocket(session_id) { return { method: "websocket", session_id }; }
        Transport.WebSocket = WebSocket;
        /** @param conduit_id An ID that identifies the conduit to send notifications to. When you create a conduit, the server returns the conduit ID. */
        function Conduit(conduit_id) { return { method: "conduit", conduit_id }; }
        Transport.Conduit = Conduit;
    })(Transport = EventSub.Transport || (EventSub.Transport = {}));
    let Subscription;
    (function (Subscription) {
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the broadcaster (channel).
         */
        function AutomodMessageHold(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "automod.message.hold", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "automod.message.hold", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.AutomodMessageHold = AutomodMessageHold;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the broadcaster (channel).
         */
        function AutomodMessageHoldV2(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "automod.message.hold", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "automod.message.hold", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.AutomodMessageHoldV2 = AutomodMessageHoldV2;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the broadcaster (channel). Maximum: 1.
         */
        function AutomodMessageUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "automod.message.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "automod.message.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.AutomodMessageUpdate = AutomodMessageUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the broadcaster (channel). Maximum: 1.
         */
        function AutomodMessageUpdateV2(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "automod.message.update", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "automod.message.update", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.AutomodMessageUpdateV2 = AutomodMessageUpdateV2;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the broadcaster (channel). Maximum: 1.
         */
        function AutomodSettingsUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "automod.settings.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "automod.settings.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.AutomodSettingsUpdate = AutomodSettingsUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the broadcaster (channel).
         */
        function AutomodTermsUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "automod.terms.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "automod.terms.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.AutomodTermsUpdate = AutomodTermsUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The user ID of the channel broadcaster. Maximum: 1.
         */
        function ChannelBitsUse(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.bits.use", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.bits.use", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelBitsUse = ChannelBitsUse;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get updates for.
         */
        function ChannelUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.update", version: "2", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.update", version: "2", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelUpdate = ChannelUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get follow notifications for.
         */
        function ChannelFollow(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.follow", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.follow", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelFollow = ChannelFollow;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_id The ID of the broadcaster that you want to get Channel Ad Break begin notifications for. Maximum: 1
         */
        function ChannelAdBreakBegin(connection, broadcaster_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.ad_break.begin", version: "1", condition: { broadcaster_id } };
            else
                return { transport: connection.transport, type: "channel.ad_break.begin", version: "1", condition: { broadcaster_id } };
        }
        Subscription.ChannelAdBreakBegin = ChannelAdBreakBegin;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat clear events for.
         */
        function ChannelChatClear(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.clear", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.clear", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatClear = ChannelChatClear;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat clear user messages events for.
         */
        function ChannelChatClearUserMessages(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.clear_user_messages", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.clear_user_messages", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatClearUserMessages = ChannelChatClearUserMessages;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id The User ID of the channel to receive chat message events for.
         */
        function ChannelChatMessage(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.message", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.message", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatMessage = ChannelChatMessage;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat message delete events for.
         */
        function ChannelChatMessageDelete(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.message_delete", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.message_delete", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatMessageDelete = ChannelChatMessageDelete;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat notification events for.
         */
        function ChannelChatNotification(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.notification", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.notification", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatNotification = ChannelChatNotification;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat settings update events for.
         */
        function ChannelChatSettingsUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat_settings.update", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat_settings.update", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatSettingsUpdate = ChannelChatSettingsUpdate;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat message events for.
         */
        function ChannelChatUserMessageHold(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.user_message_hold", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.user_message_hold", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatUserMessageHold = ChannelChatUserMessageHold;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `user_id` — The user ID to read chat as.
         * @param broadcaster_user_id User ID of the channel to receive chat message events for.
         */
        function ChannelChatUserMessageUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.chat.user_message_update", version: "1", condition: { broadcaster_user_id, user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.chat.user_message_update", version: "1", condition: { broadcaster_user_id, user_id: connection.user_id } };
        }
        Subscription.ChannelChatUserMessageUpdate = ChannelChatUserMessageUpdate;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The User ID of the channel to receive shared chat session begin events for.
         */
        function ChannelSharedChatSessionBegin(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shared_chat.begin", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.shared_chat.begin", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSharedChatSessionBegin = ChannelSharedChatSessionBegin;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The User ID of the channel to receive shared chat session update events for.
         */
        function ChannelSharedChatSessionUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shared_chat.update", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.shared_chat.update", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSharedChatSessionUpdate = ChannelSharedChatSessionUpdate;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The User ID of the channel to receive shared chat session end events for.
         */
        function ChannelSharedChatSessionEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shared_chat.end", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.shared_chat.end", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSharedChatSessionEnd = ChannelSharedChatSessionEnd;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get subscribe notifications for.
         */
        function ChannelSubscribe(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.subscribe", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.subscribe", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSubscribe = ChannelSubscribe;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get subscription end notifications for.
         */
        function ChannelSubscriptionEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.subscription.end", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.subscription.end", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSubscriptionEnd = ChannelSubscriptionEnd;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get subscription gift notifications for.
         */
        function ChannelSubscriptionGift(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.subscription.gift", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.subscription.gift", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSubscriptionGift = ChannelSubscriptionGift;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get resubscription chat message notifications for.
         */
        function ChannelSubscriptionMessage(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.subscription.message", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.subscription.message", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelSubscriptionMessage = ChannelSubscriptionMessage;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get cheer notifications for.
         */
        function ChannelCheer(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.cheer", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.cheer", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelCheer = ChannelCheer;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param condition The condition of this subscription type.
         */
        function ChannelRaid(connection, condition) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.raid", version: "1", condition };
            else
                return { transport: connection.transport, type: "channel.raid", version: "1", condition };
        }
        Subscription.ChannelRaid = ChannelRaid;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get ban notifications for.
         */
        function ChannelBan(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.ban", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.ban", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelBan = ChannelBan;
        /**
         * @param connection
         * If using `Connection` object, `user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get unban notifications for.
         */
        function ChannelUnban(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.unban", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.unban", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelUnban = ChannelUnban;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The ID of the broadcaster you want to get chat unban request notifications for. Maximum: 1.
         */
        function ChannelUnbanRequestCreate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.unban_request.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.unban_request.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelUnbanRequestCreate = ChannelUnbanRequestCreate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The ID of the broadcaster you want to get unban request resolution notifications for. Maximum: 1.
         */
        function ChannelUnbanRequestResolve(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.unban_request.resolve", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.unban_request.resolve", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelUnbanRequestResolve = ChannelUnbanRequestResolve;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The user ID of the broadcaster.
         */
        function ChannelModerate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.moderate", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.moderate", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelModerate = ChannelModerate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The user ID of the broadcaster.
         */
        function ChannelModerateV2(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.moderate", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.moderate", version: "2", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelModerateV2 = ChannelModerateV2;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get moderator addition notifications for.
         */
        function ChannelModeratorAdd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.moderator.add", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.moderator.add", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelModeratorAdd = ChannelModeratorAdd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to get moderator removal notifications for.
         */
        function ChannelModeratorRemove(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.moderator.remove", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.moderator.remove", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelModeratorRemove = ChannelModeratorRemove;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
         */
        function ChannelGuestStarSessionBegin(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.guest_star_session.begin", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.guest_star_session.begin", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelGuestStarSessionBegin = ChannelGuestStarSessionBegin;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
         */
        function ChannelGuestStarSessionEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.guest_star_session.end", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.guest_star_session.end", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelGuestStarSessionEnd = ChannelGuestStarSessionEnd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
         */
        function ChannelGuestStarGuestUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.guest_star_guest.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.guest_star_guest.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelGuestStarGuestUpdate = ChannelGuestStarGuestUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID of the channel hosting the Guest Star Session.
         */
        function ChannelGuestStarSettingsUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.guest_star_settings.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.guest_star_settings.update", version: "beta", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelGuestStarSettingsUpdate = ChannelGuestStarSettingsUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points reward add notifications for.
         */
        function ChannelPointsAutomaticRewardRedemptionAdd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPointsAutomaticRewardRedemptionAdd = ChannelPointsAutomaticRewardRedemptionAdd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points reward add notifications for.
         */
        function ChannelPointsAutomaticRewardRedemptionAddV2(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "2", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_automatic_reward_redemption.add", version: "2", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPointsAutomaticRewardRedemptionAddV2 = ChannelPointsAutomaticRewardRedemptionAddV2;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward add notifications for.
         */
        function ChannelPointsCustomRewardAdd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_custom_reward.add", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_custom_reward.add", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPointsCustomRewardAdd = ChannelPointsCustomRewardAdd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward update notifications for.
         * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
         */
        function ChannelPointsCustomRewardUpdate(connection, broadcaster_user_id, reward_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_custom_reward.update", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_custom_reward.update", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPointsCustomRewardUpdate = ChannelPointsCustomRewardUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward remove notifications for.
         * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
         */
        function ChannelPointsCustomRewardRemove(connection, broadcaster_user_id, reward_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_custom_reward.remove", version: "1", condition: { broadcaster_user_id, reward_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_custom_reward.remove", version: "1", condition: { broadcaster_user_id, reward_id } };
        }
        Subscription.ChannelPointsCustomRewardRemove = ChannelPointsCustomRewardRemove;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward redemption add notifications for.
         * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
         */
        function ChannelPointsCustomRewardRedemptionAdd(connection, broadcaster_user_id, reward_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition: { broadcaster_user_id, reward_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition: { broadcaster_user_id, reward_id } };
        }
        Subscription.ChannelPointsCustomRewardRedemptionAdd = ChannelPointsCustomRewardRedemptionAdd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive channel points custom reward redemption update notifications for.
         * @param reward_id Optional. Specify a reward id to only receive notifications for a specific reward.
         */
        function ChannelPointsCustomRewardRedemptionUpdate(connection, broadcaster_user_id, reward_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.update", version: "1", condition: { broadcaster_user_id, reward_id } };
            else
                return { transport: connection.transport, type: "channel.channel_points_custom_reward_redemption.update", version: "1", condition: { broadcaster_user_id, reward_id } };
        }
        Subscription.ChannelPointsCustomRewardRedemptionUpdate = ChannelPointsCustomRewardRedemptionUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “poll begin” notifications will be received.
         */
        function ChannelPollBegin(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.poll.begin", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.poll.begin", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPollBegin = ChannelPollBegin;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “poll progress” notifications will be received.
         */
        function ChannelPollProgress(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.poll.progress", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.poll.progress", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPollProgress = ChannelPollProgress;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “poll end” notifications will be received.
         */
        function ChannelPollEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.poll.end", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.poll.end", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPollEnd = ChannelPollEnd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction begin” notifications will be received.
         */
        function ChannelPredictionBegin(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.prediction.begin", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.prediction.begin", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPredictionBegin = ChannelPredictionBegin;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction progress” notifications will be received.
         */
        function ChannelPredictionProgress(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.prediction.progress", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.prediction.progress", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPredictionProgress = ChannelPredictionProgress;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction lock” notifications will be received.
         */
        function ChannelPredictionLock(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.prediction.lock", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.prediction.lock", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPredictionLock = ChannelPredictionLock;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID of the channel for which “prediction end” notifications will be received.
         */
        function ChannelPredictionEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.prediction.end", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.prediction.end", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelPredictionEnd = ChannelPredictionEnd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the channel to receive chat unban request notifications for.
         */
        function ChannelSuspiciousUserUpdate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.suspicious_user.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.suspicious_user.update", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelSuspiciousUserUpdate = ChannelSuspiciousUserUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id User ID of the channel to receive chat message events for.
         */
        function ChannelSuspiciousUserMessage(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.suspicious_user.message", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.suspicious_user.message", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelSuspiciousUserMessage = ChannelSuspiciousUserMessage;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The User ID of the broadcaster (channel) Maximum: 1
         */
        function ChannelVipAdd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.vip.add", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.vip.add", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelVipAdd = ChannelVipAdd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The User ID of the broadcaster (channel) Maximum: 1
         */
        function ChannelVipRemove(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.vip.remove", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.vip.remove", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelVipRemove = ChannelVipRemove;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The User ID of the broadcaster.
         */
        function ChannelWarningAcknowledge(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.warning.acknowledge", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.warning.acknowledge", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelWarningAcknowledge = ChannelWarningAcknowledge;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The User ID of the broadcaster.
         */
        function ChannelWarningSend(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.warning.send", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.warning.send", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelWarningSend = ChannelWarningSend;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster whose charity campaign donations you want to receive notifications for.
         */
        function ChannelCharityCampaignDonate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.charity_campaign.donate", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.charity_campaign.donate", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelCharityCampaignDonate = ChannelCharityCampaignDonate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster whose charity campaign start events you want to receive notifications for.
         */
        function ChannelCharityCampaignStart(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.charity_campaign.start", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.charity_campaign.start", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelCharityCampaignStart = ChannelCharityCampaignStart;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster whose charity campaign progress events you want to receive notifications for.
         */
        function ChannelCharityCampaignProgress(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.charity_campaign.progress", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.charity_campaign.progress", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelCharityCampaignProgress = ChannelCharityCampaignProgress;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster whose charity campaign stop events you want to receive notifications for.
         */
        function ChannelCharityCampaignStop(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.charity_campaign.stop", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.charity_campaign.stop", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelCharityCampaignStop = ChannelCharityCampaignStop;
        /**
         * @param connection
         * If using `Connection` object, `client_id` gets from `authorization.client_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `client_id` — Your application’s client id. The provided client_id must match the client ID in the application access token.
         * @param conduit_id Optional. The conduit ID to receive events for. If omitted, events for all of this client’s conduits are sent.
         */
        function ConduitShardDisabled(connection, conduit_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "conduit.shard.disabled", version: "1", condition: { client_id: connection.authorization.client_id, conduit_id } };
            else
                return { transport: connection.transport, type: "conduit.shard.disabled", version: "1", condition: { client_id: connection.client_id, conduit_id } };
        }
        Subscription.ConduitShardDisabled = ConduitShardDisabled;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param organization_id The organization ID of the organization that owns the game on the developer portal.
         * @param category_id Optional. The category (or game) ID of the game for which entitlement notifications will be received.
         * @param campaign_id Optional. The campaign ID for a specific campaign for which entitlement notifications will be received.
         */
        function DropEntitlementGrant(connection, organization_id, category_id, campaign_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "drop.entitlement.grant", version: "1", condition: { organization_id, category_id, campaign_id } };
            else
                return { transport: connection.transport, type: "drop.entitlement.grant", version: "1", condition: { organization_id, category_id, campaign_id } };
        }
        Subscription.DropEntitlementGrant = DropEntitlementGrant;
        /**
         * @param connection
         * If using `Connection` object, `extension_client_id` gets from `authorization.client_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `extension_client_id` — The client ID of the extension.
         */
        function ExtensionBitsTransactionCreate(connection) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "extension.bits_transaction.create", version: "1", condition: { extension_client_id: connection.authorization.client_id } };
            else
                return { transport: connection.transport, type: "extension.bits_transaction.create", version: "1", condition: { extension_client_id: connection.extension_client_id } };
        }
        Subscription.ExtensionBitsTransactionCreate = ExtensionBitsTransactionCreate;
        /**
         * @param connection
         * If using `Connection` object, `broadcaster_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `broadcaster_user_id` — The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token.
         */
        function ChannelGoalBegin(connection) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.goal.begin", version: "1", condition: { broadcaster_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.goal.begin", version: "1", condition: { broadcaster_user_id: connection.broadcaster_user_id } };
        }
        Subscription.ChannelGoalBegin = ChannelGoalBegin;
        /**
         * @param connection
         * If using `Connection` object, `broadcaster_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `broadcaster_user_id` — The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token.
         */
        function ChannelGoalProgress(connection) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.goal.progress", version: "1", condition: { broadcaster_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.goal.progress", version: "1", condition: { broadcaster_user_id: connection.broadcaster_user_id } };
        }
        Subscription.ChannelGoalProgress = ChannelGoalProgress;
        /**
         * @param connection
         * If using `Connection` object, `broadcaster_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `broadcaster_user_id` — The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token.
         */
        function ChannelGoalEnd(connection) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.goal.end", version: "1", condition: { broadcaster_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.goal.end", version: "1", condition: { broadcaster_user_id: connection.broadcaster_user_id } };
        }
        Subscription.ChannelGoalEnd = ChannelGoalEnd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster that you want to get Hype Train begin notifications for.
         */
        function ChannelHypeTrainBegin(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.hype_train.begin", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.hype_train.begin", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelHypeTrainBegin = ChannelHypeTrainBegin;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster that you want to get Hype Train progress notifications for.
         */
        function ChannelHypeTrainProgress(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.hype_train.progress", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.hype_train.progress", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelHypeTrainProgress = ChannelHypeTrainProgress;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The ID of the broadcaster that you want to get Hype Train end notifications for.
         */
        function ChannelHypeTrainEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.hype_train.end", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "channel.hype_train.end", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.ChannelHypeTrainEnd = ChannelHypeTrainEnd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The ID of the broadcaster whose Shield Mode status was updated.
         */
        function ChannelShieldModeBegin(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shield_mode.begin", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.shield_mode.begin", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelShieldModeBegin = ChannelShieldModeBegin;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The ID of the broadcaster whose Shield Mode status was updated.
         */
        function ChannelShieldModeEnd(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shield_mode.end", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.shield_mode.end", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelShieldModeEnd = ChannelShieldModeEnd;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive Shoutout create notifications for.
         */
        function ChannelShoutoutCreate(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shoutout.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.shoutout.create", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelShoutoutCreate = ChannelShoutoutCreate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `moderator_user_id` — User ID of the moderator.
         * @param broadcaster_user_id The broadcaster user ID for the channel you want to receive Shoutout receive notifications for.
         */
        function ChannelShoutoutReceive(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "channel.shoutout.receive", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.authorization.user_id } };
            else
                return { transport: connection.transport, type: "channel.shoutout.receive", version: "1", condition: { broadcaster_user_id, moderator_user_id: connection.moderator_user_id } };
        }
        Subscription.ChannelShoutoutReceive = ChannelShoutoutReceive;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID you want to get stream online notifications for.
         */
        function StreamOnline(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "stream.online", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "stream.online", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.StreamOnline = StreamOnline;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param broadcaster_user_id The broadcaster user ID you want to get stream offline notifications for.
         */
        function StreamOffline(connection, broadcaster_user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "stream.offline", version: "1", condition: { broadcaster_user_id } };
            else
                return { transport: connection.transport, type: "stream.offline", version: "1", condition: { broadcaster_user_id } };
        }
        Subscription.StreamOffline = StreamOffline;
        /**
         * @param connection
         * If using `Connection` object, `client_id` gets from `authorization.client_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `client_id` — Your application’s client id. The provided client_id must match the client id in the application access token.
         */
        function UserAuthorizationGrant(connection) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "user.authorization.grant", version: "1", condition: { client_id: connection.authorization.client_id } };
            else
                return { transport: connection.transport, type: "user.authorization.grant", version: "1", condition: { client_id: connection.client_id } };
        }
        Subscription.UserAuthorizationGrant = UserAuthorizationGrant;
        /**
         * @param connection
         * If using `Connection` object, `client_id` gets from `authorization.client_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * - `client_id` — Your application’s client id. The provided client_id must match the client id in the application access token.
         */
        function UserAuthorizationRevoke(connection) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "user.authorization.revoke", version: "1", condition: { client_id: connection.authorization.client_id } };
            else
                return { transport: connection.transport, type: "user.authorization.revoke", version: "1", condition: { client_id: connection.client_id } };
        }
        Subscription.UserAuthorizationRevoke = UserAuthorizationRevoke;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param user_id The user ID for the user you want update notifications for.
         */
        function UserUpdate(connection, user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "user.update", version: "1", condition: { user_id } };
            else
                return { transport: connection.transport, type: "user.update", version: "1", condition: { user_id } };
        }
        Subscription.UserUpdate = UserUpdate;
        /**
         * @param connection
         * If using `Connection` object, `moderator_user_id` gets from `authorization.user_id`, otherwise use these parameters:
         * - `transport` — The transport details that you want Twitch to use when sending you notifications.
         * @param user_id The user_id of the person receiving whispers.
         */
        function UserWhisperMessage(connection, user_id) {
            if (Connection.is(connection))
                return { transport: connection.transport, type: "user.whisper.message", version: "1", condition: { user_id } };
            else
                return { transport: connection.transport, type: "user.whisper.message", version: "1", condition: { user_id } };
        }
        Subscription.UserWhisperMessage = UserWhisperMessage;
    })(Subscription = EventSub.Subscription || (EventSub.Subscription = {}));
    let Payload;
    (function (Payload) {
        let ExtensionBitsTransaction;
        (function (ExtensionBitsTransaction) {
            ;
        })(ExtensionBitsTransaction = Payload.ExtensionBitsTransaction || (Payload.ExtensionBitsTransaction = {}));
    })(Payload = EventSub.Payload || (EventSub.Payload = {}));
    let Message;
    (function (Message) {
        function isSessionWelcome(data) { return data.metadata.message_type === "session_welcome"; }
        Message.isSessionWelcome = isSessionWelcome;
        function isSessionKeepalive(data) { return data.metadata.message_type === "session_keepalive"; }
        Message.isSessionKeepalive = isSessionKeepalive;
        function isNotification(data) { return data.metadata.message_type === "notification"; }
        Message.isNotification = isNotification;
        function isSessionReconnect(data) { return data.metadata.message_type === "session_reconnect"; }
        Message.isSessionReconnect = isSessionReconnect;
        function isRevocation(data) { return data.metadata.message_type === "revocation"; }
        Message.isRevocation = isRevocation;
        let Notification;
        (function (Notification) {
            function isAutomodMessageHold(data) { return data.metadata.subscription_type === "automod.message.hold" && data.metadata.subscription_version === "1"; }
            Notification.isAutomodMessageHold = isAutomodMessageHold;
            function isAutomodMessageHoldV2(data) { return data.metadata.subscription_type === "automod.message.hold" && data.metadata.subscription_version === "2"; }
            Notification.isAutomodMessageHoldV2 = isAutomodMessageHoldV2;
            function isAutomodMessageUpdate(data) { return data.metadata.subscription_type === "automod.message.update" && data.metadata.subscription_version === "1"; }
            Notification.isAutomodMessageUpdate = isAutomodMessageUpdate;
            function isAutomodMessageUpdateV2(data) { return data.metadata.subscription_type === "automod.message.update" && data.metadata.subscription_version === "2"; }
            Notification.isAutomodMessageUpdateV2 = isAutomodMessageUpdateV2;
            function isAutomodSettingsUpdate(data) { return data.metadata.subscription_type === "automod.settings.update" && data.metadata.subscription_version === "1"; }
            Notification.isAutomodSettingsUpdate = isAutomodSettingsUpdate;
            function isAutomodTermsUpdate(data) { return data.metadata.subscription_type === "automod.terms.update" && data.metadata.subscription_version === "1"; }
            Notification.isAutomodTermsUpdate = isAutomodTermsUpdate;
            function isChannelBitsUse(data) { return data.metadata.subscription_type === "channel.bits.use" && data.metadata.subscription_version === "1"; }
            Notification.isChannelBitsUse = isChannelBitsUse;
            function isChannelUpdate(data) { return data.metadata.subscription_type === "channel.update" && data.metadata.subscription_version === "2"; }
            Notification.isChannelUpdate = isChannelUpdate;
            function isChannelFollow(data) { return data.metadata.subscription_type === "channel.follow" && data.metadata.subscription_version === "2"; }
            Notification.isChannelFollow = isChannelFollow;
            function isChannelAdBreakBegin(data) { return data.metadata.subscription_type === "channel.ad_break.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelAdBreakBegin = isChannelAdBreakBegin;
            function isChannelChatClear(data) { return data.metadata.subscription_type === "channel.chat.clear" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatClear = isChannelChatClear;
            function isChannelChatClearUserMessages(data) { return data.metadata.subscription_type === "channel.chat.clear_user_messages" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatClearUserMessages = isChannelChatClearUserMessages;
            function isChannelChatMessage(data) { return data.metadata.subscription_type === "channel.chat.message" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatMessage = isChannelChatMessage;
            function isChannelChatMessageDelete(data) { return data.metadata.subscription_type === "channel.chat.message_delete" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatMessageDelete = isChannelChatMessageDelete;
            function isChannelChatNotification(data) { return data.metadata.subscription_type === "channel.chat.notification" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatNotification = isChannelChatNotification;
            function isChannelChatSettingsUpdate(data) { return data.metadata.subscription_type === "channel.chat_settings.update" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatSettingsUpdate = isChannelChatSettingsUpdate;
            function isChannelChatUserMessageHold(data) { return data.metadata.subscription_type === "channel.chat.user_message_hold" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatUserMessageHold = isChannelChatUserMessageHold;
            function isChannelChatUserMessageUpdate(data) { return data.metadata.subscription_type === "channel.chat.user_message_update" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatUserMessageUpdate = isChannelChatUserMessageUpdate;
            function isChannelSharedChatSessionBegin(data) { return data.metadata.subscription_type === "channel.shared_chat.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSharedChatSessionBegin = isChannelSharedChatSessionBegin;
            function isChannelSharedChatSessionUpdate(data) { return data.metadata.subscription_type === "channel.shared_chat.update" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSharedChatSessionUpdate = isChannelSharedChatSessionUpdate;
            function isChannelSharedChatSessionEnd(data) { return data.metadata.subscription_type === "channel.shared_chat.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSharedChatSessionEnd = isChannelSharedChatSessionEnd;
            function isChannelSubscribe(data) { return data.metadata.subscription_type === "channel.subscribe" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSubscribe = isChannelSubscribe;
            function isChannelSubscriptionEnd(data) { return data.metadata.subscription_type === "channel.subscription.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSubscriptionEnd = isChannelSubscriptionEnd;
            function isChannelSubscriptionGift(data) { return data.metadata.subscription_type === "channel.subscription.gift" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSubscriptionGift = isChannelSubscriptionGift;
            function isChannelSubscriptionMessage(data) { return data.metadata.subscription_type === "channel.subscription.message" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSubscriptionMessage = isChannelSubscriptionMessage;
            function isChannelCheer(data) { return data.metadata.subscription_type === "channel.cheer" && data.metadata.subscription_version === "1"; }
            Notification.isChannelCheer = isChannelCheer;
            function isChannelRaid(data) { return data.metadata.subscription_type === "channel.raid" && data.metadata.subscription_version === "1"; }
            Notification.isChannelRaid = isChannelRaid;
            function isChannelBan(data) { return data.metadata.subscription_type === "channel.ban" && data.metadata.subscription_version === "1"; }
            Notification.isChannelBan = isChannelBan;
            function isChannelUnban(data) { return data.metadata.subscription_type === "channel.unban" && data.metadata.subscription_version === "1"; }
            Notification.isChannelUnban = isChannelUnban;
            function isChannelUnbanRequestCreate(data) { return data.metadata.subscription_type === "channel.unban_request.create" && data.metadata.subscription_version === "1"; }
            Notification.isChannelUnbanRequestCreate = isChannelUnbanRequestCreate;
            function isChannelUnbanRequestResolve(data) { return data.metadata.subscription_type === "channel.unban_request.resolve" && data.metadata.subscription_version === "1"; }
            Notification.isChannelUnbanRequestResolve = isChannelUnbanRequestResolve;
            function isChannelModerate(data) { return data.metadata.subscription_type === "channel.moderate" && data.metadata.subscription_version === "1"; }
            Notification.isChannelModerate = isChannelModerate;
            function isChannelModerateV2(data) { return data.metadata.subscription_type === "channel.moderate" && data.metadata.subscription_version === "2"; }
            Notification.isChannelModerateV2 = isChannelModerateV2;
            function isChannelModeratorAdd(data) { return data.metadata.subscription_type === "channel.moderator.add" && data.metadata.subscription_version === "1"; }
            Notification.isChannelModeratorAdd = isChannelModeratorAdd;
            function isChannelModeratorRemove(data) { return data.metadata.subscription_type === "channel.moderator.remove" && data.metadata.subscription_version === "1"; }
            Notification.isChannelModeratorRemove = isChannelModeratorRemove;
            function isChannelGuestStarSessionBegin(data) { return data.metadata.subscription_type === "channel.guest_star_session.begin" && data.metadata.subscription_version === "beta"; }
            Notification.isChannelGuestStarSessionBegin = isChannelGuestStarSessionBegin;
            function isChannelGuestStarSessionEnd(data) { return data.metadata.subscription_type === "channel.guest_star_session.end" && data.metadata.subscription_version === "beta"; }
            Notification.isChannelGuestStarSessionEnd = isChannelGuestStarSessionEnd;
            function isChannelGuestStarGuestUpdate(data) { return data.metadata.subscription_type === "channel.guest_star_guest.update" && data.metadata.subscription_version === "beta"; }
            Notification.isChannelGuestStarGuestUpdate = isChannelGuestStarGuestUpdate;
            function isChannelGuestStarSettingsUpdate(data) { return data.metadata.subscription_type === "channel.guest_star_settings.update" && data.metadata.subscription_version === "beta"; }
            Notification.isChannelGuestStarSettingsUpdate = isChannelGuestStarSettingsUpdate;
            function isChannelPointsAutomaticRewardRedemptionAdd(data) { return data.metadata.subscription_type === "channel.channel_points_automatic_reward_redancement.add" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPointsAutomaticRewardRedemptionAdd = isChannelPointsAutomaticRewardRedemptionAdd;
            function isChannelPointsAutomaticRewardRedemptionAddV2(data) { return data.metadata.subscription_type === "channel.channel_points_automatic_reward_redemption.add" && data.metadata.subscription_version === "2"; }
            Notification.isChannelPointsAutomaticRewardRedemptionAddV2 = isChannelPointsAutomaticRewardRedemptionAddV2;
            function isChannelPointsCustomRewardAdd(data) { return data.metadata.subscription_type === "channel.channel_points_custom_reward.add" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPointsCustomRewardAdd = isChannelPointsCustomRewardAdd;
            function isChannelPointsCustomRewardUpdate(data) { return data.metadata.subscription_type === "channel.channel_points_custom_reward.update" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPointsCustomRewardUpdate = isChannelPointsCustomRewardUpdate;
            function isChannelPointsCustomRewardRemove(data) { return data.metadata.subscription_type === "channel.channel_points_custom_reward.remove" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPointsCustomRewardRemove = isChannelPointsCustomRewardRemove;
            function isChannelPointsCustomRewardRedemptionAdd(data) { return data.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.add" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPointsCustomRewardRedemptionAdd = isChannelPointsCustomRewardRedemptionAdd;
            function isChannelPointsCustomRewardRedemptionUpdate(data) { return data.metadata.subscription_type === "channel.channel_points_custom_reward_redemption.update" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPointsCustomRewardRedemptionUpdate = isChannelPointsCustomRewardRedemptionUpdate;
            function isChannelPollBegin(data) { return data.metadata.subscription_type === "channel.poll.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPollBegin = isChannelPollBegin;
            function isChannelPollProgress(data) { return data.metadata.subscription_type === "channel.poll.progress" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPollProgress = isChannelPollProgress;
            function isChannelPollEnd(data) { return data.metadata.subscription_type === "channel.poll.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPollEnd = isChannelPollEnd;
            function isChannelPredictionBegin(data) { return data.metadata.subscription_type === "channel.prediction.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPredictionBegin = isChannelPredictionBegin;
            function isChannelPredictionProgress(data) { return data.metadata.subscription_type === "channel.prediction.progress" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPredictionProgress = isChannelPredictionProgress;
            function isChannelPredictionLock(data) { return data.metadata.subscription_type === "channel.prediction.lock" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPredictionLock = isChannelPredictionLock;
            function isChannelPredictionEnd(data) { return data.metadata.subscription_type === "channel.prediction.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelPredictionEnd = isChannelPredictionEnd;
            function isChannelSuspiciousUserMessage(data) { return data.metadata.subscription_type === "channel.suspicious_user.message" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSuspiciousUserMessage = isChannelSuspiciousUserMessage;
            function isChannelSuspiciousUserUpdate(data) { return data.metadata.subscription_type === "channel.suspicious_user.update" && data.metadata.subscription_version === "1"; }
            Notification.isChannelSuspiciousUserUpdate = isChannelSuspiciousUserUpdate;
            function isChannelVipAdd(data) { return data.metadata.subscription_type === "channel.vip.add" && data.metadata.subscription_version === "1"; }
            Notification.isChannelVipAdd = isChannelVipAdd;
            function isChannelVipRemove(data) { return data.metadata.subscription_type === "channel.vip.remove" && data.metadata.subscription_version === "1"; }
            Notification.isChannelVipRemove = isChannelVipRemove;
            function isChannelWarningAcknowledge(data) { return data.metadata.subscription_type === "channel.warning.acknowledge" && data.metadata.subscription_version === "1"; }
            Notification.isChannelWarningAcknowledge = isChannelWarningAcknowledge;
            function isChannelWarningSend(data) { return data.metadata.subscription_type === "channel.warning.send" && data.metadata.subscription_version === "1"; }
            Notification.isChannelWarningSend = isChannelWarningSend;
            function isChannelCharityCampaignDonate(data) { return data.metadata.subscription_type === "channel.charity_campaign.donate" && data.metadata.subscription_version === "1"; }
            Notification.isChannelCharityCampaignDonate = isChannelCharityCampaignDonate;
            function isChannelCharityCampaignStart(data) { return data.metadata.subscription_type === "channel.charity_campaign.start" && data.metadata.subscription_version === "1"; }
            Notification.isChannelCharityCampaignStart = isChannelCharityCampaignStart;
            function isChannelCharityCampaignProgress(data) { return data.metadata.subscription_type === "channel.charity_campaign.progress" && data.metadata.subscription_version === "1"; }
            Notification.isChannelCharityCampaignProgress = isChannelCharityCampaignProgress;
            function isChannelCharityCampaignStop(data) { return data.metadata.subscription_type === "channel.charity_campaign.stop" && data.metadata.subscription_version === "1"; }
            Notification.isChannelCharityCampaignStop = isChannelCharityCampaignStop;
            function isConduitShardDisabled(data) { return data.metadata.subscription_type === "conduit.shard.disabled" && data.metadata.subscription_version === "1"; }
            Notification.isConduitShardDisabled = isConduitShardDisabled;
            function isDropEntitlementGrant(data) { return data.metadata.subscription_type === "drop.entitlement.grant" && data.metadata.subscription_version === "1"; }
            Notification.isDropEntitlementGrant = isDropEntitlementGrant;
            function isExtensionBitsTransactionCreate(data) { return data.metadata.subscription_type === "extension.bits_transaction.create" && data.metadata.subscription_version === "1"; }
            Notification.isExtensionBitsTransactionCreate = isExtensionBitsTransactionCreate;
            function isChannelGoalBegin(data) { return data.metadata.subscription_type === "channel.goal.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelGoalBegin = isChannelGoalBegin;
            function isChannelGoalProgress(data) { return data.metadata.subscription_type === "channel.goal.progress" && data.metadata.subscription_version === "1"; }
            Notification.isChannelGoalProgress = isChannelGoalProgress;
            function isChannelGoalEnd(data) { return data.metadata.subscription_type === "channel.goal.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelGoalEnd = isChannelGoalEnd;
            function isChannelHypeTrainBegin(data) { return data.metadata.subscription_type === "channel.hype_train.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelHypeTrainBegin = isChannelHypeTrainBegin;
            function isChannelHypeTrainProgress(data) { return data.metadata.subscription_type === "channel.hype_train.progress" && data.metadata.subscription_version === "1"; }
            Notification.isChannelHypeTrainProgress = isChannelHypeTrainProgress;
            function isChannelHypeTrainEnd(data) { return data.metadata.subscription_type === "channel.hype_train.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelHypeTrainEnd = isChannelHypeTrainEnd;
            function isChannelShieldModeBegin(data) { return data.metadata.subscription_type === "channel.shield_mode.begin" && data.metadata.subscription_version === "1"; }
            Notification.isChannelShieldModeBegin = isChannelShieldModeBegin;
            function isChannelShieldModeEnd(data) { return data.metadata.subscription_type === "channel.shield_mode.end" && data.metadata.subscription_version === "1"; }
            Notification.isChannelShieldModeEnd = isChannelShieldModeEnd;
            function isChannelShoutoutCreate(data) { return data.metadata.subscription_type === "channel.shoutout.create" && data.metadata.subscription_version === "1"; }
            Notification.isChannelShoutoutCreate = isChannelShoutoutCreate;
            function isChannelShoutoutReceive(data) { return data.metadata.subscription_type === "channel.shoutout.receive" && data.metadata.subscription_version === "1"; }
            Notification.isChannelShoutoutReceive = isChannelShoutoutReceive;
            function isStreamOnline(data) { return data.metadata.subscription_type === "stream.online" && data.metadata.subscription_version === "1"; }
            Notification.isStreamOnline = isStreamOnline;
            function isStreamOffline(data) { return data.metadata.subscription_type === "stream.offline" && data.metadata.subscription_version === "1"; }
            Notification.isStreamOffline = isStreamOffline;
            function isUserAuthorizationGrant(data) { return data.metadata.subscription_type === "user.authorization.grant" && data.metadata.subscription_version === "1"; }
            Notification.isUserAuthorizationGrant = isUserAuthorizationGrant;
            function isUserAuthorizationRevoke(data) { return data.metadata.subscription_type === "user.authorization.revoke" && data.metadata.subscription_version === "1"; }
            Notification.isUserAuthorizationRevoke = isUserAuthorizationRevoke;
            function isUserUpdate(data) { return data.metadata.subscription_type === "user.update" && data.metadata.subscription_version === "1"; }
            Notification.isUserUpdate = isUserUpdate;
            function isUserWhisperMessage(data) { return data.metadata.subscription_type === "user.whisper.message" && data.metadata.subscription_version === "1"; }
            Notification.isUserWhisperMessage = isUserWhisperMessage;
        })(Notification = Message.Notification || (Message.Notification = {}));
    })(Message = EventSub.Message || (EventSub.Message = {}));
})(EventSub || (EventSub = {}));
export var Authorization;
(function (Authorization) {
    function hasScopes(authorization, ...scopes) {
        return scopes.every(scope => authorization.scopes.includes(scope));
    }
    Authorization.hasScopes = hasScopes;
    function fromResponseBodyOAuth2Validate(body) {
        const body_ = body;
        delete body_.ok;
        delete body_.status;
        return body_;
    }
    Authorization.fromResponseBodyOAuth2Validate = fromResponseBodyOAuth2Validate;
    let URL;
    (function (URL) {
        /**
         * Creates a authorize URL for getting user access token via [implicit grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow)
         * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
         * @param redirect_uri Your app’s registered redirect URI. The access token is sent to this URI.
         * @param scopes A list of scopes. The APIs that you’re calling identify the scopes you must list.
         * @param force_verify Set to `true` to force the user to re-authorize your app’s access to their resources. The default is `false`.
         * @param state Although optional, you are **strongly encouraged** to pass a state string to help prevent [Cross-Site Request Forgery](https://datatracker.ietf.org/doc/html/rfc6749#section-10.12) (CSRF) attacks. The server returns this string to you in your redirect URI (see the state parameter in the fragment portion of the URI). If this string doesn’t match the state string that you passed, ignore the response. The state string should be randomly generated and unique for each OAuth request.
         */
        function Token(client_id, redirect_uri, scopes, force_verify = false, state) {
            var url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${client_id}&redirect_uri=${redirect_uri}`;
            if (scopes && scopes.length > 0)
                url += `&scope=${encodeURI((scopes ?? []).join(' '))}`;
            if (force_verify)
                url += `&force_verify=true`;
            if (state)
                url += `&state=${state}`;
            return url;
        }
        URL.Token = Token;
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
        function Code(client_id, redirect_uri, scopes, force_verify = false, state) {
            var url = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}`;
            if (scopes && scopes.length > 0)
                url += `&scope=${encodeURI((scopes ?? []).join(' '))}`;
            if (force_verify)
                url += `&force_verify=true`;
            if (state)
                url += `&state=${state}`;
            return url;
        }
        URL.Code = Code;
    })(URL = Authorization.URL || (Authorization.URL = {}));
})(Authorization || (Authorization = {}));
function getError(error) {
    var message = `Unknown error`;
    var ok = false;
    var status = 400;
    if (error instanceof Error)
        message = `${error.message}`;
    else if (typeof error === 'string')
        message = `${error}`;
    else
        return { ok, status, message };
    if (message.startsWith(`#`)) {
        const index = message.indexOf(' ');
        status = parseInt(message.substring(2, index));
        message = message.substring(index + 1);
    }
    return { ok, status, message };
}
/** @param data0_to_data `response.data = response.data[0];` */
async function getResponse(request, data0_to_data) {
    const response = await request.json();
    response.ok = request.ok;
    response.status = request.status;
    if (data0_to_data && request.ok)
        response.data = response.data[0];
    return response;
}
export var Request;
(function (Request) {
    /**
     * Starts a commercial on the specified channel. [Read More](https://dev.twitch.tv/docs/api/reference/#start-commercial)
     *
     * **NOTE**: Only partners and affiliates may run commercials and they must be streaming live at the time.
     *
     * **NOTE**: Only the broadcaster may start a commercial; the broadcaster’s editors and moderators may not start commercials on behalf of the broadcaster.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:edit:commercial** scope.
     * @param length The length of the commercial to run, in seconds. Twitch tries to serve a commercial that’s the requested length, but it may be shorter or longer. The maximum length you should request is 180 seconds.
     */
    async function StartCommercial(authorization, length) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/commercial", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ broadcaster_id: authorization.user_id, length }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.StartCommercial = StartCommercial;
    /**
     * This endpoint returns ad schedule related information, including snooze, when the last ad was run, when the next ad is scheduled, and if the channel is currently in pre-roll free time. Note that a new ad cannot be run until 8 minutes after running a previous ad. [Read More](https://dev.twitch.tv/docs/api/reference/#get-ad-schedule)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:ads** scope.
     */
    async function GetAdSchedule(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/ads", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetAdSchedule = GetAdSchedule;
    /**
     * If available, pushes back the timestamp of the upcoming automatic mid-roll ad by 5 minutes. This endpoint duplicates the snooze functionality in the creator dashboard’s Ads Manager. [Read More](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:ads** scope.
     */
    async function SnoozeNextAd(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/ads/schedule/snooze", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SnoozeNextAd = SnoozeNextAd;
    /**
     * Gets an [analytics report](https://dev.twitch.tv/docs/insights) for one or more extensions. The response contains the URLs used to download the reports (CSV files). [Learn More](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **analytics:read:extensions** scope.
     * @param extension_id The extension's client ID. If specified, the response contains a report for the specified extension. If not specified, the response includes a report for each extension that the authenticated user owns.
     * @param started_at The reporting window's start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). The start date must be on or after January 31, 2018. If you specify an earlier date, the API ignores it and uses January 31, 2018. If you specify a start date, you must specify an end date. If you don't specify a start and end date, the report includes all available data since January 31, 2018. The report contains one row of data for each day in the reporting window.
     * @param ended_at The reporting window's end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-27T00:00:00Z). The report is inclusive of the end date. Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that's earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
     * @param first The maximum number of report URLs to return per page in the response. The minimum page size is 1 URL per page and the maximum is 100 URLs per page. The default is 20. **NOTE**: While you may specify a maximum value of 100, the response will contain at most 20 URLs per page.
     * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value. This parameter is ignored if the `extension_id` parameter is set.
     */
    async function GetExtensionAnalytics(authorization, extension_id, started_at, ended_at, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/analytics/extensions", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ extension_id, type: "overview_v2", started_at, ended_at, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetExtensionAnalytics = GetExtensionAnalytics;
    /**
     * Gets an [analytics report](https://dev.twitch.tv/docs/insights) for one or more games. The response contains the URLs used to download the reports (CSV files). [Learn More](https://dev.twitch.tv/docs/api/reference/#get-game-analytics)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **analytics:read:games** scope.
     * @param game_id The game’s client ID. If specified, the response contains a report for the specified game. If not specified, the response includes a report for each of the authenticated user’s games.
     * @param started_at The reporting window’s start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). If you specify a start date, you must specify an end date. The start date must be within one year of today’s date. If you specify an earlier date, the API ignores it and uses a date that’s one year prior to today’s date. If you don’t specify a start and end date, the report includes all available data for the last 365 days from today. The report contains one row of data for each day in the reporting window.
     * @param ended_at The reporting window’s end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). The report is inclusive of the end date. Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that’s earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
     * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value. This parameter is ignored if `game_id` parameter is set.
     */
    async function GetGameAnalytics(authorization, game_id, started_at, ended_at, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/analytics/games", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ game_id, type: "overview_v2", started_at, ended_at, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetGameAnalytics = GetGameAnalytics;
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
    async function GetBitsLeaderboard(authorization, count, period, started_at, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/bits/leaderboard", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ count, period, started_at, user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetBitsLeaderboard = GetBitsLeaderboard;
    /**
     * Gets a list of Cheermotes that users can use to cheer Bits in any Bits-enabled channel’s chat room. Cheermotes are animated emotes that viewers can assign Bits to. [Read More](https://dev.twitch.tv/docs/api/reference/#get-cheermotes)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).
     * @param broadcaster_id The ID of the broadcaster whose custom Cheermotes you want to get. Specify the broadcaster’s ID if you want to include the broadcaster’s Cheermotes in the response (not all broadcasters upload Cheermotes). If not specified, the response contains only global Cheermotes. If the broadcaster uploaded Cheermotes, the `type` field in the response is set to `channel_custom`.
     */
    async function GetCheermotes(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/bits/cheermotes", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetCheermotes = GetCheermotes;
    /**
     * Gets an extension’s list of transactions. A transaction records the exchange of a currency (for example, Bits) for a digital product. [Read More](https://dev.twitch.tv/docs/api/reference/#get-extension-transactions)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).
     * @param extension_id The ID of the extension whose list of transactions you want to get.
     * @param id A transaction ID used to filter the list of transactions. You may specify a maximum of 100 IDs.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value.
     */
    async function GetExtensionTransactions(authorization, extension_id, id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/extensions/transactions", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ extension_id, id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetExtensionTransactions = GetExtensionTransactions;
    /**
     * Gets information about one or more channels. [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-information)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).
     * @param broadcaster_id The ID of the broadcaster whose channel you want to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that are not found.
     */
    async function GetChannelInformation(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelInformation = GetChannelInformation;
    /**
     * Updates a channel’s properties of token owner. [Read More](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:broadcast** scope.
     * @param body All fields are optional, but you must specify at least one field
     */
    async function ModifyChannelInformation(authorization, body) {
        try {
            if (Object.keys(body).length === 0)
                throw `You must specify at least one field in request body!`;
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id: authorization.user_id }).setBody(body).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.ModifyChannelInformation = ModifyChannelInformation;
    /**
     * Gets the broadcaster’s list editors. [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-editors)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:editors** scope.
     */
    async function GetChannelEditors(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/editors", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelEditors = GetChannelEditors;
    /**
     * Gets a list of broadcasters that the specified user follows. You can also use this endpoint to see whether a user follows a specific broadcaster. [Read More](https://dev.twitch.tv/docs/api/reference/#get-followed-channels)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:follows** scope.
     * @param broadcaster_id A broadcaster’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this broadcaster if the user follows them. If not specified, the response contains all broadcasters that the user follows.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
     * @param after The cursor used to get the next page of results. The [Pagination](https://dev.twitch.tv/docs/api/guide#pagination) object in the response contains the cursor’s value.
     */
    async function GetFollowedChannels(authorization, broadcaster_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/followed", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ user_id: authorization.user_id, broadcaster_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetFollowedChannels = GetFollowedChannels;
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
    async function GetChannelFollowers(authorization, broadcaster_id, user_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/followers", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelFollowers = GetChannelFollowers;
    /**
     * Creates a Custom Reward in the broadcaster’s channel. The maximum number of custom rewards per channel is 50, which includes both enabled and disabled rewards. [Read More](https://dev.twitch.tv/docs/api/reference/#create-custom-rewards)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
     */
    async function CreateCustomReward(authorization, body) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).setBody(body).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CreateCustomReward = CreateCustomReward;
    /**
     * Deletes a custom reward that the broadcaster created. [Read More](https://dev.twitch.tv/docs/api/reference/#delete-custom-reward)
     *
     * The app used to create the reward is the only app that may delete it. If the reward’s redemption status is UNFULFILLED at the time the reward is deleted, its redemption status is marked as FULFILLED.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
     * @param id The ID of the custom reward to delete.
     */
    async function DeleteCustomReward(authorization, id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.DeleteCustomReward = DeleteCustomReward;
    /**
     * Gets a list of custom rewards that the broadcaster created. [Read More](https://dev.twitch.tv/docs/api/reference/#get-custom-reward)
     *
     * **NOTE**: A channel may offer a maximum of 50 rewards, which includes both enabled and disabled rewards.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:redemptions** or **channel:manage:redemptions** scope.
     * @param id A list of IDs to filter the rewards by. You may specify a maximum of 50 IDs. Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
     * @param only_manageable_rewards A Boolean value that determines whether the response contains only the custom rewards that the app may manage (the app is identified by the ID in the Client-Id header). Set to `true` to get only the custom rewards that the app may manage. The default is `false`.
     */
    async function GetCustomRewards(authorization, id, only_manageable_rewards) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, id, only_manageable_rewards }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetCustomRewards = GetCustomRewards;
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
    async function GetCustomRewardRedemptions(authorization, reward_id, status, id, sort, after, first) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, reward_id, status, id, sort, after, first }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetCustomRewardRedemptions = GetCustomRewardRedemptions;
    /**
     * Updates a custom reward. The app used to create the reward is the only app that may update the reward. [Read More](https://dev.twitch.tv/docs/api/reference/#update-custom-reward)
     *
     * The body of the request should contain only the fields you’re updating.
     * @param authorization [User access token](https://dev.twitch.tv/docs/api/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
     * @param id The ID of the reward to update.
     */
    async function UpdateCustomReward(authorization, id, body) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, id }).setBody(body).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateCustomReward = UpdateCustomReward;
    /**
     * Updates a redemption’s status. You may update a redemption only if its status is UNFULFILLED. The app used to create the reward is the only app that may update the redemption. [Read More](https://dev.twitch.tv/docs/api/reference/#update-redemption-status)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.
     * @param id A list of IDs that identify the redemptions to update. You may specify a maximum of 50 IDs.
     * @param reward_id The ID that identifies the reward that’s been redeemed.
     * @param status The status to set the redemption to. Setting the status to `CANCELED` refunds the user’s channel points.
     */
    async function UpdateCustomRewardRedemptionStatus(authorization, id, reward_id, status) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ id, broadcaster_id: authorization.user_id, reward_id }).setBody({ status }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateCustomRewardRedemptionStatus = UpdateCustomRewardRedemptionStatus;
    /**
     * Gets information about the charity campaign that a broadcaster is running. For example, the campaign’s fundraising goal and the current amount of donations. [Read More](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign)
     *
     * To receive events when progress is made towards the campaign’s goal or the broadcaster changes the fundraising goal, subscribe to the [channel.charity_campaign.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelcharity_campaignprogress) subscription type.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:charity** scope.
     */
    async function GetCharityCampaigns(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/charity/campaigns", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetCharityCampaigns = GetCharityCampaigns;
    /**
     * Gets the list of donations that users have made to the broadcaster’s active charity campaign. [Read More](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations)
     *
     * To receive events as donations occur, subscribe to the [channel.charity_campaign.donate](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelcharity_campaigndonate) subscription type.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:charity** scope.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
     * @param after The cursor used to get the next page of results. The `Pagination` object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetCharityCampaignDonations(authorization, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/charity/donations", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetCharityCampaignDonations = GetCharityCampaignDonations;
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
    async function GetChatters(authorization, broadcaster_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/chatters", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChatters = GetChatters;
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
    async function GetChannelEmotes(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelEmotes = GetChannelEmotes;
    /**
     * Gets the list of [global emotes](https://www.twitch.tv/creatorcamp/en/learn-the-basics/emotes/). Global emotes are [Twitch-created emotes](https://dev.twitch.tv/docs/irc/emotes) that users can use in any Twitch chat. [Read More](https://dev.twitch.tv/docs/api/reference/#get-global-emotes)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param broadcaster_id An ID that identifies the broadcaster whose emotes you want to get.
     */
    async function GetGlobalEmotes(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes/global", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetGlobalEmotes = GetGlobalEmotes;
    /**
     * Gets emotes for one or more specified emote sets. [Read More](https://dev.twitch.tv/docs/api/reference/#get-emote-sets)
     *
     * An emote set groups emotes that have a similar context. For example, Twitch places all the subscriber emotes that a broadcaster uploads for their channel in the same emote set.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param emote_set_id An ID that identifies the emote set to get. You may specify a maximum of 25 IDs. The response contains only the IDs that were found and ignores duplicate IDs. To get emote set IDs, use the `GetChannelEmotes`.
     */
    async function GetEmoteSets(authorization, emote_set_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes/set", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ emote_set_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetEmoteSets = GetEmoteSets;
    /**
     * Gets the broadcaster’s list of custom chat badges. The list is empty if the broadcaster hasn’t created custom chat badges. For information about custom badges, see [subscriber badges](https://help.twitch.tv/s/article/subscriber-badge-guide) and [Bits badges](https://help.twitch.tv/s/article/custom-bit-badges-guide). [Read More](https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param broadcaster_id The ID of the broadcaster whose chat badges you want to get.
     */
    async function GetChannelChatBadges(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/badge", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelChatBadges = GetChannelChatBadges;
    /**
     * Gets Twitch’s list of chat badges, which users may use in any channel’s chat room. For information about chat badges, see [Twitch Chat Badges Guide](https://help.twitch.tv/s/article/twitch-chat-badges-guide). [Read More](https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param broadcaster_id The ID of the broadcaster whose chat badges you want to get.
     */
    async function GetGlobalChatBadges(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/badges/global", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetGlobalChatBadges = GetGlobalChatBadges;
    /**
     * Gets the broadcaster’s chat settings. [Read More](https://dev.twitch.tv/docs/api/reference/#get-chat-settings)
     *
     * For an overview of chat settings, see [Chat Commands for Broadcasters and Moderators](https://help.twitch.tv/s/article/chat-commands#AllMods) and [Moderator Preferences](https://help.twitch.tv/s/article/setting-up-moderation-for-your-twitch-channel#modpreferences).
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param broadcaster_id The ID of the broadcaster whose chat settings you want to get.
     */
    async function GetChatSettings(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/settings", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.type === "user" ? authorization.user_id : undefined }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChatSettings = GetChatSettings;
    /**
     * Retrieves the active shared chat session for a channel. [Read More](https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param broadcaster_id The User ID of the channel broadcaster.
     */
    async function GetSharedChatSession(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/shared_chat/session", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetSharedChatSession = GetSharedChatSession;
    /**
     * Retrieves emotes available to the user across all channels.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:emotes** scope.
     * @param broadcaster_id The User ID of a broadcaster you wish to get follower emotes of. Using this query parameter will guarantee inclusion of the broadcaster’s follower emotes in the response body. **NOTE**: If the owner of token is subscribed to the broadcaster specified, their follower emotes will appear in the response body regardless if this query parameter is used.
     * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
     */
    async function GetUserEmotes(authorization, broadcaster_id, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/emotes/user", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ user_id: authorization.user_id, broadcaster_id, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetUserEmotes = GetUserEmotes;
    /**
     * Updates the broadcaster’s chat settings.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_settings** scope.
     * @param broadcaster_id The ID of the broadcaster whose chat settings you want to update.
     * @param body All fields are optional. Specify only those fields that you want to update.
     */
    async function UpdateChatSettings(authorization, broadcaster_id, body) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/settings", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody(body).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateChatSettings = UpdateChatSettings;
    /**
     * Sends an announcement to the broadcaster’s chat room.
     *
     * **Rate Limits**: One announcement may be sent every 2 seconds.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:announcements** scope.
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to send the announcement to.
     */
    async function SendChatAnnouncement(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/announcements", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SendChatAnnouncement = SendChatAnnouncement;
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
    async function SendShoutout(authorization, from_broadcaster_id, to_broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/shoutouts", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ from_broadcaster_id, to_broadcaster_id, moderator_id: authorization.user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SendShoutout = SendShoutout;
    /**
     * Sends a message as token owner to the broadcaster’s chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#send-chat-message)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:write:chat** scope
     * @param broadcaster_id The ID of the broadcaster whose chat room the message will be sent to
     * @param message The message to send. The message is limited to a maximum of 500 characters. Chat messages can also include emoticons. To include emoticons, use the name of the emote. The names are case sensitive. Don’t include colons around the name (e.g., :bleedPurple:). If Twitch recognizes the name, Twitch converts the name to the emote before writing the chat message to the chat room
     * @param reply_parent_message_id The ID of the chat message being replied to
     */
    async function SendChatMessage(authorization, broadcaster_id, message, reply_parent_message_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/messages", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, sender_id: authorization.user_id, message, reply_parent_message_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SendChatMessage = SendChatMessage;
    /**
     * Gets the color used for the user’s name in chat.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param user_id The ID of the user whose username color you want to get. To specify more than one user, include the `user_id` parameter for each user to get. For example, `&user_id=1234&user_id=5678`. The maximum number of IDs that you may specify is 100. The API ignores duplicate IDs and IDs that weren’t found.
     */
    async function GetUserChatColor(authorization, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/color", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetUserChatColor = GetUserChatColor;
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
    async function UpdateUserChatColor(authorization, color) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/chat/color", "PUT").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ color }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateUserChatColor = UpdateUserChatColor;
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
    async function CreateClip(authorization, broadcaster_id, has_delay) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/clips", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, has_delay }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CreateClip = CreateClip;
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
    async function GetClips(authorization, query, started_at, ended_at, first, before, after, is_featured) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/clips", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch(query).setSearch({ started_at, ended_at, first, before, after, is_featured }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetClips = GetClips;
    /**
     * Gets the [conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) for a client ID.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
     */
    async function GetConduits(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetConduits = GetConduits;
    /**
     * Creates a new [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
     * @param shard_count The number of shards to create for this conduit.
     */
    async function CreateConduit(authorization, shard_count) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ shard_count }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CreateConduit = CreateConduit;
    /**
     * Updates a [conduit’s](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) shard count. To delete shards, update the count to a lower number, and the shards above the count will be deleted. For example, if the existing shard count is 100, by resetting shard count to 50, shards 50-99 are disabled.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
     * @param id Conduit ID.
     * @param shard_count The new number of shards for this conduit.
     */
    async function UpdateConduit(authorization, id, shard_count) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ id, shard_count }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateConduit = UpdateConduit;
    /**
     * Deletes a specified [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/). Note that it may take some time for Eventsub subscriptions on a deleted conduit to show as disabled when calling `GetEventSubSubscriptions`.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
     * @param id Conduit ID.
     */
    async function DeleteConduit(authorization, id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.DeleteConduit = DeleteConduit;
    /**
     * Gets a lists of all shards for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
     * @param conduit_id Conduit ID.
     * @param status Status to filter by.
     * @param after The cursor used to get the next page of results. The pagination object in the response contains the cursor’s value.
     */
    async function GetConduitShards(authorization, conduit_id, status, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits/shards", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ conduit_id, status, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetConduitShards = GetConduitShards;
    /**
     * Updates shard(s) for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).
     *
     * **NOTE**: Shard IDs are indexed starting at 0, so a conduit with a `shard_count` of 5 will have shards with IDs 0 through 4.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)
     * @param conduit_id Conduit ID.
     * @param shards List of shards to update.
     */
    async function UpdateConduitShards(authorization, conduit_id, shards) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/conduits/shards", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ conduit_id, shards }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateConduitShards = UpdateConduitShards;
    /**
     * Gets information about Twitch content classification labels.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param locale Locale for the Content Classification Labels. You may specify a maximum of 1 locale.
     */
    async function GetContentClassificationLabels(authorization, locale) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/content_classification_labels", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ locale }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetContentClassificationLabels = GetContentClassificationLabels;
    /**
     * Creates an EventSub subscription. If you using `EventSub.startWebSocket` method, you must use this function in `onSessionWelcome` callback. [Read More](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
     * @param authorization
     * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token. If the subscription type requires user authorization, the user must have granted your app (client ID) permissions to receive those events before you subscribe to them. For example, to subscribe to [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe) events, your app must get a user access token that includes the `channel:read:subscriptions` scope, which adds the required permission to your app access token’s client ID
     * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. If the subscription type requires user authorization, the token must include the required scope. However, if the subscription type doesn’t include user authorization, the token may include any scopes or no scopes
     * 3. If you use [Conduits to receive events](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/), the request must specify an app access token. The request will fail if you use a user access token
     * @param subscription `EventSub.Subscription` type to subscribe
     */
    async function CreateEventSubSubscription(authorization, subscription) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/subscriptions", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody(subscription).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CreateEventSubSubscription = CreateEventSubSubscription;
    /**
     * Deletes an EventSub subscription. [Read More(https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)
     * @param authorization
     * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token
     * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes
     * @param id The ID of the subscription to delete
     */
    async function DeleteEventSubSubscription(authorization, id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/subscriptions", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.DeleteEventSubSubscription = DeleteEventSubSubscription;
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
    async function GetEventSubSubscriptions(authorization, status, type, user_id, subscription_id, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/eventsub/subscriptions", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ status, type, user_id, subscription_id, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetEventSubSubscriptions = GetEventSubSubscriptions;
    /**
     * Gets information about all broadcasts on Twitch.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide/#pagination)
     * @param before The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide/#pagination)
     */
    async function GetTopGames(authorization, first, after, before) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/games/top", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ first, after, before }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetTopGames = GetTopGames;
    /**
     * Gets information about specified categories or games.
     *
     * You may get up to 100 categories or games by specifying their ID or name. You may specify all IDs, all names, or a combination of IDs and names. If you specify a combination of IDs and names, the total number of IDs and names must not exceed 100.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param name The name of the category or game to get. The name must exactly match the category’s or game’s title. You may specify a maximum of 100 names. The endpoint ignores duplicate names and names that weren’t found.
     * @param id The ID of the category or game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found.
     * @param igdb_id The [IGDB](https://www.igdb.com/) ID of the game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found.
     */
    async function GetGames(authorization, name, id, igdb_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/games", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ name, id, igdb_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetGames = GetGames;
    /**
     * Gets the broadcaster’s list of active goals. Use this endpoint to get the current progress of each goal.
     *
     * Instead of polling for the progress of a goal, consider [subscribing](https://dev.twitch.tv/docs/eventsub/manage-subscriptions) to receive notifications when a goal makes progress using the [channel.goal.progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelgoalprogress) subscription type. [Read More](https://dev.twitch.tv/docs/api/goals#requesting-event-notifications)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:goals** scope.
     */
    async function GetCreatorGoals(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/goals", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetCreatorGoals = GetCreatorGoals;
    /**
     * Gets information about the broadcaster’s current or most recent Hype Train event.
     *
     * Instead of polling for events, consider [subscribing](https://dev.twitch.tv/docs/eventsub/manage-subscriptions) to Hype Train events ([Begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelhype_trainbegin), [Progress](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelhype_trainprogress), [End](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelhype_trainend)).
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:hype_train** scope.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 1.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetHypeTrainEvents(authorization, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/hypetrain/events", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetHypeTrainEvents = GetHypeTrainEvents;
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
    async function CheckAutomodStatus(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/enforcements/status", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CheckAutomodStatus = CheckAutomodStatus;
    /**
     * Allow or deny the message that AutoMod flagged for review. For information about AutoMod, see [How to Use AutoMod](https://help.twitch.tv/s/article/how-to-use-automod).
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:automod** scope.
     * @param msg_id The ID of the message to allow or deny.
     * @param action The action to take for the message.
     */
    async function ManageHeldAutoModMessages(authorization, msg_id, action) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/automod/message", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ user_id: authorization.user_id, msg_id, action, }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.ManageHeldAutoModMessages = ManageHeldAutoModMessages;
    /**
     * Gets the broadcaster’s AutoMod settings. The settings are used to automatically block inappropriate or harassing messages from appearing in the broadcaster’s chat room.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:automod_settings** scope.
     * @param broadcaster_id The ID of the broadcaster whose AutoMod settings you want to get.
     */
    async function GetAutoModSettings(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/automod/settings", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetAutoModSettings = GetAutoModSettings;
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
    async function UpdateAutoModSettings(authorization, broadcaster_id, body) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/automod/settings", "PUT").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ body }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateAutoModSettings = UpdateAutoModSettings;
    /**
     * Gets all users that the broadcaster banned or put in a timeout.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderation:read** or **moderator:manage:banned_users** scope.
     * @param user_id A list of user IDs used to filter the results. You may specify a maximum of 100 IDs. The returned list includes only those users that were banned or put in a timeout. The list is returned in the same order that you specified the IDs.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     * @param before The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetBannedUsers(authorization, user_id, first, after, before) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/banned", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after, before }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetBannedUsers = GetBannedUsers;
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
    async function BanUser(authorization, broadcaster_id, user_id, duration, reason) {
        const data = { user_id, duration, reason };
        if (!duration)
            delete data.duration;
        if (!reason)
            delete data.reason;
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/bans", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ data }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.BanUser = BanUser;
    /**
     * Removes the ban or timeout that was placed on the specified user.
     *
     * To ban a user, see `BanUser` function.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:banned_users** scopes.
     * @param broadcaster_id The ID of the broadcaster whose chat room the user is banned from chatting in.
     * @param user_id The ID of the user to remove the ban or timeout from.
     */
    async function UnbanUser(authorization, broadcaster_id, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/bans", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UnbanUser = UnbanUser;
    /**
     * Gets a list of unban requests for a broadcaster’s channel.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:unban_requests** or **moderator:manage:banned_users** scope.
     * @param broadcaster_id The ID of the broadcaster whose channel is receiving unban requests.
     * @param status Filter by a status.
     * @param user_id The ID used to filter what unban requests are returned.
     * @param after Cursor used to get next page of results. Pagination object in response contains cursor value.
     * @param first The maximum number of items to return per page in response.
     */
    async function GetUnbanRequests(authorization, broadcaster_id, status, user_id, after, first) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/unban_requests", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, status, user_id, after, first }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetUnbanRequests = GetUnbanRequests;
    /**
     * Resolves an unban request by approving or denying it.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:banned_users** scope.
     * @param broadcaster_id The ID of the broadcaster whose channel is approving or denying the unban request.
     * @param unban_request_id The ID of unban request.
     * @param status Resolution status.
     * @param resolution_text Message supplied by the unban request resolver. The message is limited to a maximum of 500 characters.
     */
    async function ResolveUnbanRequest(authorization, broadcaster_id, unban_request_id, status, resolution_text) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/unban_requests", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, unban_request_id, status, resolution_text }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.ResolveUnbanRequest = ResolveUnbanRequest;
    /**
     * Gets the broadcaster’s list of non-private, blocked words or phrases. These are the terms that the broadcaster or moderator added manually or that were denied by AutoMod. [Read More](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:blocked_terms** or **moderator:manage:blocked_terms** scope.
     * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value
     */
    async function GetBlockedTerms(authorization, broadcaster_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/blocked_terms", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetBlockedTerms = GetBlockedTerms;
    /**
     * Adds a word or phrase as token owner to the broadcaster’s list of blocked terms. These are the terms that the broadcaster doesn’t want used in their chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope.
     * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
     * @param text The word or phrase to block from being used in the broadcaster’s chat room. The term must contain a minimum of 2 characters and may contain up to a maximum of 500 characters. Terms may include a wildcard character (*). The wildcard character must appear at the beginning or end of a word or set of characters. For example, \*foo or foo\*. If the blocked term already exists, the response contains the existing blocked term
     */
    async function AddBlockedTerm(authorization, broadcaster_id, text) {
        try {
            if (text.length < 2)
                throw "The length of the term in the text field is too short. The term must contain a minimum of 2 characters.";
            if (text.length > 500)
                throw "The length of the term in the text field is too long. The term may contain up to a maximum of 500 characters.";
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/blocked_terms", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ text }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.AddBlockedTerm = AddBlockedTerm;
    /**
     * Removes the word or phrase as token owner from the broadcaster’s list of blocked terms. [Read More](https://dev.twitch.tv/docs/api/reference/#remove-blocked-term)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope.
     * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
     * @param id The ID of the blocked term to remove from the broadcaster’s list of blocked terms
     */
    async function RemoveBlockedTerm(authorization, broadcaster_id, id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/blocked_terms", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.RemoveBlockedTerm = RemoveBlockedTerm;
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
    async function DeleteChatMessage(authorization, broadcaster_id, message_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/chat", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id, message_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.DeleteChatMessage = DeleteChatMessage;
    /**
     * Gets a list of channels that the specified user has moderator privileges in.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:moderated_channels** scope.
     * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
     * @param first The maximum number of items to return per page in the response. Minimum page size is 1 item per page and the maximum is 100. The default is 20.
     */
    async function GetModeratedChannels(authorization, after, first) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/channels", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ user_id: authorization.user_id, after, first }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetModeratedChannels = GetModeratedChannels;
    /**
     * Gets all users allowed to moderate the broadcaster’s chat room.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderation:read** or **channel:manage:moderators** scope.
     * @param user_id A list of user IDs used to filter the results. You may specify a maximum of 100 IDs. The returned list includes only the users from the list who are moderators in the broadcaster’s channel. The list is returned in the same order as you specified the IDs.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
     */
    async function GetModerators(authorization, user_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/moderators", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetModerators = GetModerators;
    /**
     * Adds a moderator to the broadcaster’s chat room.
     *
     * **Rate Limits**: The broadcaster may add a maximum of 10 moderators within a 10-second window.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:moderators** scope.
     * @param user_id The ID of the user to add as a moderator in the broadcaster’s chat room.
     */
    async function AddChannelModerator(authorization, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/moderators", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.AddChannelModerator = AddChannelModerator;
    /**
     * Removes a moderator from the broadcaster’s chat room.
     *
     * **Rate Limits**: The broadcaster may remove a maximum of 10 moderators within a 10-second window.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:moderators** scope.
     * @param user_id The ID of the user to remove as a moderator from the broadcaster’s chat room.
     */
    async function RemoveChannelModerator(authorization, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/moderators", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.RemoveChannelModerator = RemoveChannelModerator;
    /**
     * Gets a list of the broadcaster’s VIPs.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:vips** or **channel:manage:vips** scope.
     * @param user_id Filters the list for specific VIPs. To specify more than one user, include the `user_id` parameter for each user to get. For example, `&user_id=1234&user_id=5678`. The maximum number of IDs that you may specify is 100. Ignores the ID of those users in the list that aren’t VIPs.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
     * @param after The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value.
     */
    async function GetChannelVips(authorization, user_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/vips", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelVips = GetChannelVips;
    /**
     * Adds the specified user as a VIP in the broadcaster’s channel.
     *
     * **Rate Limits**: The broadcaster may add a maximum of 10 VIPs within a 10-second window.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:vips** scope.
     * @param user_id The ID of the user to give VIP status to.
     */
    async function AddChannelVip(authorization, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/vips", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.AddChannelVip = AddChannelVip;
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
    async function RemoveChannelVip(authorization, broadcaster_id, user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/channels/vips", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.RemoveChannelVip = RemoveChannelVip;
    /**
     * Activates or deactivates the broadcaster’s Shield Mode.
     *
     * Twitch’s Shield Mode feature is like a panic button that broadcasters can push to protect themselves from chat abuse coming from one or more accounts. When activated, Shield Mode applies the overrides that the broadcaster configured in the Twitch UX. If the broadcaster hasn’t configured Shield Mode, it applies default overrides.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:shield_mode** scope.
     * @param broadcaster_id The ID of the broadcaster whose Shield Mode you want to activate or deactivate.
     * @param is_active A Boolean value that determines whether to activate Shield Mode. Set to `true` to activate Shield Mode; otherwise, `false` to deactivate Shield Mode.
     */
    async function UpdateShieldModeStatus(authorization, broadcaster_id, is_active) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/shield_mode", "PUT").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ is_active }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateShieldModeStatus = UpdateShieldModeStatus;
    /**
     * Gets the broadcaster’s Shield Mode activation status.
     *
     * To receive notification when the broadcaster activates and deactivates Shield Mode, subscribe to the [channel.shield_mode.begin](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshield_modebegin) and [channel.shield_mode.end](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshield_modeend) subscription types.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:shield_mode** or **moderator:manage:shield_mode** scope.
     * @param broadcaster_id The ID of the broadcaster whose Shield Mode activation status you want to get.
     */
    async function GetShieldModeStatus(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/shield_mode", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetShieldModeStatus = GetShieldModeStatus;
    /**
     * Warns a user in the specified broadcaster’s chat room, preventing them from chat interaction until the warning is acknowledged. New warnings can be issued to a user when they already have a warning in the channel (new warning will replace old warning).
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:warnings** scope.
     * @param broadcaster_id The ID of the channel in which the warning will take effect.
     * @param user_id The ID of the twitch user to be warned.
     * @param reason A custom reason for the warning. **Max 500 chars.**
     */
    async function WarnChatUser(authorization, broadcaster_id, user_id, reason) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/moderation/warnings", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ broadcaster_id, moderator_id: authorization.user_id }).setBody({ data: { user_id, reason } }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.WarnChatUser = WarnChatUser;
    /**
     * Gets a list of polls that the broadcaster created.
     *
     * Polls are available for 90 days after they’re created.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:polls** or **channel:manage:polls** scope.
     * @param id A list of IDs that identify the polls to return. You may specify a maximum of 20 IDs. Specify this parameter only if you want to filter the list that the request returns. The endpoint ignores duplicate IDs and those not owned by this broadcaster.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 20 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetPolls(authorization, id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/polls", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetPolls = GetPolls;
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
    async function CreatePoll(authorization, title, choices, duration, channel_points_voting_enabled, channel_points_per_vote) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/polls", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ broadcaster_id: authorization.user_id, title, choices: choices.map(v => { return { title: v }; }), duration, channel_points_voting_enabled, channel_points_per_vote }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CreatePoll = CreatePoll;
    /**
     * Ends an active poll. You have the option to end it or end it and archive it.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:polls** scope.
     * @param id The ID of the poll to update.
     * @param status The status to set the poll to.
     */
    async function EndPoll(authorization, id, status) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/polls", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ broadcaster_id: authorization.user_id, id, status }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.EndPoll = EndPoll;
    /**
     * Gets a list of Channel Points Predictions that the broadcaster created.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:predictions** or **channel:manage:predictions** scope.
     * @param id The ID of the prediction to get. You may specify a maximum of 25 IDs. The endpoint ignores duplicate IDs and those not owned by the broadcaster.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 25 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetPredictions(authorization, id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/predictions", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetPredictions = GetPredictions;
    /**
     * Creates a Channel Points Prediction.
     *
     * With a Channel Points Prediction, the broadcaster poses a question and viewers try to predict the outcome. The prediction runs as soon as it’s created. The broadcaster may run only one prediction at a time.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:predictions** scope.
     * @param title The question that the broadcaster is asking. For example, `Will I finish this entire pizza?` The title is limited to a maximum of 45 characters.
     * @param outcomes The list of possible outcomes that the viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 10 choices. The choice is limited to a maximum of 25 characters.
     * @param prediction_window The length of time (in seconds) that the prediction will run for. The minimum is 30 seconds and the maximum is 1800 seconds (30 minutes).
     */
    async function CreatePrediction(authorization, title, outcomes, prediction_window) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/predictions", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ broadcaster_id: authorization.user_id, title, outcomes: outcomes.map(v => { return { title: v }; }), prediction_window }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CreatePrediction = CreatePrediction;
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
    async function EndPrediction(authorization, id, status, winning_outcome_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/predictions", "PATCH").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setBody({ broadcaster_id: authorization.user_id, id, status, winning_outcome_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.EndPrediction = EndPrediction;
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
    async function StartRaid(authorization, to_broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/raids", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ from_broadcaster_id: authorization.user_id, to_broadcaster_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.StartRaid = StartRaid;
    /**
     * Cancel a pending raid.
     *
     * You can cancel a raid at any point up until the broadcaster clicks **Raid Now** in the Twitch UX or the 90-second countdown expires.
     *
     * **Rate Limit**: The limit is 10 requests within a 10-minute window.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:raids** scope.
     */
    async function CancelRaid(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/raids", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CancelRaid = CancelRaid;
    /**
     * Gets the games or categories that match the specified query. [Read More](https://dev.twitch.tv/docs/api/reference/#search-categories)
     *
     * To match, the category’s name must contain all parts of the query string. For example, if the query string is 42, the response includes any category name that contains 42 in the title. If the query string is a phrase like *love computer*, the response includes any category name that contains the words love and computer anywhere in the name. The comparison is case insensitive.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param query The search string.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function SearchCategories(authorization, query, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/search/categories", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ query, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SearchCategories = SearchCategories;
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
    async function SearchChannels(authorization, query, live_only, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/search/channels", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ query, live_only, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SearchChannels = SearchChannels;
    /**
     * Gets the channel’s stream key.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:stream_key** scope.
     */
    async function GetStreamKey(authorization) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/streams/key", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetStreamKey = GetStreamKey;
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
    async function GetStreams(authorization, user_id, user_login, game_id, type, language, first, before, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/streams", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ user_id, user_login, game_id, type, language, first, before, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetStreams = GetStreams;
    /**
     * Gets the list of broadcasters that the user follows and that are streaming live.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:follows** scope.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 100.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetFollowedStreams(authorization, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/streams/followed", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ user_id: authorization.user_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetFollowedStreams = GetFollowedStreams;
    /**
     * Gets a list of users that subscribe to the specified broadcaster.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:subscriptions** scope.
     * @param user_id Filters the list to include only the specified subscribers. You may specify a maximum of 100 subscribers.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20.
     * @param after The cursor used to get the next page of results. Do not specify if you set the `user_id` query parameter. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     * @param before The cursor used to get the previous page of results. Do not specify if you set the `user_id` query parameter. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetBroadcasterSubscriptions(authorization, user_id, first, after, before) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id: authorization.user_id, user_id, first, after, before }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetBroadcasterSubscriptions = GetBroadcasterSubscriptions;
    /**
     * Checks whether the user subscribes to the broadcaster’s channel.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:subscriptions** scope.
     * @param broadcaster_id The ID of a partner or affiliate broadcaster.
     */
    async function CheckUserSubscription(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions/user", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, user_id: authorization.user_id }).fetch();
            return await getResponse(request, true);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.CheckUserSubscription = CheckUserSubscription;
    /**
     * Gets the list of Twitch teams that the broadcaster is a member of.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param broadcaster_id The ID of the broadcaster whose teams you want to get.
     */
    async function GetChannelTeams(authorization, broadcaster_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions/user", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetChannelTeams = GetChannelTeams;
    /**
     * Gets information about the specified [Twitch team](https://help.twitch.tv/s/article/twitch-teams).
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param name The name of the team to get. This parameter and the `id` parameter are mutually exclusive; you must specify the team’s name or ID but not both.
     * @param id The ID of the team to get. This parameter and the `name` parameter are mutually exclusive; you must specify the team’s name or ID but not both.
     */
    async function GetTeams(authorization, name, id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/subscriptions/user", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ name, id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetTeams = GetTeams;
    /**
     * Gets information about one or more users. [Read More](https://dev.twitch.tv/docs/api/reference/#get-users)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param query Specifies query of request:
     * - You may look up users using their user ID, login name, or both but the sum total of the number of users you may look up is 100. For example, you may specify 50 IDs and 50 names or 100 IDs or names, but you cannot specify 100 IDs and 100 names.
     * - If you don’t specify IDs or login names, the request returns information about the user in the access token if you specify a user access token.
     * - To include the user’s verified email address in the response, you must use a user access token that includes the **user:read:email** scope.
     */
    async function GetUsers(authorization, query) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/users", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch(query).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetUsers = GetUsers;
    /**
     * Updates the token owner channel description.
     *
     * To include the user’s verified email address in the response, the user access token must also include the **user:read:email** scope.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:edit** scope.
     * @param description The string to update the channel’s description to. The description is limited to a maximum of 300 characters.
     */
    async function UpdateUserDescription(authorization, description) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/users", "PUT").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ description }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UpdateUserDescription = UpdateUserDescription;
    /**
     * Gets the [list of users that the broadcaster has blocked](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat?language=en_US#BlockWhispersandMessagesfromStrangers).
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:blocked_users** scope.
     * @param broadcaster_id The ID of the broadcaster whose list of blocked users you want to get.
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20.
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function GetUserBlockList(authorization, broadcaster_id, first, after) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/users/blocks", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ broadcaster_id, first, after }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetUserBlockList = GetUserBlockList;
    /**
     * Blocks the specified user from interacting with or having contact with the broadcaster.
     *
     * To learn more about blocking users, see [Block Other Users on Twitch](https://help.twitch.tv/s/article/how-to-manage-harassment-in-chat?language=en_US#BlockWhispersandMessagesfromStrangers).
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:blocked_users** scope.
     * @param target_user_id The ID of the user to block. The API ignores the request if the broadcaster has already blocked the user.
     * @param source_context The location where the harassment took place that is causing the broadcaster to block the user.
     * @param reason The reason that the broadcaster is blocking the user.
     */
    async function BlockUser(authorization, target_user_id, source_context, reason) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/users/blocks", "PUT").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ target_user_id, source_context, reason }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.BlockUser = BlockUser;
    /**
     * Removes the user from the broadcaster’s list of blocked users.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:blocked_users** scope.
     * @param target_user_id The ID of the user to remove from the broadcaster’s list of blocked users. The API ignores the request if the broadcaster hasn’t blocked the user.
     */
    async function UnblockUser(authorization, target_user_id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/users/blocks", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ target_user_id }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.UnblockUser = UnblockUser;
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
    async function GetVideos(authorization, query, language, period, sort, type, first, after, before) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/videos", "GET").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch(query).setSearch({ language, period, sort, type, first, after, before }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.GetVideos = GetVideos;
    /**
     * Deletes one or more videos. You may delete past broadcasts, highlights, or uploads.
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:videos** scope.
     * @param id The list of videos to delete. You can delete a maximum of 5 videos per request. Ignores invalid video IDs. If the user doesn’t have permission to delete one of the videos in the list, none of the videos are deleted.
     */
    async function DeleteVideos(authorization, id) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/videos", "DELETE").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`
            }).setSearch({ id }).fetch();
            return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.DeleteVideos = DeleteVideos;
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
    async function SendWhisper(authorization, to_user_id, message) {
        try {
            const request = await new FetchBuilder("https://api.twitch.tv/helix/whispers", "POST").setHeaders({
                "Client-Id": authorization.client_id,
                "Authorization": `Bearer ${authorization.token}`,
                "Content-Type": "application/json"
            }).setSearch({ from_user_id: authorization.user_id, to_user_id }).setBody({ message }).fetch();
            return request.ok ? { ok: true, status: 204 } : await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.SendWhisper = SendWhisper;
    /**
     * Validates access token and if its valid, returns data of it. [Read More](https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token)
     * @param authorization Access token data or token itself to validate
     */
    async function OAuth2Validate(token_data) {
        const token = typeof token_data === "string" ? token_data : token_data.token;
        if (token.length < 1)
            return getError("#401 invalid access token");
        try {
            const request = await new FetchBuilder("https://id.twitch.tv/oauth2/validate", "GET").setHeaders({
                "Authorization": `Bearer ${token}`
            }).fetch();
            const response = await getResponse(request);
            if (response.status === 200) {
                response.token = token;
                if (!response.scopes)
                    response.scopes = [];
                response.user_login = response.login;
                delete response.login;
                response.type = (response.user_id || response.user_login) ? "user" : "app";
            }
            return response;
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.OAuth2Validate = OAuth2Validate;
    /**
     * If your app no longer needs an access token, you can revoke it by this method. [Read More](https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-token)
     * @param authorization Access token data to revoke
     */
    async function OAuth2Revoke(authorization) {
        try {
            if (authorization.token.length < 1)
                throw "invalid access token";
            const request = await new FetchBuilder("https://id.twitch.tv/oauth2/revoke", "POST").setHeaders({
                "Content-Type": "application/x-www-form-urlencoded"
            }).setSearch({ client_id: authorization.client_id, token: authorization.token }).fetch();
            if (request.ok)
                return { ok: true, status: 200 };
            else
                return await getResponse(request);
        }
        catch (e) {
            return getError(e);
        }
    }
    Request.OAuth2Revoke = OAuth2Revoke;
    let OAuth2Token;
    (function (OAuth2Token) {
        /**
         * Gets app access token from [client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow)
         * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
         * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
         */
        async function ClientCredentials(client_id, client_secret) {
            try {
                const request = await new FetchBuilder("https://id.twitch.tv/oauth2/token", "POST").setHeaders({
                    "Content-Type": "x-www-form-urlencoded"
                }).setSearch({ client_id, client_secret, grant_type: "client_credentials" }).fetch();
                return await getResponse(request);
            }
            catch (e) {
                return getError(e);
            }
        }
        OAuth2Token.ClientCredentials = ClientCredentials;
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
        async function AuthorizationCode(client_id, client_secret, redirect_uri, code) {
            try {
                const request = await new FetchBuilder("https://id.twitch.tv/oauth2/token", "POST").setHeaders({
                    "Content-Type": "x-www-form-urlencoded"
                }).setSearch({ client_id, client_secret, redirect_uri, code, grant_type: "authorization_code" }).fetch();
                const response = await getResponse(request);
                if (request.ok) {
                    if (!response.scopes)
                        response.scopes = [];
                }
                return response;
            }
            catch (e) {
                return getError(e);
            }
        }
        OAuth2Token.AuthorizationCode = AuthorizationCode;
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
        async function RefreshToken(client_id, client_secret, refresh_token) {
            try {
                const request = await new FetchBuilder("https://id.twitch.tv/oauth2/token", "POST").setHeaders({
                    "Content-Type": "x-www-form-urlencoded"
                }).setSearch({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }).fetch();
                const response = await getResponse(request);
                if (request.ok) {
                    if (!response.scopes)
                        response.scopes = [];
                }
                return response;
            }
            catch (e) {
                return getError(e);
            }
        }
        OAuth2Token.RefreshToken = RefreshToken;
    })(OAuth2Token = Request.OAuth2Token || (Request.OAuth2Token = {}));
})(Request || (Request = {}));
