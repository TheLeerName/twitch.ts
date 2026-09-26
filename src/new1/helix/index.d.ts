export interface URLSearchParams extends global.URLSearchParams {
	/**
	 * - If **value** is `null`/`undefined`, method will do nothing.
	 * - If **value** is array:
	 *   - If entry is `null`/`undefined`, method will do nothing with that entry.
	 *   - Otherwise, entry will be appended as a new search parameter.
	 * - Otherwise, **value** will be appended as a new search parameter.
	 */
	append(name: string, value: URLSearchParams.Value): this;
	appendMany(params: Record<string, URLSearchParams.Value>): this;
}
export namespace URLSearchParams {
	export type Value = string | boolean | number | null | undefined | (string | boolean | number | null | undefined)[];
}

export declare class URL extends global.URL {
	searchParams: URLSearchParams;

	constructor(url: string | this, base?: string | this);
}

export interface RequestQueryParameters {
	/** If specified, API endpoint path will be changed to this value */
	apiPath?: string;
	/** An AbortSignal to set request's signal. */
	signal?: AbortSignal;
}

export interface Response<ResponseJson> extends globalThis.Response {
	json(): Promise<ResponseJson>;
}

//export declare function fetch<ResponseJson>(input: URL | string, init?: RequestInit): Promise<Response<ResponseJson>>;


import * as StartCommercial from "./channels/commercial/post";
import * as GetAdSchedule from "./channels/ads/get";
import * as SnoozeNextAd from "./channels/ads/schedule/snooze/post";
import * as GetExtensionAnalytics from "./analytics/extensions/get";
import * as GetGameAnalytics from "./analytics/games/get";
import * as GetBitsLeaderboard from "./bits/leaderboard/get";
import * as GetCheermotes from "./bits/cheermotes/get";
import * as GetCustomPowerup from "./bits/custom_power_ups/get";
import * as GetExtensionTransactions from "./extensions/transactions/get";
import * as GetChannelInformation from "./channels/get";
import * as ModifyChannelInformation from "./channels/patch";
import * as GetChannelEditors from "./channels/editors/get";
import * as GetFollowedChannels from "./channels/followed/get";
import * as GetChannelFollowers from "./channels/followers/get";