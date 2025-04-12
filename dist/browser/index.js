/**
 * Basic `fetch()` function, but with some improvements:
 * - `init.search`  - URL search/query parameters
 * - `init.hash`    - URL hash/fragment parameters
 * - `init.timeout` - time in milliseconds after which request will be aborted with reason `RequestTimeout`, works only if value more than `0`
 */
export function AdvancedFetch(input, init) {
    if (!init)
        init = {};
    var timeout = AdvancedFetchGlobalTimeout;
    if (init.search) {
        var postfix = "?";
        var added = false;
        for (let [k, v] of Object.entries(init.search))
            if (v) {
                postfix += encodeURI(`${k}=${v}&`);
                added = true;
            }
        if (added)
            input += postfix.substring(0, postfix.length - 1);
        delete init.search;
    }
    if (init.hash) {
        var postfix = "#";
        var added = false;
        for (let [k, v] of Object.entries(init.hash))
            if (v) {
                input += encodeURI(`${k}=${v}&`);
                added = true;
            }
        if (added)
            input += postfix.substring(0, postfix.length - 1);
        delete init.hash;
    }
    if (init.timeout) {
        timeout = init.timeout;
        delete init.timeout;
    }
    if (timeout > 0 && !init.signal) {
        const controller = new AbortController();
        init.signal = controller.signal;
        setTimeout(() => controller.abort("RequestTimeout"), timeout);
    }
    return fetch(input, init);
}
/** in milliseconds */
export var AdvancedFetchGlobalTimeout = 5000;
export var EventSub;
(function (EventSub) {
    /**
     * Starts WebSocket for subscribing and getting EventSub events
     * - Reconnects in `reconnect_ms`, if WebSocket was closed
     * @param reconnect_ms If less then `1`, WebSocket will be not reconnected after `onClose()`, default value is `500`
     */
    function startWebSocket(token_data, reconnect_ms) {
        if (!reconnect_ms)
            reconnect_ms = 500;
        const connection = new Connection(new WebSocket(EventSub.WebSocketURL), token_data);
        async function onMessage(e) {
            if (connection.keepalive_timeout) {
                clearTimeout(connection.keepalive_timeout);
                delete connection.keepalive_timeout;
            }
            const message = JSON.parse(e.data);
            await connection.onMessage(message);
            if (Message.isSessionWelcome(message)) {
                const is_reconnected = connection.session?.status === "reconnecting";
                connection.session = message.payload.session;
                connection.onSessionWelcome(message, is_reconnected);
            }
            else if (Message.isSessionKeepalive(message)) {
                connection.keepalive_timeout = setTimeout(() => connection.ws.close(4005, `NetworkTimeout: client doesn't received any message within ${connection.session.keepalive_timeout_seconds} seconds`), (connection.session.keepalive_timeout_seconds + 2) * 1000);
                connection.onSessionKeepalive(message);
            }
            else if (Message.isSessionReconnect(message)) {
                connection.session.status = "reconnecting";
                connection.ws.onmessage = _ => { };
                connection.ws.onclose = _ => { };
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
                connection.ws.onmessage = onMessage;
                connection.ws.onclose = onClose;
            }, reconnect_ms);
            connection.onClose(e.code, e.reason);
        }
        connection.ws.onmessage = onMessage;
        connection.ws.onclose = onClose;
        return connection;
    }
    EventSub.startWebSocket = startWebSocket;
    EventSub.WebSocketURL = "wss://eventsub.wss.twitch.tv/ws";
    class Connection {
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
         * @param is_reconnected If its not first `session_welcome` message, if `false`, then you can subscribe to events
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
            await this.onClose(1000, `ClientRefused: Client closed the connection`);
            this.ws.onclose = _ => { };
            this.ws.onmessage = _ => { };
            this.ws.close();
        }
    }
    EventSub.Connection = Connection;
    let Subscription;
    (function (Subscription) {
        /** @param session_id An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message) */
        function Transport(session_id) { return { method: "websocket", session_id }; }
        Subscription.Transport = Transport;
        /**
         * @param session_id An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the [Welcome message](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#welcome-message)
         * @param broadcaster_user_id The User ID of the channel to receive chat message events for
         * @param user_id The User ID to read chat as, usually just id of token owner
         */
        function ChannelChatMessage(session_id, broadcaster_user_id, user_id) {
            return { type: "channel.chat.message", version: "1", condition: { broadcaster_user_id, user_id }, transport: Transport(session_id) };
        }
        Subscription.ChannelChatMessage = ChannelChatMessage;
    })(Subscription = EventSub.Subscription || (EventSub.Subscription = {}));
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
            function isChannelChatMessage(data) { return data.metadata.subscription_type === "channel.chat.message" && data.metadata.subscription_version === "1"; }
            Notification.isChannelChatMessage = isChannelChatMessage;
        })(Notification = Message.Notification || (Message.Notification = {}));
    })(Message = EventSub.Message || (EventSub.Message = {}));
})(EventSub || (EventSub = {}));
function getErrorMessage(method, error) {
    if (error instanceof Error)
        return `(${method}) ${error.message}`;
    if (typeof error === 'string')
        return `(${method}) ${error}`;
    return `(${method}) Unknown error`;
}
export var Request;
(function (Request) {
    /**
     * Gets the broadcaster’s list of non-private, blocked words or phrases. These are the terms that the broadcaster or moderator added manually or that were denied by AutoMod. [Read More](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:blocked_terms** or **moderator:manage:blocked_terms** scope
     * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value
     */
    async function GetBlockedTerms(authorization, broadcaster_id, first, after, init) {
        try {
            if (!(authorization.scopes.includes("moderator:read:blocked_terms") || authorization.scopes.includes("moderator:manage:blocked_terms")))
                return { status: 401, message: "The user access token must include moderator:read:blocked_terms or moderator:manage:blocked_terms scope." };
            const url = "https://api.twitch.tv/helix/moderation/blocked_terms";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "GET";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.search)
                init.search = { broadcaster_id, moderator_id: authorization.user_id, first, after };
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("GetBlockedTerms", e) };
        }
    }
    Request.GetBlockedTerms = GetBlockedTerms;
    /**
     * Adds a word or phrase as token owner to the broadcaster’s list of blocked terms. These are the terms that the broadcaster doesn’t want used in their chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope
     * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
     * @param text The word or phrase to block from being used in the broadcaster’s chat room. The term must contain a minimum of 2 characters and may contain up to a maximum of 500 characters. Terms may include a wildcard character (*). The wildcard character must appear at the beginning or end of a word or set of characters. For example, \*foo or foo\*. If the blocked term already exists, the response contains the existing blocked term
     */
    async function AddBlockedTerm(authorization, broadcaster_id, text, init) {
        try {
            if (!authorization.scopes.includes("moderator:manage:blocked_terms"))
                return { status: 401, message: "The user access token must include moderator:manage:blocked_terms scope." };
            if (text.length < 2)
                throw "The length of the term in the text field is too short. The term must contain a minimum of 2 characters.";
            if (text.length > 500)
                throw "The length of the term in the text field is too long. The term may contain up to a maximum of 500 characters.";
            const url = "https://api.twitch.tv/helix/moderation/blocked_terms";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "POST";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.search)
                init.search = { broadcaster_id, moderator_id: authorization.user_id };
            if (!init.body)
                init.body = JSON.stringify({ text });
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            if (response.status === 200)
                response.data = response.data[0];
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("AddBlockedTerm", e) };
        }
    }
    Request.AddBlockedTerm = AddBlockedTerm;
    /**
     * Removes the word or phrase as token owner from the broadcaster’s list of blocked terms. [Read More](https://dev.twitch.tv/docs/api/reference/#remove-blocked-term)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:blocked_terms** scope
     * @param broadcaster_id The ID of the broadcaster that owns the list of blocked terms
     * @param id The ID of the blocked term to remove from the broadcaster’s list of blocked terms
     */
    async function RemoveBlockedTerm(authorization, broadcaster_id, id, init) {
        try {
            if (!authorization.scopes.includes("moderator:manage:blocked_terms"))
                return { status: 401, message: "The user access token must include moderator:manage:blocked_terms scope." };
            const url = "https://api.twitch.tv/helix/moderation/blocked_terms";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "DELETE";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`
                };
            if (!init.search)
                init.search = { broadcaster_id, moderator_id: authorization.user_id, id };
            const request = await AdvancedFetch(url, init);
            if (request.status === 204)
                return { status: 204 };
            else
                return await request.json();
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("RemoveBlockedTerm", e) };
        }
    }
    Request.RemoveBlockedTerm = RemoveBlockedTerm;
    /**
     * Validates access token and if its valid, returns data of it. [Read More](https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token)
     * @param authorization Access token data or token itself to validate
     */
    async function OAuth2Validate(token_data, init) {
        const token = typeof token_data === "string" ? token_data : token_data.token;
        try {
            if (token.length < 1)
                return { status: 401, message: "invalid access token" };
            const url = "https://id.twitch.tv/oauth2/validate";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "GET";
            if (!init.headers)
                init.headers = {
                    "Authorization": `Bearer ${token}`
                };
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            response.token = token;
            if (response.status === 200) {
                if (!response.scopes)
                    response.scopes = [];
                response.user_login = response.login;
                delete response.login;
                response.type = (response.user_id || response.user_login) ? "user" : "app";
            }
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("OAuth2Validate", e), token };
        }
    }
    Request.OAuth2Validate = OAuth2Validate;
    /**
     * If your app no longer needs an access token, you can revoke it by this method. [Read More](https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-token)
     * @param authorization Access token data to revoke
     */
    async function OAuth2Revoke(authorization, init) {
        try {
            if (authorization.token.length < 1)
                throw "invalid access token";
            const url = "https://id.twitch.tv/oauth2/revoke";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "POST";
            if (!init.headers)
                init.headers = {
                    "Content-Type": "application/x-www-form-urlencoded"
                };
            if (!init.search)
                init.search = { client_id: authorization.client_id, token: authorization.token };
            const request = await AdvancedFetch(url, init);
            if (request.status === 200)
                return { status: 200 };
            else
                return await request.json();
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("OAuth2Revoke", e) };
        }
    }
    Request.OAuth2Revoke = OAuth2Revoke;
    /**
     * Creates an EventSub subscription. If you using `EventSub.startWebSocket` method, you must use this function in `onSessionWelcome` callback. [Read More](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
     * @param authorization
     * 1. If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token. If the subscription type requires user authorization, the user must have granted your app (client ID) permissions to receive those events before you subscribe to them. For example, to subscribe to [channel.subscribe](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe) events, your app must get a user access token that includes the `channel:read:subscriptions` scope, which adds the required permission to your app access token’s client ID
     * 2. If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. If the subscription type requires user authorization, the token must include the required scope. However, if the subscription type doesn’t include user authorization, the token may include any scopes or no scopes
     * 3. If you use [Conduits to receive events](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/), the request must specify an app access token. The request will fail if you use a user access token
     * @param subscription `EventSub.Subscription` type to subscribe
     */
    async function CreateEventSubSubscription(authorization, subscription, init) {
        try {
            const url = "https://api.twitch.tv/helix/eventsub/subscriptions";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "POST";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.body)
                init.body = JSON.stringify(subscription);
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            if (response.status === 202)
                response.data = response.data[0];
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("CreateEventSubSubscription", e) };
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
    async function DeleteEventSubSubscription(authorization, id, init) {
        try {
            const url = "https://api.twitch.tv/helix/eventsub/subscriptions";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "DELETE";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.search)
                init.search = { id };
            const request = await AdvancedFetch(url, init);
            if (request.status === 204)
                return { status: 204 };
            else
                return await request.json();
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("DeleteEventSubSubscription", e) };
        }
    }
    Request.DeleteEventSubSubscription = DeleteEventSubSubscription;
    /**
     * Gets information about one or more users. [Read More](https://dev.twitch.tv/docs/api/reference/#get-users)
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param query Specifies query of request:
     * - You may look up users using their user ID, login name, or both but the sum total of the number of users you may look up is 100. For example, you may specify 50 IDs and 50 names or 100 IDs or names, but you cannot specify 100 IDs and 100 names.
     * - If you don’t specify IDs or login names, the request returns information about the user in the access token if you specify a user access token.
     * - To include the user’s verified email address in the response, you must use a user access token that includes the **user:read:email** scope.
     */
    async function GetUsers(authorization, query, init) {
        try {
            const url = "https://api.twitch.tv/helix/users";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "GET";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`
                };
            if (!init.search)
                init.search = query;
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("GetUsers", e) };
        }
    }
    Request.GetUsers = GetUsers;
    /**
     * Sends a message as token owner to the broadcaster’s chat room. [Read More](https://dev.twitch.tv/docs/api/reference/#send-chat-message)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the `user:write:chat` scope
     * @param broadcaster_id The ID of the broadcaster whose chat room the message will be sent to
     * @param message The message to send. The message is limited to a maximum of 500 characters. Chat messages can also include emoticons. To include emoticons, use the name of the emote. The names are case sensitive. Don’t include colons around the name (e.g., :bleedPurple:). If Twitch recognizes the name, Twitch converts the name to the emote before writing the chat message to the chat room
     * @param reply_parent_message_id The ID of the chat message being replied to
     */
    async function SendChatMessage(authorization, broadcaster_id, message, reply_parent_message_id, init) {
        try {
            if (!authorization.scopes.includes("user:write:chat"))
                return { status: 401, message: "The user access token must include user:write:chat scope." };
            const url = "https://api.twitch.tv/helix/chat/messages";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "POST";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.search)
                init.search = { broadcaster_id, sender_id: authorization.user_id, message, reply_parent_message_id };
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            if (response.status === 200)
                response.data = response.data[0];
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("SendChatMessage", e) };
        }
    }
    Request.SendChatMessage = SendChatMessage;
    /**
     * Updates a channel’s properties of token owner. [Read More](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)
     * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:broadcast** scope
     * @param body All fields are optional, but you must specify at least one field
     */
    async function ModifyChannelInformation(authorization, body, init) {
        try {
            if (!authorization.scopes.includes("channel:manage:broadcast"))
                return { status: 401, message: "The user access token must include channel:manage:broadcast scope." };
            if (Object.keys(body).length === 0)
                throw `You must specify at least one field in request body!`;
            const url = "https://api.twitch.tv/helix/channels";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "PATCH";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.search)
                init.search = { broadcaster_id: authorization.user_id };
            if (!init.body)
                init.body = JSON.stringify(body);
            const request = await AdvancedFetch(url, init);
            if (request.status === 204)
                return { status: 204 };
            else
                return await request.json();
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("ModifyChannelInformation", e) };
        }
    }
    Request.ModifyChannelInformation = ModifyChannelInformation;
    /** Gets the games or categories that match the specified query. [Read More](https://dev.twitch.tv/docs/api/reference/#search-categories)
     * - To match, the category’s name must contain all parts of the query string. For example, if the query string is 42, the response includes any category name that contains 42 in the title. If the query string is a phrase like *love computer*, the response includes any category name that contains the words love and computer anywhere in the name. The comparison is case insensitive.
     * @param authorization [App access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
     * @param query The search string
     * @param first The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20
     * @param after The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
     */
    async function SearchCategories(authorization, query, first, after, init) {
        try {
            const url = "https://api.twitch.tv/helix/search/categories";
            if (!init)
                init = {};
            if (!init.method)
                init.method = "GET";
            if (!init.headers)
                init.headers = {
                    "Client-Id": authorization.client_id,
                    "Authorization": `Bearer ${authorization.token}`,
                    "Content-Type": "application/json"
                };
            if (!init.search)
                init.search = { query, first, after };
            const request = await AdvancedFetch(url, init);
            const response = await request.json();
            response.status = request.status;
            return response;
        }
        catch (e) {
            return { status: 400, message: getErrorMessage("SearchCategories", e) };
        }
    }
    Request.SearchCategories = SearchCategories;
})(Request || (Request = {}));
