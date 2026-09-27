import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `moderator:manage:shoutouts`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) that includes scope `moderator:manage:shoutouts` and `user:bot` (for the user represented by the `moderator_id`) or `channel:bot` (for the user represented by the `broadcaster_id`). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster that’s sending the Shoutout. */
	from_broadcaster_id: string;
	/** The ID of the broadcaster that’s receiving the Shoutout. */
	to_broadcaster_id: string;
	/** The ID of the broadcaster or a user that is one of the broadcaster’s moderators. This ID must match the user ID in the access token. */
	moderator_id: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

/**
 * ## [Send Shoutout](https://dev.twitch.tv/docs/api/reference/#send-a-shoutout)
 * Sends a Shoutout to the specified broadcaster. Typically, you send Shoutouts when you or one of your moderators notice another broadcaster in your chat, the other broadcaster is coming up in conversation, or after they raid your broadcast.

 * Twitch’s Shoutout feature is a great way for you to show support for other broadcasters and help them grow. Viewers who do not follow the other broadcaster will see a pop-up Follow button in your chat that they can click to follow the other broadcaster. [Learn More](https://help.twitch.tv/s/article/shoutouts)

 * **Rate Limits**: The broadcaster may send a Shoutout once every 2 minutes. They may send the same broadcaster a Shoutout once every 60 minutes.

 * To receive notifications when a Shoutout is sent or received, subscribe to the [channel.shoutout.create](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshoutoutcreate) and [channel.shoutout.receive](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelshoutoutreceive) subscription types. The **channel.shoutout.create** event includes cooldown periods that indicate when the broadcaster may send another Shoutout without exceeding the endpoint’s rate limit.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the specified broadcaster a Shoutout.
 * 400 Bad Request|The `from_broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `from_broadcaster_id` query parameter is not valid.
 * ㅤ|The `to_broadcaster_id` query parameter is required.
 * ㅤ|The ID in the `to_broadcaster_id` query parameter is not valid.
 * ㅤ|The broadcaster may not give themselves a Shoutout.
 * ㅤ|The broadcaster is not streaming live or does not have one or more viewers.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * ㅤ|The Authorization header is required and must contain a user access token.
 * ㅤ|The user access token must include the **moderator:manage:shoutouts** scope.
 * ㅤ|The access token is not valid.
 * ㅤ|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 * ㅤ|The broadcaster may not send the specified broadcaster a Shoutout.
 * 429 Too Many Requests|The broadcaster exceeded the number of Shoutouts they may send within a given window. See the endpoint's Rate Limits.
 * ㅤ|The broadcaster exceeded the number of Shoutouts they may send the same broadcaster within a given window. See the endpoint's Rate Limits.
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<undefined>> {
	const url = new Helix.URL(params.apiPath ?? "chat/shoutouts", Options.apiHelixPath);
	url.searchParams.appendMany({
		from_broadcaster_id: params.from_broadcaster_id,
		to_broadcaster_id: params.to_broadcaster_id,
		moderator_id: params.moderator_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}