import { Authorization, Paths } from ".";
import * as RequestBody from "./requestbody";
import * as ResponseBody from "./responsebody";
import * as EventSub from "./eventsub";

/**
 * Starts a commercial on the specified channel. [Read More](https://dev.twitch.tv/docs/api/reference/#start-commercial)
 * 
 * **NOTE**: Only partners and affiliates may run commercials and they must be streaming live at the time.
 * 
 * **NOTE**: Only the broadcaster may start a commercial; the broadcaster’s editors and moderators may not start commercials on behalf of the broadcaster.
 * @param authorization [User access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes the **channel:edit:commercial** scope.
 * @param length The length of the commercial to run, in seconds. Twitch tries to serve a commercial that’s the requested length, but it may be shorter or longer. The maximum length you should request is 180 seconds.
 */
export async function StartCommercial<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:edit:commercial">>, length: number): Promise<ResponseBody.StartCommercial | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/commercial`, "POST").setHeaders({
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
export async function GetAdSchedule<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:ads">>): Promise<ResponseBody.GetAdSchedule | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/ads`, "GET").setHeaders({
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
export async function SnoozeNextAd<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:ads">>): Promise<ResponseBody.SnoozeNextAd | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/ads/schedule/snooze`, "POST").setHeaders({
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
export async function GetExtensionAnalytics<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "analytics:read:extensions">>, extension_id?: string, started_at?: string, ended_at?: string, first?: number, after?: string): Promise<ResponseBody.GetExtensionAnalytics | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/analytics/extensions`, "GET").setHeaders({
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
export async function GetGameAnalytics<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "analytics:read:games">>, game_id?: string, started_at?: string, ended_at?: string, first?: number, after?: number): Promise<ResponseBody.GetGameAnalytics | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/analytics/games`, "GET").setHeaders({
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
export async function GetBitsLeaderboard<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "bits:read">>, count?: number, period?: "day" | "week" | "month" | "year" | "all", started_at?: string, user_id?: string): Promise<ResponseBody.GetBitsLeaderboard | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/bits/leaderboard`, "GET").setHeaders({
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
export async function GetCheermotes(authorization: Authorization, broadcaster_id?: string): Promise<ResponseBody.GetBitsLeaderboard | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/bits/cheermotes`, "GET").setHeaders({
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
export async function GetExtensionTransactions<S extends Authorization.Scope[]>(authorization: Authorization.App, extension_id: string, id?: string | string[], first?: number, after?: string): Promise<ResponseBody.GetExtensionTransactions<typeof extension_id> | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/extensions/transactions`, "GET").setHeaders({
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
export async function GetChannelInformation(authorization: Authorization, broadcaster_id: string | string[]): Promise<ResponseBody.GetChannelInformation | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels`, "GET").setHeaders({
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
export async function ModifyChannelInformation<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:broadcast">>, body: RequestBody.ModifyChannelInformation): Promise<ResponseBody.ModifyChannelInformation | ResponseBody.Error> {
	try {
		if (Object.keys(body).length === 0) throw `You must specify at least one field in request body!`;
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels`, "PATCH").setHeaders({
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
export async function GetChannelEditors<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:editors">>): Promise<ResponseBody.GetChannelEditors | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/editors`, "GET").setHeaders({
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
export async function GetFollowedChannels<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:read:follows">>, broadcaster_id?: string, first?: number, after?: string): Promise<ResponseBody.GetFollowedChannels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/followed`, "GET").setHeaders({
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
export async function GetChannelFollowers(authorization: Authorization.User, broadcaster_id: string, user_id?: string, first?: number, after?: string): Promise<ResponseBody.GetChannelFollowers | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/followers`, "GET").setHeaders({
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
export async function CreateCustomReward<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, body: RequestBody.CreateCustomReward): Promise<ResponseBody.CreateCustomReward | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channel_points/custom_rewards`, "POST").setHeaders({
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
export async function DeleteCustomReward<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, id: string): Promise<ResponseBody.DeleteCustomReward | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channel_points/custom_rewards`, "DELETE").setHeaders({
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
export async function GetCustomRewards<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:redemptions" | "channel:manage:redemptions">>, id?: string | string[], only_manageable_rewards?: boolean): Promise<ResponseBody.GetCustomRewards | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channel_points/custom_rewards`, "GET").setHeaders({
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
export async function GetCustomRewardRedemptions<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:redemptions" | "channel:manage:redemptions">>, reward_id: string, status?: string, id?: string | string[], sort?: string, after?: string, first?: number): Promise<ResponseBody.GetCustomRewardRedemptions | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channel_points/custom_rewards/redemptions`, "GET").setHeaders({
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
export async function UpdateCustomReward<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, id: string, body: RequestBody.UpdateCustomReward): Promise<ResponseBody.UpdateCustomReward | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channel_points/custom_rewards`, "PATCH").setHeaders({
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
export async function UpdateCustomRewardRedemptionStatus<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:manage:redemptions">>, id: string | string[], reward_id: string, status: "CANCELED" | "FULFILLED"): Promise<ResponseBody.UpdateCustomRewardRedemptionStatus | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/channel_points/custom_rewards/redemptions`, "PATCH").setHeaders({
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
export async function GetCharityCampaigns<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:charity">>): Promise<ResponseBody.GetCharityCampaigns | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/charity/campaigns`, "GET").setHeaders({
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
export async function GetCharityCampaignDonations<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:charity">>, first?: number, after?: string): Promise<ResponseBody.GetCharityCampaignDonations | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/charity/donations`, "GET").setHeaders({
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
export async function GetChatters<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:read:chatters">>, broadcaster_id: string, first?: number, after?: string): Promise<ResponseBody.GetChatters | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/chatters`, "GET").setHeaders({
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
export async function GetChannelEmotes(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChannelEmotes | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/emotes`, "GET").setHeaders({
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
export async function GetGlobalEmotes(authorization: Authorization): Promise<ResponseBody.GetGlobalEmotes | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/emotes/global`, "GET").setHeaders({
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
export async function GetEmoteSets(authorization: Authorization, emote_set_id: string | string[]): Promise<ResponseBody.GetEmoteSets | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/emotes/set`, "GET").setHeaders({
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
export async function GetChannelChatBadges(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChannelChatBadges | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/badge`, "GET").setHeaders({
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
export async function GetGlobalChatBadges(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetGlobalChatBadges | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/badges/global`, "GET").setHeaders({
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
export async function GetChatSettings(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetChatSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/settings`, "GET").setHeaders({
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
export async function GetSharedChatSession(authorization: Authorization, broadcaster_id: string): Promise<ResponseBody.GetSharedChatSession | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/shared_chat/session`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/emotes/user`, "GET").setHeaders({
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
export async function UpdateChatSettings<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:chat_settings">>, broadcaster_id: string, body: RequestBody.UpdateChatSettings): Promise<ResponseBody.UpdateChatSettings | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/settings`, "PATCH").setHeaders({
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
export async function SendChatAnnouncement<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:announcements">>, broadcaster_id: string): Promise<ResponseBody.SendChatAnnouncement | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/announcements`, "POST").setHeaders({
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
export async function SendShoutout<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "moderator:manage:shoutouts">>, from_broadcaster_id: string, to_broadcaster_id: string): Promise<ResponseBody.SendShoutout | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/shoutouts`, "POST").setHeaders({
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
export async function SendChatMessage<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:write:chat">>, broadcaster_id: string, message: string, reply_parent_message_id?: string): Promise<ResponseBody.SendChatMessage | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/messages`, "POST").setHeaders({
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
export async function GetUserChatColor(authorization: Authorization, user_id: string): Promise<ResponseBody.GetUserChatColor | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/color`, "GET").setHeaders({
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
export async function UpdateUserChatColor<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "user:manage:chat_color">>, color: string): Promise<ResponseBody.UpdateUserChatColor | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/chat/color`, "PUT").setHeaders({
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
export async function CreateClip<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "clips:edit">>, broadcaster_id: string, has_delay?: boolean): Promise<ResponseBody.CreateClip | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/clips`, "POST").setHeaders({
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
export async function GetClips(authorization: Authorization, query: {broadcaster_id: string} | {game_id: string} | {id: string | string[]}, started_at?: string, ended_at?: string, first?: number, before?: string, after?: string, is_featured?: boolean): Promise<ResponseBody.GetClips | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/clips`, "GET").setHeaders({
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
export async function GetConduits(authorization: Authorization.App): Promise<ResponseBody.GetConduits | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/conduits`, "GET").setHeaders({
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
export async function CreateConduit(authorization: Authorization.App, shard_count: number): Promise<ResponseBody.CreateConduit | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/conduits`, "POST").setHeaders({
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
export async function UpdateConduit(authorization: Authorization.App, id: string, shard_count: string): Promise<ResponseBody.UpdateConduit | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/conduits`, "PATCH").setHeaders({
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
export async function DeleteConduit(authorization: Authorization.App, id: string): Promise<ResponseBody.DeleteConduit | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/conduits`, "DELETE").setHeaders({
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
export async function GetConduitShards(authorization: Authorization.App, conduit_id: string, status?: string, after?: string): Promise<ResponseBody.GetConduitShards | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/conduits/shards`, "GET").setHeaders({
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
): Promise<ResponseBody.UpdateConduitShards | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/conduits/shards`, "PATCH").setHeaders({
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
export async function GetContentClassificationLabels(authorization: Authorization, locale: "en-US" | "bg-BG" | "cs-CZ" | "da-DK" | "de-DE" | "el-GR" | "en-GB" | "es-ES" | "es-MX" | "fi-FI" | "fr-FR" | "hu-HU" | "it-IT" | "ja-JP" | "ko-KR" | "nl-NL" | "no-NO" | "pl-PL" | "pt-BT" | "pt-PT" | "ro-RO" | "ru-RU" | "sk-SK" | "sv-SE" | "th-TH" | "tr-TR" | "vi-VN" | "zh-CN" | "zh-TW"): Promise<ResponseBody.GetContentClassificationLabels | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/content_classification_labels`, "GET").setHeaders({
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
export async function CreateEventSubSubscription<Subscription_ extends EventSub.Subscription>(authorization: Authorization, subscription: Subscription_): Promise<ResponseBody.CreateEventSubSubscription<Subscription_> | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/subscriptions`, "POST").setHeaders({
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
export async function DeleteEventSubSubscription(authorization: Authorization, id: string): Promise<ResponseBody.DeleteEventSubSubscription | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/subscriptions`, "DELETE").setHeaders({
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
export async function GetEventSubSubscriptions(authorization: Authorization, status?: EventSub.SubscriptionType, type?: ReturnType<typeof EventSub.Subscription[keyof typeof EventSub.Subscription]>["type"], user_id?: string, subscription_id?: string, after?: string): Promise<ResponseBody.GetEventSubSubscriptions | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/eventsub/subscriptions`, "GET").setHeaders({
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
export async function GetTopGames(authorization: Authorization, first?: number, after?: string, before?: string): Promise<ResponseBody.GetTopGames | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/games/top`, "GET").setHeaders({
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
export async function GetGames(authorization: Authorization, name?: string | string[], id?: string | string[], igdb_id?: string | string[]): Promise<ResponseBody.GetGames | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/games`, "GET").setHeaders({
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
export async function GetCreatorGoals<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:goals">>): Promise<ResponseBody.GetCreatorGoals | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/goals`, "GET").setHeaders({
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
export async function GetHypeTrainEvents<S extends Authorization.Scope[]>(authorization: Authorization.User<Authorization.WithScope<S, "channel:read:hype_train">>, first?: number, after?: string): Promise<ResponseBody.GetHypeTrainEvents | ResponseBody.Error> {
	try {
		const request = await new FetchBuilder(`${Paths.apiHelix}/hypetrain/events`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/enforcements/status`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/automod/message`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/automod/settings`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/automod/settings`, "PUT").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/banned`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/bans`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/bans`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/unban_requests`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/unban_requests`, "PATCH").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/blocked_terms`, "GET").setHeaders({
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

		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/blocked_terms`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/blocked_terms`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/chat`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/channels`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/moderators`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/moderators`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/moderators`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/vips`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/vips`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/channels/vips`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/shield_mode`, "PUT").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/shield_mode`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/moderation/warnings`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/polls`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/polls`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/polls`, "PATCH").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/predictions`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/predictions`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/predictions`, "PATCH").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/raids`, "POST").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/raids`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/search/categories`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/search/channels`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/streams/key`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/streams`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/streams/followed`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/subscriptions`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/subscriptions/user`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/subscriptions/user`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/subscriptions/user`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/users`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/users`, "PUT").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/users/blocks`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/users/blocks`, "PUT").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/users/blocks`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/videos`, "GET").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/videos`, "DELETE").setHeaders({
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
		const request = await new FetchBuilder(`${Paths.apiHelix}/whispers`, "POST").setHeaders({
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
export async function OAuth2Validate<S extends Authorization.Scope[]>(token_data: Authorization<S>["token"] | Authorization<S>): Promise<ResponseBody.OAuth2Validate<S> | ResponseBody.Error.OAuth2Validate<Authorization<S>["token"]>> {
	const token = typeof token_data === "string" ? token_data : token_data.token;
	if (token.length < 1) return getError("#401 invalid access token");
	try {
		const request = await new FetchBuilder(`${Paths.idOAuth2}/validate`, "GET").setHeaders({
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
export async function OAuth2Revoke(authorization: Authorization): Promise<ResponseBody.OAuth2Revoke | ResponseBody.Error> {
	try {
		if (authorization.token.length < 1) throw "invalid access token";
		const request = await new FetchBuilder(`${Paths.idOAuth2}/revoke`, "POST").setHeaders({
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
			const request = await new FetchBuilder(`${Paths.idOAuth2}/token`, "POST").setHeaders({
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
	 * @param code The code that the response returned after user authorized app from response `Authorization.URL.Code` in the `code` query parameter.
	 */
	export async function AuthorizationCode<S extends Authorization.Scope[]>(client_id: string, client_secret: string, redirect_uri: string, code: string): Promise<ResponseBody.OAuth2Token.AuthorizationCode<S> | ResponseBody.Error> {
		try {
			const request = await new FetchBuilder(`${Paths.idOAuth2}/token`, "POST").setHeaders({
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
	 * @param client_id Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID.
	 * @param client_secret Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client secret.
	 * @param refresh_token The refresh token issued to the client.
	 */
	export async function RefreshToken<S extends Authorization.Scope[]>(client_id: string, client_secret: string, refresh_token: string): Promise<ResponseBody.OAuth2Token.RefreshToken<S> | ResponseBody.Error> {
		try {
			const request = await new FetchBuilder(`${Paths.idOAuth2}/token`, "POST").setHeaders({
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
}

function getError<ResponseBodyError_ = ResponseBody.Error>(error: unknown) {
	var message: string = `Unknown error`;
	var ok = false;
	var status = 400;

	if (error instanceof Error) message = `${error.message}`;
	else if ((error as any).status && (error as any).message) return { ok, status: (error as any).status, message: (error as any).message } as ResponseBodyError_;
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
async function getResponse<ResponseBody_ = ResponseBody.Base>(request: Response, data0_to_data?: boolean) {
	const response: any = await request.json();
	response.ok = request.ok;
	response.status = request.status;
	if (data0_to_data && request.ok) response.data = response.data[0];
	return response as ResponseBody_;
}

class FetchBuilder {
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