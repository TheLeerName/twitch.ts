import * as ResponseBody from "./responsebody";

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

export * as EventSub from "./eventsub";
export * as Request from "./request";
export * as RequestBody from "./requestbody";
export * as ResponseBody from "./responsebody";