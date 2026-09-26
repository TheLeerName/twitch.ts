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
import * as CreateCustomRewards from "./channel_points/custom_rewards/post";
import * as DeleteCustomReward from "./channel_points/custom_rewards/delete";
import * as GetCustomReward from "./channel_points/custom_rewards/get";
import * as GetCustomRewardRedemption from "./channel_points/custom_rewards/redemptions/get";
import * as UpdateCustomReward from "./channel_points/custom_rewards/patch";
import * as UpdateRedemptionStatus from "./channel_points/custom_rewards/redemptions/patch";
import * as GetCharityCampaign from "./charity/campaigns/get";
import * as GetCharityCampaignDonations from "./charity/donations/get";
import * as GetChatters from "./chat/chatters/get";
import * as GetChannelEmotes from "./chat/emotes/get";
import * as GetGlobalEmotes from "./chat/emotes/global/get";
import * as GetEmoteSets from "./chat/emotes/set/get";
import * as GetChannelChatBadges from "./chat/badges/get";
import * as GetGlobalChatBadges from "./chat/badges/global/get";
import * as GetChatSettings from "./chat/settings/get";
import * as GetSharedChatSession from "./shared_chat/session/get";
import * as GetUserEmotes from "./chat/emotes/user/get";
import * as UpdateChatSettings from "./chat/settings/patch";
import * as SendChatAnnouncement from "./chat/announcements/post";
import * as SendShoutout from "./chat/shoutouts/post";
import * as SendChatMessage from "./chat/messages/post";
import * as GetPinnedChatMessage from "./chat/pins/get";
import * as PinChatMessage from "./chat/pins/put";
import * as UpdatePinnedChatMessage from "./chat/pins/patch";
import * as UnpinChatMessage from "./chat/pins/delete";
import * as GetUserChatColor from "./chat/color/get";
import * as UpdateUserChatColor from "./chat/color/put";
import * as CreateClip from "./clips/post";
import * as CreateClipFromVOD from "./videos/clips/post";
import * as GetClips from "./clips/get";
import * as GetClipsDownload from "./clips/downloads/get";
import * as GetConduits from "./eventsub/conduits/get";
import * as CreateConduits from "./eventsub/conduits/post";
import * as UpdateConduits from "./eventsub/conduits/patch";
import * as DeleteConduit from "./eventsub/conduits/delete";
import * as GetConduitShards from "./eventsub/conduits/shards/get";
import * as UpdateConduitShards from "./eventsub/conduits/shards/patch";
import * as GetContentClassificationLabels from "./content_classification_labels/get";
import * as GetDropsEntitlements from "./entitlements/drops/get";
import * as UpdateDropsEntitlements from "./entitlements/drops/patch";
import * as GetExtensionConfigurationSegment from "./extensions/configurations/get";
import * as SetExtensionConfigurationSegment from "./extensions/configurations/put";
import * as SetExtensionRequiredConfiguration from "./extensions/required_configuration/put";
import * as SendExtensionPubSubMessage from "./extensions/pubsub/post";
import * as GetExtensionLiveChannels from "./extensions/live/get";
import * as GetExtensionSecrets from "./extensions/jwt/secrets/get";