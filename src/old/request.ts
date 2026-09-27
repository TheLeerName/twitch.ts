import { Authorization, Options } from ".";
import * as RequestBody from "./requestbody";
import * as ResponseBody from "./responsebody";
import * as EventSub from "./eventsub";
import { GetBitsLeaderboard, GetCustomRewardRedemptions, UpdateCustomRewardRedemptionStatus } from './responsebody';

/**
 * ### [Start Commercial](https://dev.twitch.tv/docs/api/reference/#start-commercial)
 * Starts a commercial on the specified channel.

 * **NOTE**: Only partners and affiliates may run commercials and they must be streaming live at the time.

 * **NOTE**: Only the broadcaster may start a commercial; the broadcaster’s editors and moderators may not start commercials on behalf of the broadcaster.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:edit:commercial** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has the **channel:edit:commercial** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully started the commercial.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `length` query parameter is required.
 * .|The ID in `broadcaster_id` is not valid.
 * .|To start a commercial, the broadcaster must be streaming live.
 * .|The broadcaster may not run another commercial until the cooldown period expires. The `retry_after` field in the previous start commercial response specifies the amount of time the broadcaster must wait between running commercials.
 * 401 Unauthorized|The ID in `broadcaster_id` must match the user ID found in the request’s OAuth token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **channel:edit:commercial** scope.
 * .|The OAuth token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The ID in `broadcaster_id` was not found.
 * 429 Too Many Requests|The broadcaster may not run another commercial until the cooldown period expires. The `retry_after` field in the previous start commercial response specifies the amount of time the broadcaster must wait between running commercials.

 * @param params {@link RequestBody.StartCommercial | StartCommercial}: client_id, token, broadcaster_id, length
 */
export async function StartCommercial(params: RequestBody.StartCommercial): Promise<ResponseBody.StartCommercial | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/commercial`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ broadcaster_id: params.broadcaster_id, length: params.length }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Ad Schedule](https://dev.twitch.tv/docs/api/reference/#get-ad-schedule)
 * This endpoint returns ad schedule related information, including snooze, when the last ad was run, when the next ad is scheduled, and if the channel is currently in pre-roll free time. Note that a new ad cannot be run until 8 minutes after running a previous ad.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:ads** scope. The user ID associated with the token must match the `broadcaster_id` in the query parameter.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has the **channel:read:ads** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Returns the ad schedule information for the channel.
 * 400 Bad Request|The broadcaster ID is not valid.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetAdSchedule | GetAdSchedule}: client_id, token, broadcaster_id
 */
export async function GetAdSchedule(params: RequestBody.GetAdSchedule): Promise<ResponseBody.GetAdSchedule | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/ads`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request, true);
	} catch (e) { return getError(e) }
}

/**
 * ### [Snooze Next Ad](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
 * If available, pushes back the timestamp of the upcoming automatic mid-roll ad by 5 minutes. This endpoint duplicates the snooze functionality in the creator dashboard’s Ads Manager. [Read More](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:ads** scope. The user ID associated with the token must match the `broadcaster_id` in the query parameter.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has the **channel:manage:ads** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|User’s next ad is successfully snoozed. Their `snooze_count` is decremented and `snooze_refresh_time` and `next_ad_at` are both updated.
 * 400 Bad Request|The channel is not currently live.
 * .|The broadcaster ID is not valid.
 * .|Channel does not have an upcoming scheduled ad break.
 * 429 Too Many Requests|Channel has no snoozes left.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SnoozeNextAd | SnoozeNextAd}: client_id, token, broadcaster_id
 */
export async function SnoozeNextAd(params: RequestBody.SnoozeNextAd): Promise<ResponseBody.SnoozeNextAd | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/ads/schedule/snooze`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch (e) { return getError(e) }
}

/**
 * ### [Get Extension Analytics](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)
 * Gets an analytics report for one or more extensions. The response contains the URLs used to download the reports (CSV files). [Read More](https://dev.twitch.tv/docs/insights)

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **analytics:read:extensions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's analytics reports.
 * 400 Bad Request|The start and end dates are optional but if you specify one, you must specify the other.
 * .|The end date must be equal to or later than the start date.
 * .|The cursor specified in the `after` query parameter is not valid.
 * .|The resource supports only forward pagination (use the `after` query parameter).
 * .|The `first` query parameter is outside the allowed range of values.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **analytics:read:extensions** scope.
 * .|The OAuth token is not valid.
 * .|The Client-Id header is required.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The extension specified in the `extension_id` query parameter was not found.

 * @param params {@link RequestBody.GetExtensionAnalytics | GetExtensionAnalytics}: client_id, token, (extension_id | after)?, type?, (started_at & ended_at)?, first?
 */
export async function GetExtensionAnalytics(params: RequestBody.GetExtensionAnalytics): Promise<ResponseBody.GetExtensionAnalytics | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/analytics/extensions`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ extension_id: params.extension_id, type: params.type, started_at: params.started_at, ended_at: params.ended_at, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Game Analytics](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)
 * Gets an analytics report for one or more games. The response contains the URLs used to download the reports (CSV files). [Learn More](https://dev.twitch.tv/docs/insights)

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **analytics:read:games** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s analytics reports.
 * 400 Bad Request|The start and end dates are optional but if you specify one, you must specify the other.
 * .|The end date must be equal to or later than the start date.
 * .|The cursor specified in the `after` query parameter is not valid.
 * .|The resource supports only forward pagination (use the `after` query parameter).
 * .|The `first` query parameter is outside the allowed range of values.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **analytics:read:games** scope.
 * .|The OAuth token is not valid.
 * .|The Client-Id header is required.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The game specified in the `game_id` query parameter was not found.

 * @param params {@link RequestBody.GetGameAnalytics | GetGameAnalytics}: client_id, token, (game_id | after)?, type?, (started_at & ended_at)?, first?
 */
export async function GetGameAnalytics(params: RequestBody.GetGameAnalytics): Promise<ResponseBody.GetGameAnalytics | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/analytics/games`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ game_id: params.game_id, type: params.type, started_at: params.started_at, ended_at: params.ended_at, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Bits Leaderboard](https://dev.twitch.tv/docs/api/reference/#get-bits-leaderboard)
 * Gets the Bits leaderboard for the authenticated broadcaster.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **bits:read** scope.

 * ### Response Codes
 * Code|Description
 * 200 OK|Successfully retrieved the broadcaster’s Bits leaderboard.
 * 400 Bad Request|The time period specified in the `period` query parameter is not valid.
 * .|The `started_at` query parameter is required if `period` is not set to `all`.
 * .|The value in the `count` query parameter is outside the range of allowed values.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * .|The user access token must include the the **bits:read** scope.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.

 * @param params {@link RequestBody.GetBitsLeaderboard | GetBitsLeaderboard}: client_id, token, count?, (period & started_at)?, user_id?
 */
export async function GetBitsLeaderboard(params: RequestBody.GetBitsLeaderboard): Promise<ResponseBody.GetBitsLeaderboard | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/bits/leaderboard`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ count: params.count, period: params.period, started_at: params.started_at, user_id: params.user_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}


/**
 * ### [Get Cheermotes](https://dev.twitch.tv/docs/api/reference/#get-cheermotes)
 * Gets a list of Cheermotes that users can use to cheer Bits in any Bits-enabled channel’s chat room. Cheermotes are animated emotes that viewers can assign Bits to.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the Cheermotes.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.

 * @param params {@link RequestBody.GetCheermotes | GetCheermotes}: client_id, token, broadcaster_id?
 */
export async function GetCheermotes(params: RequestBody.GetCheermotes): Promise<ResponseBody.GetCheermotes | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/bits/cheermotes`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Custom Power-ups](https://dev.twitch.tv/docs/api/reference/#get-custom-power-up)
 * Gets a list of custom Power-ups that the specified broadcaster created.

 * **NOTE**: A channel may offer a maximum of 50 custom Power-ups, which includes both enabled and disabled Power-ups.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **bits:read** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of custom Power-ups.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The request exceeds the maximum number of `id` query parameters that you may specify.
 * 401 Unauthorized|The Authorization header must specify a user access token.
 * .|The user access token must include the **bits:read** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 * 404 Not Found|All of the custom Power-ups specified using the `id` query parameter were not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).
 * 
 * @param params {@link RequestBody.GetCustomPowerups | GetCustomPowerups}: client_id, token, broadcaster_id, id?
 */
export async function GetCustomPowerups(params: RequestBody.GetCustomPowerups): Promise<ResponseBody.GetCustomPowerups | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/bits/custom_power_ups`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, id: params.id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Extension Transactions](https://dev.twitch.tv/docs/api/reference/#get-extension-transactions)
 * Gets an extension’s list of transactions. A transaction records the exchange of a currency (for example, Bits) for a digital product.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of transactions.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * .|The request specified too many `id` query parameters.
 * .|The pagination cursor is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token.
 * .|The access token is not valid.
 * .|The ID in the `extension_id` query parameter must match the client ID in the access token.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|One or more of the transaction IDs specified using the `id` query parameter were not found.
 * 
 * @param params {@link RequestBody.GetExtensionTransactions | GetExtensionTransactions}: client_id, token, extension_id, id?, first?, after?
 */
export async function GetExtensionTransactions(params: RequestBody.GetExtensionTransactions): Promise<ResponseBody.GetExtensionTransactions<typeof params.extension_id> | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/transactions`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ extension_id: params.extension_id, id: params.id, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Channel Information](https://dev.twitch.tv/docs/api/reference/#get-channel-information)
 * Gets information about one or more channels.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of channels.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The broadcaster ID is not valid.
 * .|The number of `broadcaster_id` query parameters exceeds the maximum allowed.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 429 Too Many Requests|The application exceeded the number of calls it may make per minute. For details, see [Rate Limits](https://dev.twitch.tv/docs/api/guide#twitch-rate-limits).
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).
 * 
 * @param params {@link RequestBody.GetChannelInformation | GetChannelInformation}: client_id, token, broadcaster_id
 */
export async function GetChannelInformation(params: RequestBody.GetChannelInformation): Promise<ResponseBody.GetChannelInformation | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Modify Channel Information](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)
 * Updates a channel’s properties.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:broadcast** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the channel’s properties.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The request must update at least one property.
 * .|The `title` field may not contain an empty string.
 * .|The ID in `game_id` is not valid.
 * .|To update the `delay` field, the broadcaster must have partner status.
 * .|The list in the `tags` field exceeds the maximum number of tags allowed.
 * .|A tag in the `tags` field exceeds the maximum length allowed.
 * .|A tag in the `tags` field is empty.
 * .|A tag in the `tags` field contains special characters or spaces.
 * .|One or more tags in the `tags` field failed AutoMod review.
 * .|Game restricted for user's age and region.
 * .|Title exceeds the 140 character limit.
 * 401 Unauthorized|User requests CCL for a channel they don’t own.
 * .|The ID in `broadcaster_id` must match the user ID found in the OAuth token.
 * .|The Authorization header is required and must specify a user access token.
 * .|The OAuth token must include the **channel:manage:broadcast** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|User requested gaming CCLs to be added to their channel.
 * .|Unallowed CCLs declared for underaged authorized user in a restricted country.
 * 429 Too Many Requests|User set the Branded Content flag too frequently.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.ModifyChannelInformation | ModifyChannelInformation}: client_id, token, broadcaster_id, (game_id &| broadcaster_language &| title &| delay &| tags &| content_classification_labels &| is_branded_content).count > 1
 */
export async function ModifyChannelInformation(params: RequestBody.ModifyChannelInformation): Promise<ResponseBody.ModifyChannelInformation | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setSearch({ broadcaster_id: params.broadcaster_id }).setBody({
			game_id: params.game_id,
			broadcaster_language: params.broadcaster_language,
			title: params.title,
			delay: params.delay,
			tags: params.tags,
			content_classification_labels: params.content_classification_labels,
			is_branded_content: params.is_branded_content
		}).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Channel Editors](https://dev.twitch.tv/docs/api/reference/#get-channel-editors)
 * Gets the broadcaster’s list editors.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:editors** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's list of editors.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID found in the OAuth token.
 * .|The Authorization header is required and must specify a user access token.
 * .|The OAuth token must include the **channel:read:editors** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.

 * @param params {@link RequestBody.GetChannelEditors | GetChannelEditors}: client_id, token, broadcaster_id
 */
export async function GetChannelEditors(params: RequestBody.GetChannelEditors): Promise<ResponseBody.GetChannelEditors | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/editors`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Followed Channels](https://dev.twitch.tv/docs/api/reference/#get-followed-channels)
 * Gets a list of broadcasters that the specified user follows. You can also use this endpoint to see whether a user follows a specific broadcaster.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:follows** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster's list of followers.
 * 400 Bad Request|The `user_id` query parameter is required.
 * .|The `broadcaster_id` query parameter is not valid.
 * .|The `user_id` query parameter is required.
 * 401 Unauthorized|The ID in the `user_id` query parameter must match the user ID in the access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token is missing the **user:read:follows** scope.
 * .|The OAuth token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.

 * @param params {@link RequestBody.GetFollowedChannels | GetFollowedChannels}: client_id, token, user_id, broadcaster_id?, first?, after?
 */
export async function GetFollowedChannels(params: RequestBody.GetFollowedChannels): Promise<ResponseBody.GetFollowedChannels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/followed`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ user_id: params.user_id, broadcaster_id: params.broadcaster_id, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Channel Followers](https://dev.twitch.tv/docs/api/reference/#get-channel-followers)
 * Gets a list of users that follow the specified broadcaster. You can also use this endpoint to see whether a specific user follows the broadcaster.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:followers** scope. The ID in the `broadcaster_id` query parameter must match the user ID in the access token or the user ID in the access token must be a moderator for the specified broadcaster.

 * If a scope is not provided or the user isn’t the broadcaster or a moderator for the specified channel, only the total follower count will be included in the response.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of followers.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the access token or the user must be a moderator for the specified broadcaster.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token is missing the **moderator:read:followers** scope.
 * .|The OAuth token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * .|The `user_id` parameter was specified but either the user access token is missing the **moderator:read:followers** scope or the user is not the broadcaster or moderator for the specified channel.

 * @param params {@link RequestBody.GetChannelFollowers | GetChannelFollowers}: client_id, token, user_id, broadcaster_id?, first?, after?
 */
export async function GetChannelFollowers(params: RequestBody.GetChannelFollowers): Promise<ResponseBody.GetChannelFollowers | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/followers`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, user_id: params.user_id, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Create Custom Rewards](https://dev.twitch.tv/docs/api/reference/#create-custom-rewards)
 * Creates a Custom Reward in the broadcaster’s channel. The maximum number of custom rewards per channel is 50, which includes both enabled and disabled rewards.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the custom reward.
 * 400 Bad Request|The request exceeds the maximum number of rewards allowed per channel.
 * .|The `broadcaster_id` query parameter is required.
 * .|The `title` field is required.
 * .|The `title` must contain a minimum of 1 character and a maximum of 45 characters.
 * .|The `title` must be unique amongst all of the broadcaster's custom rewards.
 * .|The `cost` field is required.
 * .|The `cost` field must contain a minimum of 1 point.
 * .|The `prompt` field is limited to a maximum of 200 characters.
 * .|If `is_max_per_stream_enabled` is **true**, the minimum value for `max_per_stream` is 1.
 * .|If `is_max_per_user_per_stream_enabled` is **true**, the minimum value for `max_per_user_per_stream` is 1.
 * .|If `is_global_cooldown_enabled` is **true**, the minimum value for `global_cooldown_seconds` is 1.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * .|The user access token is missing the **channel:manage:redemptions** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.

 * @param params {@link RequestBody.CreateCustomReward | CreateCustomReward}: client_id, token, broadcaster_id, title, cost, is_user_input_required?, prompt?, is_enabled?, background_color?,is_max_per_stream_enabled?, max_per_stream?, is_max_per_user_per_stream_enabled?, max_per_user_per_stream?, is_global_cooldown_enabled?, global_cooldown_seconds?, should_redemptions_skip_request_queue?
 */
export async function CreateCustomReward(params: RequestBody.CreateCustomReward): Promise<ResponseBody.CreateCustomReward | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channel_points/custom_rewards`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).setBody({
			title: params.title,
			cost: params.cost,
			prompt: params.prompt,
			is_enabled: params.is_enabled,
			background_color: params.background_color,
			is_user_input_required: params.is_user_input_required,
			is_max_per_stream_enabled: params.is_max_per_stream_enabled,
			max_per_stream: params.max_per_stream,
			is_max_per_user_per_stream_enabled: params.is_max_per_user_per_stream_enabled,
			max_per_user_per_stream: params.max_per_user_per_stream,
			is_global_cooldown_enabled: params.is_global_cooldown_enabled,
			global_cooldown_seconds: params.global_cooldown_seconds,
			should_redemptions_skip_request_queue: params.should_redemptions_skip_request_queue
		}).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Delete Custom Reward](https://dev.twitch.tv/docs/api/reference/#delete-custom-reward)
 * Deletes a custom reward that the broadcaster created.

 * The app used to create the reward is the only app that may delete it. If the reward’s redemption status is UNFULFILLED at the time the reward is deleted, its redemption status is marked as FULFILLED.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully deleted the custom reward.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * .|The user access token is missing the **channel:manage:redemptions** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.'
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to create the custom reward.
 * .|The broadcaster is not a partner or affiliate.
 * 404 Not Found|The custom reward specified in the id query parameter was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.DeleteCustomReward | DeleteCustomReward}: client_id, token, user_id, broadcaster_id, id
 */
export async function DeleteCustomReward(params: RequestBody.DeleteCustomReward): Promise<ResponseBody.DeleteCustomReward | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channel_points/custom_rewards`, "DELETE").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, id: params.id }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Custom Rewards](https://dev.twitch.tv/docs/api/reference/#get-custom-reward)
 * Gets a list of custom rewards that the specified broadcaster created.

 * **NOTE**: A channel may offer a maximum of 50 rewards, which includes both enabled and disabled rewards.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:redemptions** or **channel:manage:redemptions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of custom rewards.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The request exceeds the maximum number of id query parameters that you may specify.
 * 401 Unauthorized|The Authorization header must specify a user access token.
 * .|The user access token is missing the **channel:read:redemptions** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 * 404 Not Found|All of the custom rewards specified using the `id` query parameter were not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetCustomRewards | GetCustomRewards}: client_id, token, user_id, broadcaster_id, id?, only_manageable_rewards?
 */
export async function GetCustomRewards(params: RequestBody.GetCustomRewards): Promise<ResponseBody.GetCustomRewards | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channel_points/custom_rewards`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, id: params.id, only_manageable_rewards: params.only_manageable_rewards }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Custom Reward Redemptions](https://dev.twitch.tv/docs/api/reference/#get-custom-reward-redemption)
 * Gets a list of redemptions for the specified custom reward. The app used to create the reward is the only app that may get the redemptions.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:redemptions** or **channel:manage:redemptions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of redeemed custom rewards.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `reward_id` query parameter is required.
 * .|The `status` query parameter is required if you didn't specify the `id` query parameter.
 * .|The value in the `status` query parameter is not valid.
 * .|The value in the `sort` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * .|The user access token is missing the **channel:read:redemptions** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to create the custom reward.
 * .|The broadcaster is not a partner or affiliate.
 * 404 Not Found|All of the redemptions specified using the id query parameter were not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetCustomRewardRedemptions | GetCustomRewardRedemptions}: client_id, token, broadcaster_id, reward_id, (status | id)?, sort?, first?, after?
 */
export async function GetCustomRewardRedemptions(params: RequestBody.GetCustomRewardRedemptions): Promise<ResponseBody.GetCustomRewardRedemptions | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channel_points/custom_rewards/redemptions`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, reward_id: params.reward_id, status: params.status, id: params.id, sort: params.sort, after: params.after, first: params.first }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}
// TODO: start rewriting from this

/**
 * ### [Update Custom Reward](https://dev.twitch.tv/docs/api/reference/#update-custom-reward)
 * Updates a custom reward. The app used to create the reward is the only app that may update the reward.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the custom reward.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `id` query parameter is required.
 * .|The `status` query parameter is required if you didn't specify the `id` query parameter.
 * .|The `title` must contain a minimum of 1 character and a maximum of 45 characters.
 * .|The `title` must be unique amongst all of the broadcaster's custom rewards.
 * .|The `cost` field must contain a minimum of 1 point.
 * .|The `prompt` field is limited to a maximum of 200 characters.
 * .|If `is_max_per_stream_enabled` is **true**, the minimum value for `max_per_stream` is 1.
 * .|If `is_max_per_user_per_stream_enabled` is **true**, the minimum value for `max_per_user_per_stream` is 1.
 * .|If `is_global_cooldown_enabled` is **true**, the minimum value for `global_cooldown_seconds` is 1 and the maximum is 604800.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * .|The user access token is missing the **channel:manage:redemptions** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to update the custom reward.
 * .|The broadcaster is not a partner or affiliate.
 * 404 Not Found|The custom reward specified in the `id` query parameter was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateCustomReward | UpdateCustomReward}: client_id, token, broadcaster_id, id, title?, prompt?, cost?, background_color?, is_enabled?, is_user_input_required?, is_max_per_stream_enabled?, max_per_stream?, is_max_per_user_per_stream_enabled?, max_per_user_per_stream?, is_global_cooldown_enabled?, global_cooldown_seconds?, is_paused?, should_redemptions_skip_request_queue?
 */
export async function UpdateCustomReward(params: RequestBody.UpdateCustomReward): Promise<ResponseBody.UpdateCustomReward | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channel_points/custom_rewards`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, id: params.id }).setBody({
			title: params.title,
			prompt: params.prompt,
			cost: params.cost,
			background_color: params.background_color,
			is_enabled: params.is_enabled,
			is_user_input_required: params.is_user_input_required,
			is_max_per_stream_enabled: params.is_max_per_stream_enabled,
			max_per_stream: params.max_per_stream,
			is_max_per_user_per_stream_enabled: params.is_max_per_user_per_stream_enabled,
			max_per_user_per_stream: params.max_per_user_per_stream,
			is_global_cooldown_enabled: params.is_global_cooldown_enabled,
			global_cooldown_seconds: params.global_cooldown_seconds,
			is_paused: params.is_paused,
			should_redemptions_skip_request_queue: params.should_redemptions_skip_request_queue
		}).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Custom Reward Redemption Status](https://dev.twitch.tv/docs/api/reference/#update-redemption-status)
 * Updates a redemption’s status. You may update a redemption only if its status is UNFULFILLED. The app used to create the reward is the only app that may update the redemption.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:manage:redemptions** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the redemption’s status.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `reward_id` query parameter is required.
 * .|The `id` query parameter is required.
 * .|The value in the `status` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * .|The user access token is missing the **channel:manage:redemptions** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to update the redemption status.
 * .|The broadcaster is not a partner or affiliate.
 * 404 Not Found|The custom reward specified in the `reward_id` query parameter was not found.
 * .|The redemptions specified using the `id` query parameter were not found or their statuses weren't marked as UNFULFILLED.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateCustomRewardRedemptionStatus | UpdateCustomRewardRedemptionStatus}: client_id, token, id, broadcaster_id, reward_id, status
 */
export async function UpdateCustomRewardRedemptionStatus(params: RequestBody.UpdateCustomRewardRedemptionStatus): Promise<ResponseBody.UpdateCustomRewardRedemptionStatus | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channel_points/custom_rewards/redemptions`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ id: params.id, broadcaster_id: params.broadcaster_id, reward_id: params.reward_id }).setBody({ status: params.status }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Charity Campaigns](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign)
 * Gets information about the charity campaign that a broadcaster is running. For example, the campaign’s fundraising goal and the current amount of donations.

 * To receive events when progress is made towards the campaign’s goal or the broadcaster changes the fundraising goal, subscribe to the {@link EventSub.Subscription.ChannelCharityCampaignProgress | channel.charity_campaign.progress} subscription type.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:charity** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved information about the broadcaster’s active charity campaign.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token is missing the **channel:read:charity** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetCharityCampaigns | GetCharityCampaigns}: client_id, token, broadcaster_id
 */
export async function GetCharityCampaigns(params: RequestBody.GetCharityCampaigns): Promise<ResponseBody.GetCharityCampaigns | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/charity/campaigns`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Charity Campaign Donations](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations)
 * Gets the list of donations that users have made to the broadcaster’s active charity campaign.

 * To receive events as donations occur, subscribe to the {@link EventSub.Subscription.ChannelCharityCampaignDonate | channel.charity_campaign.donate} subscription type.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:charity** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of donations that users contributed to the broadcaster’s charity campaign.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `broadcaster_id` query parameter must match the user ID in the access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token is missing the **channel:read:charity** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetCharityCampaignDonations | GetCharityCampaignDonations}: client_id, token, broadcaster_id, first?, after?
 */
export async function GetCharityCampaignDonations(params: RequestBody.GetCharityCampaignDonations): Promise<ResponseBody.GetCharityCampaignDonations | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/charity/donations`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Chatters](https://dev.twitch.tv/docs/api/reference/#get-chatters)
 * Gets the list of users that are connected to the broadcaster’s chat session.

 * **NOTE**: There is a delay between when users join and leave a chat and when the list is updated accordingly.

 * To determine whether a user is a moderator or VIP, use the {@link GetModerators | Get Moderators} and {@link GetChannelVips | Get VIPs} endpoints. You can check the roles of up to 100 users.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:read:chatters** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has the **moderator:read:chatters** scope for the user represented by the `moderator_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of chatters.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The ID in the `broadcaster_id` query parameter is not valid.
 * .|The `moderator_id` query parameter is required.
 * .|The ID in the `moderator_id` query parameter is not valid.
 * 401 Unauthorized|The ID in the `moderator_id` query parameter must match the user ID in the access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token is missing the **moderator:read:chatters** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header must match the client ID specified in the access token.
 * 403 Forbidden|The user in the `moderator_id` query parameter is not one of the broadcaster's moderators.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetChatters | GetChatters}: client_id, token, broadcaster_id, moderator_id, first?, after?
 */
export async function GetChatters(params: RequestBody.GetChatters): Promise<ResponseBody.GetChatters | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/chatters`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Channel Emotes](https://dev.twitch.tv/docs/api/reference/#get-channel-emotes)
 * Gets the broadcaster’s list of custom emotes. Broadcasters create these custom emotes for users who subscribe to or follow the channel or cheer Bits in the channel’s chat window. [Learn More](https://dev.twitch.tv/docs/irc/emotes)

 * For information about the custom emotes, see [subscriber emotes](https://help.twitch.tv/s/article/subscriber-emote-guide), [Bits tier emotes](https://help.twitch.tv/s/article/custom-bit-badges-guide?language=bg#slots), and [follower emotes](https://blog.twitch.tv/en/2021/06/04/kicking-off-10-years-with-our-biggest-emote-update-ever/).

* **NOTE**: With the exception of custom follower emotes, users may use custom emotes in any Twitch chat.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved broadcaster's list of custom emotes.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetChannelEmotes | GetChannelEmotes}: client_id, token, broadcaster_id
 */
export async function GetChannelEmotes(params: RequestBody.GetChannelEmotes): Promise<ResponseBody.GetChannelEmotes | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/emotes`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Global Emotes](https://dev.twitch.tv/docs/api/reference/#get-global-emotes)
 * Gets the list of [global emotes](https://www.twitch.tv/creatorcamp/en/learn-the-basics/emotes/). Global emotes are Twitch-created emotes that users can use in any Twitch chat. [Learn More](https://dev.twitch.tv/docs/irc/emotes)

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved Twitch's list of global emotes.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.ClientIDAndAccessToken | ClientIDAndAccessToken}: client_id, token
 */
export async function GetGlobalEmotes(params: RequestBody.ClientIDAndAccessToken): Promise<ResponseBody.GetGlobalEmotes | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/emotes/global`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Emote Sets](https://dev.twitch.tv/docs/api/reference/#get-emote-sets)
 * Gets emotes for one or more specified emote sets.

 * An emote set groups emotes that have a similar context. For example, Twitch places all the subscriber emotes that a broadcaster uploads for their channel in the same emote set. [Learn More](https://dev.twitch.tv/docs/irc/emotes)

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the emotes for the specified emote sets.
 * 400 Bad Request|The `emote_set_id` query parameter is required.
 * .|The number of `emote_set_id` query parameters exceeds the maximum allowed.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetEmoteSets | GetEmoteSets}: client_id, token, emote_set_id
 */
export async function GetEmoteSets(params: RequestBody.GetEmoteSets): Promise<ResponseBody.GetEmoteSets | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/emotes/set`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ emote_set_id: params.emote_set_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Channel Chat Badges](https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges)
 * Gets the broadcaster’s list of custom chat badges. The list is empty if the broadcaster hasn’t created custom chat badges. For information about custom badges, see [subscriber badges](https://help.twitch.tv/s/article/subscriber-badge-guide) and [Bits badges](https://help.twitch.tv/s/article/custom-bit-badges-guide).

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s custom chat badges.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetChannelChatBadges | GetChannelChatBadges}: client_id, token, broadcaster_id
 */
export async function GetChannelChatBadges(params: RequestBody.GetChannelChatBadges): Promise<ResponseBody.GetChannelChatBadges | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/badge`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Global Chat Badges](https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges)
 * Gets Twitch’s list of chat badges, which users may use in any channel’s chat room. For information about chat badges, see [Twitch Chat Badges Guide](https://help.twitch.tv/s/article/twitch-chat-badges-guide).

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of global chat badges.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.ClientIDAndAccessToken | ClientIDAndAccessToken}: client_id, token, broadcaster_id
 */
export async function GetGlobalChatBadges(params: RequestBody.ClientIDAndAccessToken): Promise<ResponseBody.GetGlobalChatBadges | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/badges/global`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Chat Settings](https://dev.twitch.tv/docs/api/reference/#get-chat-settings)
 * Gets the broadcaster’s chat settings.

 * For an overview of chat settings, see [Chat Commands for Broadcasters and Moderators](https://help.twitch.tv/s/article/chat-commands#AllMods) and [Moderator Preferences](https://help.twitch.tv/s/article/setting-up-moderation-for-your-twitch-channel#modpreferences).

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s chat settings.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a valid app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetChatSettings | GetChatSettings}: client_id, token, broadcaster_id, moderator_id?
 */
export async function GetChatSettings(params: RequestBody.GetChatSettings): Promise<ResponseBody.GetChatSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/settings`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Shared Chat Session](https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session)
 * Retrieves the active shared chat session for a channel.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the shared chat session.
 * 400 Bad Request|The ID in the `broadcaster_id` query parameter is not valid.
 * 401 Unauthorized|The OAuth token is not valid.
 * .|The Authorization header is required and must contain a user access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetSharedChatSession | GetSharedChatSession}: client_id, token, broadcaster_id
 */
export async function GetSharedChatSession(params: RequestBody.GetSharedChatSession): Promise<ResponseBody.GetSharedChatSession | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/shared_chat/session`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get User Emotes](https://dev.twitch.tv/docs/api/reference/#get-user-emotes)
 * Retrieves emotes available to the user across all channels.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:read:emotes** scope. Query parameter `user_id` must match the `user_id` in the user access token.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the emotes.
 * 400 Bad Request|The `user_id` query parameter is required.
 * .|The ID in the `user_id` query parameter is not valid.
 * 401 Unauthorized|The ID in `user_id` must match the user ID in the user access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **user:read:emotes** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetUserEmotes | GetUserEmotes}: client_id, token, user_id, after?, broadcaster_id?
 */
export async function GetUserEmotes(params: RequestBody.GetUserEmotes): Promise<ResponseBody.GetUserEmotes | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/emotes/user`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ user_id: params.user_id, broadcaster_id: params.broadcaster_id, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Chat Settings](https://dev.twitch.tv/docs/api/reference/#update-chat-settings)
 * Updates the broadcaster’s chat settings.

 * ### Authorization
 * Requires one of the following:
 * - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_settings** scope. The user ID associated with the token must match the `moderator_id` in the query parameter.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has the **moderator:manage:chat_settings** scope for the user represented by the `moderator_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully updated the broadcaster’s chat settings.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `moderator_id` query parameter is required.
 * .|If `slow_mode` is **true**, the `slow_mode_wait_time` field must be set to a valid value.
 * .|If `follower_mode` is **true**, the `follower_mode_duration` field must be set to a valid value.
 * .|If `non_moderator_chat_delay` is **true**, the `non_moderator_chat_delay_duration` field must be set to a valid value.
 * 401 Unauthorized|The ID in the `moderator_id` query parameter must match the user ID in the user access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **moderator:manage:chat_settings** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in the `moderator_id` query parameter must have moderator privileges in the broadcaster's channel.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateChatSettings | UpdateChatSettings}: client_id, token, broadcaster_id, moderator_id, emote_mode?, follower_mode?, follower_mode_duration?, non_moderator_chat_delay?, non_moderator_chat_delay_duration?, slow_mode?, slow_mode_wait_time?, subscriber_mode?, unique_chat_mode?
 */
export async function UpdateChatSettings(params: RequestBody.UpdateChatSettings): Promise<ResponseBody.UpdateChatSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/settings`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id }).setBody({
			emote_mode: params.emote_mode,
			follower_mode: params.follower_mode,
			follower_mode_duration: params.follower_mode_duration,
			non_moderator_chat_delay: params.non_moderator_chat_delay,
			non_moderator_chat_delay_duration: params.non_moderator_chat_delay_duration,
			slow_mode: params.slow_mode,
			slow_mode_wait_time: params.slow_mode_wait_time,
			subscriber_mode: params.subscriber_mode,
			unique_chat_mode: params.unique_chat_mode
		}).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Send Chat Announcement](https://dev.twitch.tv/docs/api/reference/#send-chat-announcement)
 * Sends an announcement to the broadcaster’s chat room.

 * **Rate Limits**: One announcement may be sent every 2 seconds.

 * **NOTE**: When sending announcements during a Shared Chat session, behaviors differ depending on your authentication token type:
 * - When using an App Access Token, announcements will only be sent to the source channel (defined by the `broadcaster_id` parameter) by default. Announcements can be sent to all channels by using the `for_source_only` parameter and setting it to `false`.
 * - When using a User Access Token, announcements will be sent to all channels in the shared chat session, including the source channel. This behavior cannot be changed with this token type.

 * ### Authorization
 * Requires one of the following:
 * - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:announcements** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through prior authorizations, has:
 *   - The **moderator:manage:announcements** and **user:bot** scopes for the user represented by the `moderator_id` in the query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the announcement.
 * 400 Bad Request|The `message` field in the request's body is required.
 * .|The `message` field may not contain an empty string.
 * .|The string in the `message` field failed review.
 * .|The specified color is not valid.
 * .|Cannot set `for_source_only` if User Access Token is used.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **moderator:manage:announcements** scope.
 * .|The OAuth token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * .|The sender must have authorized the app with the **moderator:manage:announcements** and **user:bot** scopes.
 * .|The broadcaster must have authorized the app with the **channel:bot** scope.
 * 429 Too Many Requests|The sender has exceeded the number of announcements they may send to this `broadcaster_id` within a given window.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SendChatAnnouncement | SendChatAnnouncement}: client_id, token, broadcaster_id, moderator_id
 */
export async function SendChatAnnouncement(params: RequestBody.SendChatAnnouncement): Promise<ResponseBody.SendChatAnnouncement | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/announcements`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Send a Shoutout](https://dev.twitch.tv/docs/api/reference/#send-a-shoutout)
 * Sends a Shoutout to the specified broadcaster. Typically, you send Shoutouts when you or one of your moderators notice another broadcaster in your chat, the other broadcaster is coming up in conversation, or after they raid your broadcast.

 * Twitch’s Shoutout feature is a great way for you to show support for other broadcasters and help them grow. Viewers who do not follow the other broadcaster will see a pop-up Follow button in your chat that they can click to follow the other broadcaster. [Learn More](https://help.twitch.tv/s/article/shoutouts)

 * **Rate Limits**: The broadcaster may send a Shoutout once every 2 minutes. They may send the same broadcaster a Shoutout once every 60 minutes.

 * To receive notifications when a Shoutout is sent or received, subscribe to the {@link EventSub.Subscription.ChannelShoutoutCreate | channel.shoutout.create} and {@link EventSub.Subscription.ChannelShoutoutReceive | channel.shoutout.receive} subscription types. The **channel.shoutout.create** event includes cooldown periods that indicate when the broadcaster may send another Shoutout without exceeding the endpoint’s rate limit.

 * ### Authorization
 * Requires one of the following:
 * - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:shoutouts** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through prior authorizations, has:
 *   - The **moderator:manage:shoutouts** and **user:bot** scopes for the user represented by the `moderator_id` in the query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the specified broadcaster a Shoutout.
 * 400 Bad Request|The `from_broadcaster_id` query parameter is required.
 * .|The ID in the `from_broadcaster_id` query parameter is not valid.
 * .|The `to_broadcaster_id` query parameter is required.
 * .|The ID in the `to_broadcaster_id` query parameter is not valid.
 * .|The broadcaster may not give themselves a Shoutout.
 * .|The broadcaster is not streaming live or does not have one or more viewers.
 * 401 Unauthorized|The ID in `moderator_id` must match the user ID in the user access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **moderator:manage:shoutouts** scope.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user in `moderator_id` is not one of the broadcaster's moderators.
 * .|The broadcaster may not send the specified broadcaster a Shoutout.
 * 429 Too Many Requests|The broadcaster exceeded the number of Shoutouts they may send within a given window. See the endpoint's Rate Limits.
 * .|The broadcaster exceeded the number of Shoutouts they may send the same broadcaster within a given window. See the endpoint's Rate Limits.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SendShoutout | SendShoutout}: client_id, token, from_broadcaster_id, to_broadcaster_id, moderator_id
 */
export async function SendShoutout(params: RequestBody.SendShoutout): Promise<ResponseBody.SendShoutout | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/shoutouts`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ from_broadcaster_id: params.from_broadcaster_id, to_broadcaster_id: params.to_broadcaster_id, moderator_id: params.moderator_id }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Send Chat Message](https://dev.twitch.tv/docs/api/reference/#send-chat-message)
 * Sends a message to the broadcaster’s chat room.

 * **NOTE**: When sending messages to a Shared Chat session, behaviors differ depending on your authentication token type:
 * - When using an App Access Token, messages will only be sent to the source channel (defined by the `broadcaster_id` parameter) by default starting on May 19, 2025. Messages can be sent to all channels by using the `for_source_only` parameter and setting it to **false**.
 * - When using a User Access Token, messages will be sent to all channels in the shared chat session, including the source channel. This behavior cannot be changed with this token type.

 * ### Authorization
 * Requires one of the following:
 * - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:write:chat** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through prior authorizations, has:
 *   - The **user:write:chat** and **user:bot** scopes for the user represented by the `sender_id` in the query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter, unless the user represented by the `sender_id` already has moderator status.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully sent the specified broadcaster a message.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The ID in the `broadcaster_id` query parameter is not valid.
 * .|The `sender_id` query parameter is required.
 * .|The ID in the `sender_id` query parameter is not valid.
 * .|The `message` query parameter is required.
 * .|The ID in the `reply_parent_message_id` query parameter is not valid.
 * .|Cannot set `for_source_only` if User Access Token is used.
 * .|The `reply_parent_message_id` parameter is not supported when `pin` is **true**.
 * .|The `for_source_only` parameter is not supported when `pin` is **true**.
 * 401 Unauthenticated|The ID in the `user_id` query parameter must match the user ID in the access token.
 * .|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **user:write:chat** scope.
 * .|Pinning requires the **moderator:manage:chat_messages** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The sender is not permitted to send chat messages to the broadcaster’s chat room.
 * 422 Unprocessable Entity|The `message` query parameter is too large.
 * 429 Too Many Requests|The rate limit has been exceeded.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SendChatMessage | SendChatMessage}: client_id, token, broadcaster_id, sender_id, message, reply_parent_message_id?, for_source_only?, pin?
 */
export async function SendChatMessage(params: RequestBody.SendChatMessage): Promise<ResponseBody.SendChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/messages`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ broadcaster_id: params.broadcaster_id, sender_id: params.sender_id, message: params.message, reply_parent_message_id: params.reply_parent_message_id, for_source_only: params.for_source_only, pin: params.pin }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Pinned Chat Message](https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message)
 * Gets the currently pinned message for the specified broadcaster’s chat room, including message fragments. Only one mod-pinned message can be active per channel at a time.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_messages** or **moderator:read:chat_messages** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has:
 *   - The **moderator:manage:chat_messages** or **moderator:read:chat_messages** scope, and the **user:bot** scope for the user represented by the `moderator_id` query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved pinned message(s).
 * 400 Bad Request|A required query parameter is missing.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * .|The access token must include the **moderator:manage:chat_messages** or **moderator:read:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to moderate the broadcaster’s chat room.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetPinnedChatMessage | GetPinnedChatMessage}: client_id, token, broadcaster_id, moderator_id
 */
export async function GetPinnedChatMessage(params: RequestBody.GetPinnedChatMessage): Promise<ResponseBody.GetPinnedChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/pins`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Pin Chat Message](https://dev.twitch.tv/docs/api/reference/#pin-chat-message)
 * Pins a chat message to the top of the specified broadcaster’s chat room. Only one mod-pinned message can be active per channel at a time. If a mod-pinned message already exists, it is automatically replaced.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_messages** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has:
 *   - The **moderator:manage:chat_messages** and **user:bot** scopes for the user represented by the `moderator_id` query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully pinned the message.
 * 400 Bad Request|A required query parameter is missing or invalid.
 * .|The `duration_seconds` value is invalid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * .|The access token must include the **moderator:manage:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to pin messages in this channel.
 * 404 Not Found|The specified message was not found.
 * 409 Conflict|The message is already pinned.
 * 429 Too Many Requests|The rate limit for pinning messages has been exceeded.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.PinChatMessage | PinChatMessage}: client_id, token, broadcaster_id, moderator_id, message_id, duration_seconds?
 */
export async function PinChatMessage(params: RequestBody.PinChatMessage): Promise<ResponseBody.PinChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/pins`, "PUT").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id, message_id: params.message_id, duration_seconds: params.duration_seconds }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Pinned Chat Message](https://dev.twitch.tv/docs/api/reference/#update-pinned-chat-message)
 * Updates the duration of an existing pinned chat message.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_messages** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has:
 *   - The **moderator:manage:chat_messages** and **user:bot** scopes for the user represented by the `moderator_id` query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the pinned message.
 * 400 Bad Request|A required query parameter is missing or invalid.
 * .|The `duration_seconds` value is invalid.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * .|The access token must include the **moderator:manage:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to update pinned messages in this channel.
 * 404 Not Found|The specified pinned message was not found.
 * 429 Too Many Requests|The rate limit for updating pinned messages has been exceeded.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdatePinnedChatMessage | UpdatePinnedChatMessage}: client_id, token, broadcaster_id, moderator_id, message_id, duration_seconds?
 */
export async function UpdatePinnedChatMessage(params: RequestBody.UpdatePinnedChatMessage): Promise<ResponseBody.UpdatePinnedChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/pins`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id, message_id: params.message_id, duration_seconds: params.duration_seconds }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Unpin Chat Message](https://dev.twitch.tv/docs/api/reference/#unpin-chat-message)
 * Unpins a pinned chat message from the specified broadcaster’s chat room.

 * ### Authorization
 * Requires one of the following:
 * - A [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **moderator:manage:chat_messages** scope.
 * - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) where the application, through a prior authorization, has:
 *   - The **moderator:manage:chat_messages** and **user:bot** scopes for the user represented by the `moderator_id` query parameter.
 *   - The **channel:bot** scope for the user represented by the `broadcaster_id` query parameter.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully unpinned the message.
 * 400 Bad Request|A required query parameter is missing.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token or app access token.
 * .|The access token must include the **moderator:manage:chat_messages** scope.
 * 403 Forbidden|The user does not have permission to unpin messages in this channel.
 * 404 Not Found|The specified pinned message was not found.
 * 429 Too Many Requests|The rate limit for unpinning messages has been exceeded.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UnpinChatMessage | UnpinChatMessage}: client_id, token, broadcaster_id, moderator_id, message_id
 */
export async function UnpinChatMessage(params: RequestBody.UnpinChatMessage): Promise<ResponseBody.UnpinChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/pins`, "DELETE").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id, message_id: params.message_id }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get User Chat Color](https://dev.twitch.tv/docs/api/reference/#get-user-chat-color)
 * Gets the color used for the user’s name in chat.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the chat color used by the specified users.
 * 400 Bad Request|The ID in the `user_id` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetUserChatColor | GetUserChatColor}: client_id, token, user_id
 */
export async function GetUserChatColor(params: RequestBody.GetUserChatColor): Promise<ResponseBody.GetUserChatColor | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/color`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ user_id: params.user_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update User Chat Color](https://dev.twitch.tv/docs/api/reference/#update-user-chat-color)
 * Updates the color used for the user’s name in chat.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **user:manage:chat_color** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the user's chat color.
 * 400 Bad Request|The ID in the `user_id` query parameter is not valid.
 * .|The `color` query parameter is required.
 * .|The named color in the `color` query parameter is not valid.
 * .|To specify a Hex color code, the user must be a Turbo or Prime user.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * .|The user access token must include the **user:manage:chat_color** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the `user_id` query parameter must match the user ID in the access token.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateUserChatColor | UpdateUserChatColor}: client_id, token, user_id, color
 */
export async function UpdateUserChatColor(params: RequestBody.UpdateUserChatColor): Promise<ResponseBody.UpdateUserChatColor | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/chat/color`, "PUT").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ user_id: params.user_id, color: params.color }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Create Clip](https://dev.twitch.tv/docs/api/reference/#create-clip)
 * Creates a clip from the broadcaster’s stream.

 * This API captures up to 90 seconds of the broadcaster’s stream. The 90 seconds spans the point in the stream from when you called the API. For example, if you call the API at the 4:00 minute mark, the API captures from approximately the 2:35 mark to approximately the 4:05 minute mark. Twitch tries its best to capture 90 seconds of the stream, but the actual length may be less. This may occur if you begin capturing the clip near the beginning or end of the stream.

 * By default, Twitch publishes up to the last 30 seconds of the 90 seconds window and provides a default title for the clip. To specify the title and the portion of the 90 seconds window that’s used for the clip, use the URL in the response’s `edit_url` field. You can specify a clip that’s from 5 seconds to 60 seconds in length. The URL is valid for up to 24 hours or until the clip is published, whichever comes first.

 * Creating a clip is an asynchronous process that can take a short amount of time to complete. To determine whether the clip was successfully created, call {@link GetClips | Get Clips} using the clip ID that this request returned. If Get Clips returns the clip, the clip was successfully created. If after 60 seconds Get Clips hasn’t returned the clip, assume it failed.

 * ### Authorization
 * Requires a [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **clips:edit** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 202 Accepted|Successfully started the clip process.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The ID in the `broadcaster_id` query parameter was not found.
 * .|The category is not clippable.
 * .|The title did not pass AutoMod checks.
 * 401 Unauthorized|The Authorization header is required and must specify user access token.
 * .|The user access token must include the **clips:edit** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster has restricted the ability to capture clips to followers and/or subscribers only.
 * .|The specified broadcaster has not enabled clips on their channel.
 * .|The user is banned or timed out from the broadcaster’s channel.
 * 404 Not Found|The broadcaster in the `broadcaster_id` query parameter must be broadcasting live.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.CreateClip | CreateClip}: client_id, token, broadcaster_id, title?, duration?
 */
export async function CreateClip(params: RequestBody.CreateClip): Promise<ResponseBody.CreateClip | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/clips`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, title: params.title, duration: params.duration }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Create Clip From VOD](https://dev.twitch.tv/docs/api/reference/#create-clip-from-vod)
 * Creates a clip from a broadcaster’s VOD on behalf of the broadcaster or an editor of the channel. Since a live stream is actively creating a VOD, this endpoint can also be used to create a clip from earlier in the current stream.

 * The duration of a clip can be from 5 seconds to 60 seconds in length, with a default of 30 seconds if not specified.

 * `vod_offset` indicates where the clip will end. In other words, the clip will start at (`vod_offset` - `duration`) and end at `vod_offset`. This means that the value of `vod_offset` must greater than or equal to the value of `duration`.

 * The URL in the response’s `edit_url` field allows you to edit the clip’s title, feature the clip, create a portrait version of the clip, download the clip media, and share the clip directly to social platforms.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **editor:manage:clips** or **channel:manage:clips** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 202 Accepted|Successfully started the clip process.
 * 400 Bad Request|Validation errors: Invalid source type, missing required fields.
 * .|The `broadcaster_id` query parameter is required.
 * .|The ID in the `broadcaster_id` query parameter was not found.
 * .|The category is not clippable.
 * .|The title did not pass AutoMod checks.
 * .|Broadcaster is banned.
 * 401 Unauthorized|The Authorization header is required and must specify user access token.
 * .|The user access token must include the **editor:manage:clips** or **channel:manage:clips** scope.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster has restricted the ability to capture clips to followers and/or subscribers only.
 * .|The specified broadcaster has not enabled clips on their channel.
 * .|The user defined by the `editor_id` is not authorized to create Clips.
 * .|The user is banned or timed out from the broadcaster's channel.
 * 404 Not Found|The broadcaster in the `broadcaster_id` query parameter must be broadcasting live.
 * .|The VOD is not found.
 * .|The `broadcaster_id` or the `editor_id` does not exist.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.CreateClip | CreateClip}: client_id, token, editor_id, broadcaster_id, vod_id, vod_offset, duration?, title
 */
export async function CreateClipFromVOD(params: RequestBody.CreateClipFromVOD): Promise<ResponseBody.CreateClipFromVOD | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/clips`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ editor_id: params.editor_id, broadcaster_id: params.broadcaster_id, vod_id: params.vod_id, vod_offset: params.vod_offset, duration: params.duration, title: params.title }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Clips](https://dev.twitch.tv/docs/api/reference/#get-clips)
 * Gets one or more video clips that were captured from streams. For information about clips, see [How to use clips](https://help.twitch.tv/s/article/how-to-use-clips).

 * When using pagination for clips, note that the maximum number of results returned over multiple requests will be approximately 1,000. If additional results are necessary, paginate over different query parameters such as multiple `started_at` and `ended_at` timeframes to refine the search.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of video clips.
 * 400 Bad Request|The `id` or `game_id` or `broadcaster_id` query parameter is required.
 * .|The `id`, `game_id`, and `broadcaster_id` query parameters are mutually exclusive; you may specify only one of them.
 * 401 Unauthorized|The Authorization header is required and must contain an app access token or user access token.
 * .|The OAuth token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the OAuth token.
 * 404 Not Found|The ID in `game_id` was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetClips | GetClips}: client_id, token, (broadcaster_id | game_id | id), started_at?, ended_at?, first?, before?, after?, is_featured?
 */
export async function GetClips(params: RequestBody.GetClips): Promise<ResponseBody.GetClips | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/clips`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, game_id: params.game_id, id: params.id, started_at: params.started_at, ended_at: params.ended_at, first: params.first, before: params.before, after: params.after, is_featured: params.is_featured }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Clips Download](https://dev.twitch.tv/docs/api/reference/#get-clips-download)
 * Provides URLs to download the video file(s) for the specified clips. For information about clips, see [How to use clips](https://help.twitch.tv/s/article/how-to-use-clips). These links are temporary and should have a long-term expectation to expire.

 * **Rate Limits**: Limited to 100 requests per minute.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **editor:manage:clips** or **channel:manage:clips** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the clip download URL(s).
 * 400 Bad Request|The ID in the `broadcaster_id`, `editor_id`, or `clip_id` query parameter is not valid.
 * 401 Unauthorized|The OAuth token is not valid.
 * .|The Authorization header is required and must contain a user access token or app access token.
 * .|The access token must include the **editor:manage:clips** or **channel:manage:clips** scope.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 403 Forbidden|The user is not an editor for the specified broadcaster.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetClipsDownload | GetClipsDownload}: client_id, token, editor_id, broadcaster_id, clip_id
 */
export async function GetClipsDownload(params: RequestBody.GetClipsDownload): Promise<ResponseBody.GetClipsDownload | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/clips`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ editor_id: params.editor_id, broadcaster_id: params.broadcaster_id, clip_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Conduits](https://dev.twitch.tv/docs/api/reference/#get-conduits)
 * Gets the [conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) for a client ID.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved conduits.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.ClientIDAndAccessToken | ClientIDAndAccessToken}: client_id, token
 */
export async function GetConduits(params: RequestBody.ClientIDAndAccessToken): Promise<ResponseBody.GetConduits | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/conduits`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Create Conduit](https://dev.twitch.tv/docs/api/reference/#create-conduits)
 * Creates a new [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Conduit created.
 * 400 Bad Request|Invalid shard count.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 429 Too Many Requests|Conduit limit reached.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.CreateConduit | CreateConduit}: client_id, token, shard_count
 */
export async function CreateConduit(params: RequestBody.CreateConduit): Promise<ResponseBody.CreateConduit | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/conduits`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ shard_count: params.shard_count }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Conduit](https://dev.twitch.tv/docs/api/reference/#update-conduits)
 * Updates a [conduit’s](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) shard count. To delete shards, update the count to a lower number, and the shards above the count will be deleted. For example, if the existing shard count is 100, by resetting shard count to 50, shards 50-99 are disabled.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Conduit updated.
 * 400 Bad Request|Invalid shard count.
 * .|The `id` query parameter is required.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 404 Not Found|Conduit not found.
 * .|Conduit’s owner must match the client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateConduit | UpdateConduit}: client_id, token, id, shard_count
 */
export async function UpdateConduit(params: RequestBody.UpdateConduit): Promise<ResponseBody.UpdateConduit | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/conduits`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ id: params.id, shard_count: params.shard_count }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Delete Conduit](https://dev.twitch.tv/docs/api/reference/#delete-conduit)
 * Deletes a specified [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/). Note that it may take some time for Eventsub subscriptions on a deleted [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) to show as disabled when calling {@link GetEventSubSubscriptions | Get Eventsub Subscriptions}.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully deleted the conduit.
 * 400 Bad Request|The `id` query parameter is required.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 404 Not Found|Conduit not found.
 * .|Conduit’s owner must match the client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.DeleteConduit | DeleteConduit}: client_id, token, id, shard_count
 */
export async function DeleteConduit(params: RequestBody.DeleteConduit): Promise<ResponseBody.DeleteConduit | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/conduits`, "DELETE").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ id: params.id }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Conduit Shards](https://dev.twitch.tv/docs/api/reference/#get-conduit-shards)
 * Gets a lists of all shards for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/).

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved shards.
 * 400 Bad Request|The `id` query parameter is required.
 * 401 Unauthenticated|Authorization header required with an app access token.
 * 404 Not Found|Conduit not found.
 * .|Conduit’s owner must match the client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetConduitShards | GetConduitShards}: client_id, token, conduit_id, status?, after?
 */
export async function GetConduitShards(params: RequestBody.GetConduitShards): Promise<ResponseBody.GetConduitShards | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/conduits/shards`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ conduit_id: params.conduit_id, status: params.status, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Conduit Shards](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
 * Updates shard(s) for a [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/). You can update up to 100 shards in a single request.

 * **NOTE**: Shard IDs are indexed starting at 0, so a conduit with a `shard_count` of 5 will have shards with IDs 0 through 4.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 202 Accepted|Successfully updated shards.
 * 400 Bad Request|The `conduit_id` query parameter is required.
 * 401 Unauthenticated|Authorization header requires using an App Access Token for this request.
 * 404 Not Found|The specified `conduit_id` does not exist.
 * .|Conduit's owner must match the Client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateConduitShards | UpdateConduitShards}: client_id, token, conduit_id, shards
 */
export async function UpdateConduitShards(params: RequestBody.UpdateConduitShards): Promise<ResponseBody.UpdateConduitShards | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/conduits/shards`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ conduit_id: params.conduit_id, shards: params.shards }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Content Classification Labels](https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels)
 * Gets information about Twitch content classification labels.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * *Not documented on Twitch API*

 * @param params {@link RequestBody.GetContentClassificationLabels | GetContentClassificationLabels}: client_id, token, locale?
 */
export async function GetContentClassificationLabels(params: RequestBody.GetContentClassificationLabels): Promise<ResponseBody.GetContentClassificationLabels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/content_classification_labels`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ locale: params.locale }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Drops Entitlements](https://dev.twitch.tv/docs/api/reference/#get-drops-entitlements)
 * Gets an organization’s list of entitlements that have been granted to a game, a user, or both.

 * **NOTE**: Entitlements returned in the response body data are not guaranteed to be sorted by any field returned by the API. To retrieve **CLAIMED** or **FULFILLED** entitlements, use the `fulfillment_status` query parameter to filter results. To retrieve entitlements for a specific game, use the `game_id` query parameter to filter results.

 * The following table identifies the request parameters that you may specify based on the type of access token used.
 * Access token type|Parameter|Description
 * -|-|-
 * App|None|If you don’t specify request parameters, the request returns all entitlements that your organization owns.
 * App|user_id|The request returns all entitlements for any game that the organization granted to the specified user.
 * App|user_id, game_id|The request returns all entitlements that the specified game granted to the specified user.
 * App|game_id|The request returns all entitlements that the specified game granted to all entitled users.
 * User|None|If you don’t specify request parameters, the request returns all entitlements for any game that the organization granted to the user identified in the access token.
 * User|user_id|Invalid.
 * User|user_id, game_id|Invalid.
 * User|game_id|The request returns all entitlements that the specified game granted to the user identified in the access token.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). The Client ID associated with the access token must be owned by a user who is a member of the [organization](https://dev.twitch.tv/docs/docs/companies/) that holds ownership of the game.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the entitlements.
 * 400 Bad Request|The value in the `fulfillment_status` query parameter is not valid.
 * .|The ID in the `user_id` query parameter must match the user ID in the user access token.
 * .|The client in the access token is not associated with a known organization.
 * .|The owner of the client in the access token is not a member of the organization.
 * 401 Unauthorized|The ID in the Client-Id header must match the Client ID in the access token.
 * .|The Authorization header is required and must specify an app access token or user access token.
 * .|The access token is not valid.
 * 403 Forbidden|The organization associated with the client in the access token must own the game specified in the `game_id` query parameter.
 * .|The organization associated with the client in the access token must own the entitlements specified in the `id` query parameter.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetDropsEntitlements | GetDropsEntitlements}: client_id, token, id?, user_id?, game_id?, fulfillment_status?, after?, first?
 */
export async function GetDropsEntitlements(params: RequestBody.GetDropsEntitlements): Promise<ResponseBody.GetDropsEntitlements | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/entitlements/drops`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ id: params.id, user_id: params.user_id, game_id: params.game_id, fulfillment_status: params.fulfillment_status, after: params.after, first: params.first }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Drops Entitlements](https://dev.twitch.tv/docs/api/reference/#update-drops-entitlements)
 * Updates the Drop entitlement’s fulfillment status.

 * The following table identifies which entitlements are updated based on the type of access token used.
 * Access token type|Data that’s updated
 * -|-
 * App|Updates all entitlements with benefits owned by the organization in the access token.
 * User|Updates all entitlements owned by the user in the access token and where the benefits are owned by the organization in the access token.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). The Client ID associated with the access token must be owned by a user who is a member of the [organization](https://dev.twitch.tv/docs/docs/companies/) that holds ownership of the game.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully requested the updates. Check the response to determine which updates succeeded.
 * 400 Bad Request|The value in the `fulfillment_status` field is not valid.
 * .|The client in the access token is not associated with a known organization.
 * .|The owner of the client in the access token is not a member of the organization.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateDropsEntitlements | UpdateDropsEntitlements}: client_id, token, entitlement_ids?, fulfillment_status?
 */
export async function UpdateDropsEntitlements(params: RequestBody.UpdateDropsEntitlements): Promise<ResponseBody.UpdateDropsEntitlements | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/entitlements/drops`, "PATCH").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ entitlement_ids: params.entitlement_ids, fulfillment_status: params.fulfillment_status }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Extension Configuration Segment](https://dev.twitch.tv/docs/api/reference/#get-extension-configuration-segment)
 * Gets the specified configuration segment from the specified extension.

 * **Rate Limits**: You may retrieve each segment a maximum of 20 times per minute.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the configurations.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * .|The value in the `segment` query parameter is not valid.
 * .|The `broadcaster_id` query parameter is required if the `segment` query parameter is set to broadcaster or developer.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 429 Too many requests|The app exceeded the number of requests that it may make per minute. See Rate Limits above.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetExtensionConfigurationSegment | GetExtensionConfigurationSegment}: client_id, jwt_token, broadcaster_id?, extension_id, segment
 */
export async function GetExtensionConfigurationSegment(params: RequestBody.GetExtensionConfigurationSegment): Promise<ResponseBody.GetExtensionConfigurationSegment | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/configurations`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, extension_id: params.extension_id, segment: params.segment }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Set Extension Configuration Segment](https://dev.twitch.tv/docs/api/reference/#set-extension-configuration-segment)
 * Updates a configuration segment. The segment is limited to 5 KB. Extensions that are active on a channel do not receive the updated configuration.

 * **Rate Limits**: You may update the configuration a maximum of 20 times per minute.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the configuration.
 * 400 Bad Request|The `broadcaster_id` field is required if segment is set to developer or broadcaster.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SetExtensionConfigurationSegment | SetExtensionConfigurationSegment}: client_id, jwt_token, extension_id, segment, broadcaster_id?, content?, version?
 */
export async function SetExtensionConfigurationSegment(params: RequestBody.SetExtensionConfigurationSegment): Promise<ResponseBody.SetExtensionConfigurationSegment | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/configurations`, "PUT").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`,
			"Content-Type": "application/json"
		}).setBody({ extension_id: params.extension_id, segment: params.segment, broadcaster_id: params.broadcaster_id, content: params.content, version: params.version }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Set Extension Required Configuration](https://dev.twitch.tv/docs/api/reference/#set-extension-required-configuration)
 * Updates the extension’s required_configuration string. Use this endpoint if your extension requires the broadcaster to configure the extension before activating it (to require configuration, you must select **Custom/My Own Service** in Extension [Capabilities](https://dev.twitch.tv/docs/extensions/life-cycle/#capabilities)). For more information, see [Required Configurations](https://dev.twitch.tv/docs/extensions/building#required-configurations) and [Setting Required Configuration](https://dev.twitch.tv/docs/extensions/building#setting-required-configuration-with-the-configuration-service-optional).

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). Set the `role` field to **external** and the `user_id` field to the ID of the user that owns the extension.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated the extension’s required_configuration string.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `extension_id` field is required.
 * .|The `extension_version` field is required.
 * .|The `required_configuration` field is required.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SetExtensionRequiredConfiguration | SetExtensionRequiredConfiguration}: client_id, jwt_token, broadcaster_id, extension_id, extension_version, required_configuration
 */
export async function SetExtensionRequiredConfiguration(params: RequestBody.SetExtensionRequiredConfiguration): Promise<ResponseBody.SetExtensionRequiredConfiguration | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/configurations`, "PUT").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`,
			"Content-Type": "application/json"
		}).setSearch({ broadcaster_id: params.broadcaster_id }).setBody({ extension_id: params.extension_id, extension_version: params.extension_version, required_configuration: params.required_configuration }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Send Extension PubSub Message](https://dev.twitch.tv/docs/api/reference/#send-extension-pubsub-message)
 * Sends a message to one or more viewers. You can send messages to a specific channel or to all channels where your extension is active. This endpoint uses the same mechanism as the [send](https://dev.twitch.tv/docs/extensions/reference#send) JavaScript helper function used to send messages.

 * **Rate Limits**: You may send a maximum of 100 messages per minute per combination of extension client ID and broadcaster ID.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)) along with the `channel_id` and `pubsub_perms` fields. The `role` field must be set to **external**.

 * To send the message to a specific channel, set the `channel_id` field in the JWT to the channel’s ID and set the `pubsub_perms.send` array to **broadcast**.
 * ```json
 * {
 * 	"exp": 1503343947,
 * 	"user_id": "27419011",
 * 	"role": "external",
 * 	"channel_id": "27419011",
 * 	"pubsub_perms": {
 * 		"send": [
 * 			"broadcast"
 * 		]
 * 	}
 * }
 * ```

 * To send the message to all channels on which your extension is active, set the `channel_id` field to **all** and set the `pubsub_perms.send` array to **global**.
 * ```json
 * {
 * 	"exp": 1503343947,
 * 	"user_id": "27419011",
 * 	"role": "external",
 * 	"channel_id": "all",
 * 	"pubsub_perms": {
 * 		"send": [
 * 			"global"
 * 		]
 * 	}
 * }
 * ```

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the message.
 * 400 Bad Request|The `broadcaster_id` field in the request's body may only be set if the `is_global_broadcast` field is set to **false**.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 403 Forbidden|The channel found in the JWT provided is not the same as the channel specified in `broadcaster_id`.
 * .|JWT could not be verified.
 * 422 Unprocessable Entity|The message is too large.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SendExtensionPubSubMessage | SendExtensionPubSubMessage}: client_id, jwt_token, broadcaster_id, extension_id, extension_version, required_configuration
 */
export async function SendExtensionPubSubMessage(params: RequestBody.SendExtensionPubSubMessage): Promise<ResponseBody.SendExtensionPubSubMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/pubsub`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`,
			"Content-Type": "application/json"
		}).setBody({ target: params.target, broadcaster_id: params.broadcaster_id, is_global_broadcast: params.is_global_broadcast, message: params.message }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Extension Live Channels](https://dev.twitch.tv/docs/api/reference/#get-extension-live-channels)
 * Gets a list of broadcasters that are streaming live and have installed or activated the extension.

 * It may take a few minutes for the list to include or remove broadcasters that have recently gone live or stopped broadcasting.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of broadcasters.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * .|The pagination cursor is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|The extension specified in the `extension_id` query parameter was not found or it's not being used in a live stream.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetExtensionLiveChannels | GetExtensionLiveChannels}: client_id, token, extension_id, first?, after?
 */
export async function GetExtensionLiveChannels(params: RequestBody.GetExtensionLiveChannels): Promise<ResponseBody.GetExtensionLiveChannels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/live`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ extension_id: params.extension_id, first: params.first, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Extension Secrets](https://dev.twitch.tv/docs/api/reference/#get-extension-secrets)
 * Gets an extension’s list of shared secrets.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)) along with the `channel_id` and `pubsub_perms` fields. The `role` field must be set to **external**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of secrets.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetExtensionSecrets | GetExtensionSecrets}: client_id, jwt_token, extension_id
 */
export async function GetExtensionSecrets(params: RequestBody.GetExtensionSecrets): Promise<ResponseBody.GetExtensionSecrets | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/jwt/secrets`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`
		}).setSearch({ extension_id: params.extension_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Create Extension Secret](https://dev.twitch.tv/docs/api/reference/#create-extension-secret)
 * Creates a shared secret used to sign and verify JWT tokens. Creating a new secret removes the current secrets from service. Use this function only when you are ready to use the new secret it returns.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the new secret.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * .|The delay specified in the `delay` query parameter is too short.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.CreateExtensionSecret | CreateExtensionSecret}: client_id, jwt_token, extension_id, delay?
 */
export async function CreateExtensionSecret(params: RequestBody.CreateExtensionSecret): Promise<ResponseBody.CreateExtensionSecret | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/jwt/secrets`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`
		}).setSearch({ extension_id: params.extension_id, delay: params.delay }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Send Extension Chat Message](https://dev.twitch.tv/docs/api/reference/#send-extension-chat-message)
 * Sends a message to the specified broadcaster’s chat room. The extension’s name is used as the username for the message in the chat room. To send a chat message, your extension must enable **Chat Capabilities** (under your extension’s **Capabilities** tab).

 * **Rate Limits**: You may send a maximum of 12 messages per minute per channel.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, and `user_id` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully sent the chat message.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * .|The `extension_id` field in the request's body is required.
 * .|The `extension_version` field in the request's body is required.
 * .|The `text` field in the request's body is required.
 * .|The message is too long.
 * 401 Unauthorized|The Authorization header is required and must specify a JWT token.
 * .|The ID in the `broadcaster_id` query parameter must match the `channel_id` claim in the JWT.
 * .|The JWT token is not valid.
 * .|The Client-Id header is required.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.SendExtensionChatMessage | SendExtensionChatMessage}: client_id, jwt_token, broadcaster_id, text, extension_id, extension_version
 */
export async function SendExtensionChatMessage(params: RequestBody.SendExtensionChatMessage): Promise<ResponseBody.SendExtensionChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/chat`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`,
			"Content-Type": "application/json"
		}).setSearch({ broadcaster_id: params.broadcaster_id }).setBody({ text: params.text, extension_id: params.extension_id, extension_version: params.extension_version }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Extension](https://dev.twitch.tv/docs/api/reference/#get-extensions)
 * Gets information about an extension.

 * ### Authorization
 * Requires a signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role` field (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)), and the `role` field must be set to **external**.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the extension.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * 401 Unauthorized|The request must specify the Authorization header.
 * .|The Authorization header is required and must specify a JWT token.
 * .|The JWT token is not valid.
 * .|The request must specify the Client-Id header.
 * 404 Not Found|The extension in the `extension_id` query parameter was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetExtension | GetExtension}: client_id, jwt_token, extension_id, extension_version?
 */
export async function GetExtension(params: RequestBody.GetExtension): Promise<ResponseBody.GetExtension | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.jwt_token}`
		}).setSearch({ extension_id: params.extension_id, extension_version: params.extension_version }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Released Extension](https://dev.twitch.tv/docs/api/reference/#get-released-extensions)
 * Gets information about a released extension. Returns the extension if its `state` is Released.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the extension.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * 401 Unauthorized|The Authorization header must specify an app access token or user access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|The extension specified in the `extension_id` query parameter was not found or is not released.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetReleasedExtension | GetReleasedExtension}: client_id, token, extension_id, extension_version?
 */
export async function GetReleasedExtension(params: RequestBody.GetReleasedExtension): Promise<ResponseBody.GetReleasedExtension | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/extensions/released`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ extension_id: params.extension_id, extension_version: params.extension_version }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Extension Bits Products](https://dev.twitch.tv/docs/api/reference/#get-extension-bits-products)
 * Gets the list of Bits products that belongs to the extension. The client ID in the app access token identifies the extension.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). The client ID in the app access token must be the extension’s client ID.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of products.
 * 400 Bad Request|The ID in the Client-Id header must belong to an extension.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token; you may not specify a user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetExtensionBitsProducts | GetExtensionBitsProducts}: client_id, token, should_include_all?
 */
export async function GetExtensionBitsProducts(params: RequestBody.GetExtensionBitsProducts): Promise<ResponseBody.GetExtensionBitsProducts | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/bits/extensions`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ should_include_all: params.should_include_all }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Extension Bits Product](https://dev.twitch.tv/docs/api/reference/#update-extension-bits-product)
 * Adds or updates a Bits product that the extension created. If the SKU doesn’t exist, the product is added. You may update all fields except the `sku` field.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). The client ID in the app access token must be the extension’s client ID.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully created the product.
 * 400 Bad Request|The `sku` field is required.
 * .|The value in the `sku` field is not valid. The SKU may contain only alphanumeric characters, dashes (-), underscores (_), and periods (.).
 * .|The `cost` object's `amount` field is required.
 * .|The value in the `cost` object's `amount` field is not valid.
 * .|The `cost` object's `type` field is required.
 * .|The value in the `cost` object's `type` field is not valid.
 * .|The `display_name` field is required.
 * .|The ID in the Client-Id header must belong to the extension.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token; you may not specify a user access token.
 * .|The OAuth token is not valid.
 * .|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateExtensionBitsProduct | UpdateExtensionBitsProduct}: client_id, token, sku, cost, display_name, in_development?, expiration?, is_broadcast?
 */
export async function UpdateExtensionBitsProduct(params: RequestBody.UpdateExtensionBitsProduct): Promise<ResponseBody.UpdateExtensionBitsProduct | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/bits/extensions`, "PUT").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ sku: params.sku, cost: params.cost, display_name: params.display_name, in_development: params.in_development, expiration: params.expiration, is_broadcast: params.is_broadcast }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Create EventSub Subscription](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
 * Creates an EventSub subscription.

 * ### Authorization
 * - If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token. If the subscription type requires user authorization, the user must have granted your app (client ID) permissions to receive those events before you subscribe to them. For example, to subscribe to {@link EventSub.Subscription.ChannelSubscribe | channel.subscribe} events, your app must get a user access token that includes the **channel:read:subscriptions** scope, which adds the required permission to your app access token’s client ID.
 * - If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. If the subscription type requires user authorization, the token must include the required scope. However, if the subscription type doesn’t include user authorization, the token may include any scopes or no scopes.
 * - If you use [Conduits to receive events](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/), the request must specify an app access token. The request will fail if you use a user access token.

 * ### Response Codes
 * Code|Description
 * -|-
 * 202 Accepted|Successfully accepted the subscription request.
 * 400 Bad Request|The `condition` field is required.
 * .|The user specified in the `condition` object does not exist.
 * .|The `condition` object is missing one or more required fields.
 * .|The combination of values in the `version` and `type` fields is not valid.
 * .|The length of the string in the `secret` field is not valid.
 * .|The URL in the transport's `callback` field is not valid. The URL must use the HTTPS protocol and the 443 port number.
 * .|The value specified in the `method` field is not valid.
 * .|The `callback` field is required if you specify the webhook transport method.
 * .|The `session_id` field is required if you specify the WebSocket transport method.
 * .|The combination of subscription type and version is not valid.
 * .|The `conduit_id` field is required if you specify the Conduit transport method.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token if the transport method is webhook.
 * .|The Authorization header is required and must specify a user access token if the transport method is WebSocket.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 403 Forbidden|The access token is missing the required scopes.
 * 409 Conflict|A subscription already exists for the specified event type and `condition` combination. The `id` value in the error response represents the existing EventSub subscription.
 * 410 Gone|The subscription type and version combination has been removed and can no longer be subscribed to.
 * 429 Too Many Requests|The request exceeds the number of subscriptions that you may create with the same combination of `type` and `condition` values.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.CreateEventSubSubscription | CreateEventSubSubscription}: client_id, token, type, version, condition, transport
 */
export async function CreateEventSubSubscription<_Subscription extends EventSub.Subscription>(params: RequestBody.CreateEventSubSubscription<_Subscription>): Promise<ResponseBody.CreateEventSubSubscription<_Subscription> | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/subscriptions`, "POST").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setBody({ type: params.type, version: params.version, condition: params.condition, transport: params.transport }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Delete EventSub Subscription](https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)
 * Deletes an EventSub subscription.

 * ### Authorization
 * - If you use [webhooks to receive events](https://dev.twitch.tv/docs/eventsub/handling-webhook-events), the request must specify an app access token. The request will fail if you use a user access token.
 * - If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes.

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully deleted the subscription.
 * 400 Bad Request|The `id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 404 Not Found|The subscription was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.DeleteEventSubSubscription | DeleteEventSubSubscription}: client_id, token, id
 */
export async function DeleteEventSubSubscription(params: RequestBody.DeleteEventSubSubscription): Promise<ResponseBody.DeleteEventSubSubscription | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/subscriptions`, "DELETE").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`,
			"Content-Type": "application/json"
		}).setSearch({ id: params.id }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get EventSub Subscriptions](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions)
 * Gets a list of EventSub subscriptions that the client in the access token created.

 * ### Authorization
 * - If you use [Webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events) or [Conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) to receive events, the request must specify an app access token. The request will fail if you use a user access token.
 * - If you use [WebSockets to receive events](https://dev.twitch.tv/docs/eventsub/handling-websocket-events), the request must specify a user access token. The request will fail if you use an app access token. The token may include any scopes.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the subscriptions.
 * 400 Bad Request|The request may specify only one filter query parameter. For example, either `type` or `status` or `user_id`.
 * .|The value in the `type` query parameter is not valid.
 * .|The value in the `status` query parameter is not valid.
 * .|The cursor specified in the `after` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetEventSubSubscriptions | GetEventSubSubscriptions}: client_id, token, (status | type | user_id | subscription_id | conduit_id)?, after?
 */
export async function GetEventSubSubscriptions(params: RequestBody.GetEventSubSubscriptions): Promise<ResponseBody.GetEventSubSubscriptions | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/eventsub/subscriptions`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ status: params.status, type: params.type, user_id: params.user_id, subscription_id: params.subscription_id, conduit_id: params.conduit_id, after: params.after }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Top Games](https://dev.twitch.tv/docs/api/reference/#get-top-games)
 * Gets information about all broadcasts on Twitch.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of broadcasts.
 * 400 Bad Request|The value in the `first` query parameter is not valid.
 * .|The cursor in the `after` or `before` query parameter is not valid.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetTopGames | GetTopGames}: client_id, token, first?, after?, before?
 */
export async function GetTopGames(params: RequestBody.GetTopGames): Promise<ResponseBody.GetTopGames | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/games/top`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ first: params.first, after: params.after, before: params.before }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Games](https://dev.twitch.tv/docs/api/reference/#get-games)
 * Gets information about specified categories or games.

 * You may get up to 100 categories or games by specifying their ID or name. You may specify all IDs, all names, or a combination of IDs and names. If you specify a combination of IDs and names, the total number of IDs and names must not exceed 100.

 * ### Authorization
 * Requires an [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens) or [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens).

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the specified games.
 * 400 Bad Request|The request must specify the `id` or `name` or `igdb_id` query parameter.
 * .|The combined number of game IDs (`id` and `igdb_id`) and game names that you specify in the request must not exceed 100.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * .|The access token is not valid.
 * .|The ID in the Client-Id header must match the client ID in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetGames | GetGames}: client_id, token, (id &| name &| igdb_id)
 */
export async function GetGames(params: RequestBody.GetGames): Promise<ResponseBody.GetGames | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/games`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ name: params.name, id: params.id, igdb_id: params.igdb_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Creator Goals](https://dev.twitch.tv/docs/api/reference/#get-creator-goals)
 * Gets the broadcaster’s list of active goals. Use this endpoint to get the current progress of each goal.

 * Instead of polling for the progress of a goal, consider [subscribing](https://dev.twitch.tv/docs/eventsub/manage-subscriptions) to receive notifications when a goal makes progress using the {@link EventSub.Subscription.ChannelGoalProgress | channel.goal.progress} subscription type. [Read More](https://dev.twitch.tv/docs/api/goals#requesting-event-notifications)

 * ### Authorization
 * Requires an [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:read:goals** scope.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s goals.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * 401 Unauthorized|The Authorization header is required and must contain a user access token.
 * .|The user access token must include the **channel:read:goals** scope.
 * .|The ID in `broadcaster_id` must match the user ID in the user access token.
 * .|The access token is not valid.
 * .|The client ID specified in the Client-Id header does not match the client ID specified in the access token.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetCreatorGoals | GetCreatorGoals}: client_id, token, broadcaster_id
 */
export async function GetCreatorGoals(params: RequestBody.GetCreatorGoals): Promise<ResponseBody.GetCreatorGoals | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/goals`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id }).fetch();
		return await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Channel Guest Star Settings](https://dev.twitch.tv/docs/api/reference/#get-channel-guest-star-settings)
 * 
 * **BETA**
 * 
 * Gets the channel settings for configuration of the Guest Star feature for a particular host.

 * ### Authorization
 * - Query parameter `moderator_id` must match the `user_id` in the [User-Access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
 * - Requires OAuth Scopes: **channel:read:guest_star**, **channel:manage:guest_star**, **moderator:read:guest_star** or **moderator:manage:guest_star**

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the Guest Star settings.
 * 400 Bad Request|Missing `broadcaster_id`
 * .|Missing `moderator_id`
 * 403 Forbidden|Insufficient authorization for viewing channel’s Guest Star settings
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetChannelGuestStarSettings | GetChannelGuestStarSettings}: client_id, token, broadcaster_id, moderator_id
 */
export async function GetChannelGuestStarSettings(params: RequestBody.GetChannelGuestStarSettings): Promise<ResponseBody.GetChannelGuestStarSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/guest_star/channel_settings`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id }).fetch();
		return await getResponse(request, true);
	} catch(e) { return getError(e) }
}

/**
 * ### [Update Channel Guest Star Settings](https://dev.twitch.tv/docs/api/reference/#update-channel-guest-star-settings)
 * 
 * **BETA**
 * 
 * Mutates the channel settings for configuration of the Guest Star feature for a particular host.

 * ### Authorization
 * - Query parameter `broadcaster_id` must match the `user_id` in the [User-Access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)
 * - Requires OAuth Scope: **channel:manage:guest_star**

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated channel settings
 * 400 Bad Request|Missing `broadcaster_id`
 * .|Invalid `slot_count`
 * .|Invalid `group_layout`
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.UpdateChannelGuestStarSettings | UpdateChannelGuestStarSettings}: client_id, token, broadcaster_id, is_moderator_send_live_enabled?, slot_count?, is_browser_source_audio_enabled?, group_layout?, regenerate_browser_sources?
 */
export async function UpdateChannelGuestStarSettings(params: RequestBody.UpdateChannelGuestStarSettings): Promise<ResponseBody.UpdateChannelGuestStarSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/guest_star/channel_settings`, "PUT").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, is_moderator_send_live_enabled: params.is_moderator_send_live_enabled, slot_count: params.slot_count, is_browser_source_audio_enabled: params.is_browser_source_audio_enabled, group_layout: params.group_layout, regenerate_browser_sources: params.regenerate_browser_sources }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}

/**
 * ### [Get Guest Star Session](https://dev.twitch.tv/docs/api/reference/#get-guest-star-session)
 * 
 * **BETA**
 * 
 * Gets information about an ongoing Guest Star session for a particular channel.

 * ### Authorization
 * - Requires OAuth Scope: Requires OAuth Scopes: **channel:read:guest_star**, **channel:manage:guest_star**, **moderator:read:guest_star** or **moderator:manage:guest_star**
 * - Guests must be either invited or assigned a slot within the session

 * ### Response Codes
 * Code|Description
 * -|-
 * 204 No Content|Successfully updated channel settings
 * 400 Bad Request|Missing `broadcaster_id`
 * .|Invalid `slot_count`
 * .|Invalid `group_layout`
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on our [issue tracker](https://github.com/twitchdev/issues/).

 * @param params {@link RequestBody.GetGuestStarSession | GetGuestStarSession}: client_id, token, broadcaster_id, moderator_id
 */
export async function GetGuestStarSession(params: RequestBody.GetGuestStarSession): Promise<ResponseBody.GetGuestStarSession | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/guest_star/session`, "GET").setHeaders({
			"Client-Id": params.client_id,
			"Authorization": `Bearer ${params.token}`
		}).setSearch({ broadcaster_id: params.broadcaster_id, moderator_id: params.moderator_id }).fetch();
		return await getResponse(request, true);
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
export async function GetHypeTrainEvents<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:hype_train">>, first?: number, after?: string): Promise<ResponseBody.GetHypeTrainEvents | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/hypetrain/events`, "GET").setHeaders({
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
export async function CheckAutomodStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderation:read">>): Promise<ResponseBody.CheckAutomodStatus | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/enforcements/status`, "POST").setHeaders({
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
export async function ManageHeldAutoModMessages<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:automod">>, msg_id: string, action: "ALLOW" | "DENY"): Promise<ResponseBody.ManageHeldAutoModMessages | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/automod/message`, "POST").setHeaders({
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
export async function GetAutoModSettings<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:automod_settings">>, broadcaster_id: string): Promise<ResponseBody.GetAutoModSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/automod/settings`, "GET").setHeaders({
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
export async function UpdateAutoModSettings<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:automod">>, broadcaster_id: string, body: Omit<ResponseBody.GetAutoModSettings["data"], "broadcaster_id" | "moderator_id">): Promise<ResponseBody.UpdateAutoModSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/automod/settings`, "PUT").setHeaders({
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
export async function GetBannedUsers<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderation:read" | "moderator:manage:banned_users">>, user_id?: string | string[], first?: number, after?: string, before?: string): Promise<ResponseBody.GetBannedUsers | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/banned`, "GET").setHeaders({
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
export async function BanUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:banned_users">>, broadcaster_id: string, user_id: string, duration?: number, reason?: string): Promise<ResponseBody.BanUser | ResponseBody.Error> {
	const data = { user_id, duration, reason };
	if (!duration) delete data.duration;
	if (!reason) delete data.reason;

	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/bans`, "POST").setHeaders({
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
export async function UnbanUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:banned_users">>, broadcaster_id: string, user_id: string): Promise<ResponseBody.UnbanUser | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/bans`, "DELETE").setHeaders({
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
export async function GetUnbanRequests<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:unban_requests" | "moderator:manage:unban_requests">>, broadcaster_id: string, status?: "pending" | "approved" | "denied" | "acknowledged" | "canceled", user_id?: string, after?: string, first?: number): Promise<ResponseBody.GetUnbanRequests | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/unban_requests`, "GET").setHeaders({
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
export async function ResolveUnbanRequest<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:unban_requests">>, broadcaster_id: string, unban_request_id: string, status: "approved" | "denied", resolution_text?: string): Promise<ResponseBody.ResolveUnbanRequest<typeof status> | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/unban_requests`, "PATCH").setHeaders({
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
export async function GetBlockedTerms<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:blocked_terms" | "moderator:manage:blocked_terms">>, broadcaster_id: string, first?: number, after?: string): Promise<ResponseBody.GetBlockedTerms | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/blocked_terms`, "GET").setHeaders({
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
export async function AddBlockedTerm<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:blocked_terms">>, broadcaster_id: string, text: string): Promise<ResponseBody.AddBlockedTerm | ResponseBody.Error> {
	try {
		if (text.length < 2) throw "The length of the term in the text field is too short. The term must contain a minimum of 2 characters.";
		if (text.length > 500) throw "The length of the term in the text field is too long. The term may contain up to a maximum of 500 characters.";

		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/blocked_terms`, "POST").setHeaders({
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
export async function RemoveBlockedTerm<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:blocked_terms">>, broadcaster_id: string, id: string): Promise<ResponseBody.RemoveBlockedTerm | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/blocked_terms`, "DELETE").setHeaders({
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
export async function DeleteChatMessage<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:chat_messages">>, broadcaster_id: string, message_id?: string): Promise<ResponseBody.DeleteChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/chat`, "DELETE").setHeaders({
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
export async function GetModeratedChannels<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:moderated_channels">>, after?: string, first?: number): Promise<ResponseBody.GetModeratedChannels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/channels`, "GET").setHeaders({
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
export async function GetModerators<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderation:read" | "channel:manage:moderators">>, user_id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetModerators | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/moderators`, "GET").setHeaders({
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
export async function AddChannelModerator<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:moderators">>, user_id: string): Promise<ResponseBody.AddChannelModerator | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/moderators`, "POST").setHeaders({
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
export async function RemoveChannelModerator<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:moderators">>, user_id: string): Promise<ResponseBody.RemoveChannelModerator | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/moderators`, "DELETE").setHeaders({
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
export async function GetChannelVips<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:vips" | "channel:manage:vips">>, user_id?: string, first?: number, after?: string): Promise<ResponseBody.GetChannelVips | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/vips`, "GET").setHeaders({
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
export async function AddChannelVip<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:vips">>, user_id: string): Promise<ResponseBody.AddChannelVip | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/vips`, "POST").setHeaders({
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
export async function RemoveChannelVip<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:vips">>, broadcaster_id: string, user_id: string): Promise<ResponseBody.RemoveChannelVip | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/channels/vips`, "POST").setHeaders({
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
export async function UpdateShieldModeStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:shield_mode">>, broadcaster_id: string, is_active: boolean): Promise<ResponseBody.UpdateShieldModeStatus | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/shield_mode`, "PUT").setHeaders({
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
export async function GetShieldModeStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:shield_mode" | "moderator:manage:shield_mode">>, broadcaster_id: string): Promise<ResponseBody.GetShieldModeStatus | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/shield_mode`, "GET").setHeaders({
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
export async function WarnChatUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:warnings">>, broadcaster_id: string, user_id: string, reason: string): Promise<ResponseBody.WarnChatUser | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/moderation/warnings`, "POST").setHeaders({
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
export async function GetPolls<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:polls" | "channel:manage:polls">>, id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetPolls | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/polls`, "GET").setHeaders({
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
export async function CreatePoll<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:polls">>, title: string, choices: string[], duration: number, channel_points_voting_enabled?: boolean, channel_points_per_vote?: number): Promise<ResponseBody.CreatePoll | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/polls`, "POST").setHeaders({
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
export async function EndPoll<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:polls">>, id: string, status: "TERMINATED" | "ARCHIVED"): Promise<ResponseBody.EndPoll<typeof status> | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/polls`, "PATCH").setHeaders({
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
export async function GetPredictions<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:predictions" | "channel:manage:predictions">>, id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetPredictions | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/predictions`, "GET").setHeaders({
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
export async function CreatePrediction<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:predictions">>, title: string, outcomes: string[], prediction_window: number): Promise<ResponseBody.CreatePrediction | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/predictions`, "POST").setHeaders({
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
export async function EndPrediction<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:predictions">>, id: string, status: "RESOLVED" | "CANCELED" | "LOCKED", winning_outcome_id?: string): Promise<ResponseBody.EndPrediction | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/predictions`, "PATCH").setHeaders({
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
export async function StartRaid<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:raids">>, to_broadcaster_id: string): Promise<ResponseBody.StartRaid | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/raids`, "POST").setHeaders({
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
export async function CancelRaid<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:raids">>): Promise<ResponseBody.CancelRaid | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/raids`, "DELETE").setHeaders({
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
export async function SearchCategories(authorization: Authorization, query: string, first?: number, after?: string): Promise<ResponseBody.SearchCategories | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/search/categories`, "GET").setHeaders({
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
export async function SearchChannels(authorization: Authorization, query: string, live_only?: boolean, first?: number, after?: string): Promise<ResponseBody.SearchChannels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/search/channels`, "GET").setHeaders({
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
export async function GetStreamKey<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:stream_key">>): Promise<ResponseBody.GetStreamKey | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/streams/key`, "GET").setHeaders({
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
export async function GetStreams(authorization: Authorization, user_id?: string | string[], user_login?: string | string[], game_id?: string | string[], type?: "all" | "live", language?: string | string[], first?: number, before?: string, after?: string): Promise<ResponseBody.GetStreams | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/streams`, "GET").setHeaders({
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
export async function GetFollowedStreams<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:follows">>, first?: number, after?: string): Promise<ResponseBody.GetFollowedStreams | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/streams/followed`, "GET").setHeaders({
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
export async function GetBroadcasterSubscriptions<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:subscriptions">>, user_id?: string | string[], first?: number, after?: string, before?: string): Promise<ResponseBody.GetBroadcasterSubscriptions | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/subscriptions`, "GET").setHeaders({
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
export async function CheckUserSubscription<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:subscriptions">>, broadcaster_id: string): Promise<ResponseBody.CheckUserSubscription | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/subscriptions/user`, "GET").setHeaders({
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
export async function GetChannelTeams(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChannelTeams | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/subscriptions/user`, "GET").setHeaders({
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
export async function GetTeams(authorization: Authorization, name?: string, id?: string): Promise<ResponseBody.GetChannelTeams | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/subscriptions/user`, "GET").setHeaders({
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
}): Promise<ResponseBody.GetUsers | ResponseBody.Error>
{
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/users`, "GET").setHeaders({
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
export async function UpdateUserDescription<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:edit">>, description: string): Promise<ResponseBody.GetUsers | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/users`, "PUT").setHeaders({
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
export async function GetUserBlockList<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:blocked_users">>, broadcaster_id: string, first?: number, after?: string): Promise<ResponseBody.GetUserBlockList | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/users/blocks`, "GET").setHeaders({
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
export async function BlockUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:blocked_users">>, target_user_id: string, source_context?: "chat" | "whisper", reason?: "harassment" | "spam" | "other"): Promise<ResponseBody.BlockUser | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/users/blocks`, "PUT").setHeaders({
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
export async function UnblockUser<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:blocked_users">>, target_user_id: string): Promise<ResponseBody.UnblockUser | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/users/blocks`, "DELETE").setHeaders({
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
export async function GetVideos(authorization: Authorization, query: {id: string | string[]} | {user_id: string} | {game_id: string}, language?: string, period?: "all" | "day" | "month" | "week", sort?: "time" | "trending" | "views", type?: "all" | "archive" | "highlight" | "upload", first?: number, after?: string, before?: string): Promise<ResponseBody.GetVideos | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/videos`, "GET").setHeaders({
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
export async function DeleteVideos<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:videos">>, id: string | string[]): Promise<ResponseBody.DeleteVideos | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/videos`, "DELETE").setHeaders({
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
export async function SendWhisper<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:whispers">>, to_user_id: string, message: string): Promise<ResponseBody.SendWhisper | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Options.apiHelixPath}/whispers`, "POST").setHeaders({
			"Client-Id": authorization.client_id,
			"Authorization": `Bearer ${authorization.token}`,
			"Content-Type": "application/json"
		}).setSearch({ from_user_id: authorization.user_id, to_user_id }).setBody({ message }).fetch();
		return request.ok ? {ok: true, status: 204} : await getResponse(request);
	} catch(e) { return getError(e) }
}
/**
 * Validates access token and if its valid, returns data of it. [Read More](https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token)
 * 
 * NOTE: will always return 200 status if `Options.twitchCLIMode` is `true`
 * @param authorization Access token data or token itself to validate
 */
export async function OAuth2Validate<S extends Authorization.Scope[]>(token_data: Authorization<S>["token"] | Authorization<S>): Promise<ResponseBody.OAuth2Validate<S> | ResponseBody.Error.OAuth2Validate<Authorization<S>["token"]>> {
	if (Options.twitchCLIMode) {
		if (typeof token_data === "string")
			return {ok: true, status: 200, type: "user", token: token_data, client_id: "", scopes: [] as any, expires_in: 1, user_login: "", user_id: ""};
		else if (token_data.type === "user")
			return {ok: true, status: 200, type: token_data.type, token: token_data.token, client_id: token_data.client_id, scopes: token_data.scopes, expires_in: token_data.expires_in, user_login: token_data.user_login, user_id: token_data.user_id};
		else
			return {ok: true, status: 200, type: token_data.type, token: token_data.token, client_id: token_data.client_id, scopes: token_data.scopes, expires_in: token_data.expires_in};
	}

	const token = typeof token_data === "string" ? token_data : token_data.token;
	if (token.length < 1) return ResponseBody.Error.makeFromGlobalError_OAuth2Validate(new Error(), 401, token);
	try {
		const request = await new FetchBuilder(`${Options.idOAuth2Path}/validate`, "GET").setHeaders({
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
	} catch(e) {
		if (e != null && typeof e === "object")
			(e as any).token = token;
		return getError(e) as any;
	}
}
/**
 * If your app no longer needs an access token, you can revoke it by this method. [Read More](https://dev.twitch.tv/docs/authentication/revoke-tokens/#revoking-access-token)
 * 
 * NOTE: will always return 200 status if `Options.twitchCLIMode` is `true`
 * @param authorization Access token data to revoke
 */
export async function OAuth2Revoke(authorization: Authorization): Promise<ResponseBody.OAuth2Revoke | ResponseBody.Error> {
	if (Options.twitchCLIMode) {
		return {ok: true, status: 200};
	}

	try {
		if (authorization.token.length < 1) throw "invalid access token";
		const request = await new FetchBuilder(`${Options.idOAuth2Path}/revoke`, "POST").setHeaders({
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
	export async function ClientCredentials(client_id: string, client_secret: string): Promise<ResponseBody.OAuth2Token.ClientCredentials | ResponseBody.Error> {
		try {
			const request = await new FetchBuilder(`${Options.idOAuth2Path}/token`, "POST").setHeaders({
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
	 * 
	 * NOTE: will always return 500 status if `Options.twitchCLIMode` is `true`
	 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
	 * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
	 * @param redirect_uri Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) redirect URI.
	 * @param code The code that the response returned after user authorized app from response `Authorization.URL.Code` in the `code` query parameter.
	 */
	export async function AuthorizationCode<S extends Authorization.Scope[]>(client_id: string, client_secret: string, redirect_uri: string, code: string): Promise<ResponseBody.OAuth2Token.AuthorizationCode<S> | ResponseBody.Error> {
		if (Options.twitchCLIMode) {
			return ResponseBody.Error.makeFromGlobalError(new Error("authorization code grant flow is not supported when Options.twitchCLIMode is true"), 500);
		}

		try {
			const request = await new FetchBuilder(`${Options.idOAuth2Path}/token`, "POST").setHeaders({
				"Content-Type": "x-www-form-urlencoded"
			}).setSearch({ client_id, client_secret, redirect_uri, code, grant_type: "authorization_code" }).fetch();
			const response: any = await getResponse(request);
			if (request.ok) {
				if (response.scope) {
					response.scopes = response.scope;
					delete response.scope;
				}
				else
					response.scopes = [];
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
	 * 
	 * NOTE: will always return 500 status if `twitchCLIMode` is `true`
	 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
	 * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
	 * @param refresh_token The refresh token issued to the client.
	 */
	export async function RefreshToken<S extends Authorization.Scope[]>(client_id: string, client_secret: string, refresh_token: string): Promise<ResponseBody.OAuth2Token.AuthorizationCode<S> | ResponseBody.Error> {
		if (Options.twitchCLIMode) {
			return ResponseBody.Error.makeFromGlobalError(new Error("refreshing token is not supported when twitchCLIMode is true"), 500);
		}

		try {
			const request = await new FetchBuilder(`${Options.idOAuth2Path}/token`, "POST").setHeaders({
				"Content-Type": "x-www-form-urlencoded"
			}).setSearch({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }).fetch();
			const response: any = await getResponse(request);
			if (request.ok) {
				if (response.scope) {
					response.scopes = response.scope;
					delete response.scope;
				}
				else
					response.scopes = [];
			}
			return response;
		} catch(e) { return getError(e) }
	}
	/**
	 * https://dev.twitch.tv/docs/cli/mock-api-command/#getting-a-user-access-token
	 * 
	 * WARNING: will return 500 status if `twitchCLIMode` is `false`
	 * @param client_id `Client-ID` printed when you used `twitch mock-api generate`
	 * @param client_secret `Secret` printed when you used `twitch mock-api generate`
	 * @param user_id `User ID` printed when you used `twitch mock-api generate`
	 */
	export async function UserToken(client_id: string, client_secret: string, user_id: string, scopes: Authorization.Scope[]): Promise<ResponseBody.OAuth2Token.AuthorizationCode | ResponseBody.Error> {
		if (!Options.twitchCLIMode) {
			return ResponseBody.Error.makeFromGlobalError(new Error("user token is not supported when twitchCLIMode is false"), 500);
		}

		try {
			const request = await new FetchBuilder(`${Options.idOAuth2Path}/authorize`, "POST").setHeaders({
				"Content-Type": "x-www-form-urlencoded"
			}).setSearch({ client_id, client_secret, user_id, grant_type: "user_token", scope: scopes.join(" ") }).fetch();
			const response: any = await getResponse(request);
			if (request.ok) {
				if (response.scope) {
					response.scopes = response.scope;
					delete response.scope;
				}
				else
					response.scopes = [];
			}
			return response;
		} catch(e) { return getError(e) }
	}
}

export function getError<ResponseBodyError_ extends ResponseBody.Error = ResponseBody.Error>(error: unknown): ResponseBodyError_ {
	var message: string = `Unknown error`;
	var ok = false;
	var status: ResponseBody.Error["status"] = 400;

	if (!(error instanceof Error))
		error = new Error(`${error}`);

	if ((error as ResponseBodyError_).ok == null) (error as ResponseBodyError_).ok = ok;
	if ((error as ResponseBodyError_).status == null) (error as ResponseBodyError_).status = status;
	if ((error as ResponseBodyError_).message == null) (error as ResponseBodyError_).message = message;

	return error as ResponseBodyError_;
}
/** @param data0_to_data `response.data = response.data[0];` */
export async function getResponse<ResponseBody_ = ResponseBody.Base>(request: Response, data0_to_data?: boolean) {
	const response: any = await request.json();
	response.ok = request.ok;
	response.status = request.status;
	if (data0_to_data && request.ok) response.data = response.data[0];
	return response as ResponseBody_;
}

export class FetchBuilder {
	readonly url: string = "";
	readonly search: Record<string, string | string[]> = {};
	readonly hash: Record<string, string | string[]> = {};
	readonly headers: Record<string, string> = {};

	method: string = "GET";
	body: string | null = null;

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

	/** @param timeout in milliseconds, if `false`, RequestTimeout will be disabled */
	setTimeout(timeout: number | false) {
		this.timeout = timeout === false ? 0 : timeout;
		return this;
	}

	/** @param timeout in milliseconds, if `false`, RequestTimeout will be disabled */
	static setGlobalTimeout(timeout: number | false) {
		this.global_timeout = timeout === false ? 0 : timeout;
	}

	async fetch() {
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

		if (this.timeout > 0) {
			const controller = new AbortController();
			init.signal = controller.signal;
			var timeout: NodeJS.Timeout | undefined = setTimeout(() => controller.abort({ status: 408, message: "request timeout" }), this.timeout);

			try {
				const request = await fetch(url, init);
				if (timeout) {
					clearTimeout(timeout);
					timeout = undefined;
				}
				return request;
			}
			catch(e) { throw e }
		}
		else
			return await fetch(url, init);
	}
}