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


export * as StartCommercial from "./channels/commercial/post";
export * as GetAdSchedule from "./channels/ads/get";
export * as SnoozeNextAd from "./channels/ads/schedule/snooze/post";
export * as GetExtensionAnalytics from "./analytics/extensions/get";
export * as GetGameAnalytics from "./analytics/games/get";
export * as GetBitsLeaderboard from "./bits/leaderboard/get";
export * as GetCheermotes from "./bits/cheermotes/get";
export * as GetCustomPowerup from "./bits/custom_power_ups/get";
export * as GetExtensionTransactions from "./extensions/transactions/get";
export * as GetChannelInformation from "./channels/get";
export * as ModifyChannelInformation from "./channels/patch";
export * as GetChannelEditors from "./channels/editors/get";
export * as GetFollowedChannels from "./channels/followed/get";
export * as GetChannelFollowers from "./channels/followers/get";
export * as CreateCustomRewards from "./channel_points/custom_rewards/post";
export * as DeleteCustomReward from "./channel_points/custom_rewards/delete";
export * as GetCustomReward from "./channel_points/custom_rewards/get";
export * as GetCustomRewardRedemption from "./channel_points/custom_rewards/redemptions/get";
export * as UpdateCustomReward from "./channel_points/custom_rewards/patch";
export * as UpdateRedemptionStatus from "./channel_points/custom_rewards/redemptions/patch";
export * as GetCharityCampaign from "./charity/campaigns/get";
export * as GetCharityCampaignDonations from "./charity/donations/get";
export * as GetChatters from "./chat/chatters/get";
export * as GetChannelEmotes from "./chat/emotes/get";
export * as GetGlobalEmotes from "./chat/emotes/global/get";
export * as GetEmoteSets from "./chat/emotes/set/get";
export * as GetChannelChatBadges from "./chat/badges/get";
export * as GetGlobalChatBadges from "./chat/badges/global/get";
export * as GetChatSettings from "./chat/settings/get";
export * as GetSharedChatSession from "./shared_chat/session/get";
export * as GetUserEmotes from "./chat/emotes/user/get";
export * as UpdateChatSettings from "./chat/settings/patch";
export * as SendChatAnnouncement from "./chat/announcements/post";
export * as SendShoutout from "./chat/shoutouts/post";
export * as SendChatMessage from "./chat/messages/post";
export * as GetPinnedChatMessage from "./chat/pins/get";
export * as PinChatMessage from "./chat/pins/put";
export * as UpdatePinnedChatMessage from "./chat/pins/patch";
export * as UnpinChatMessage from "./chat/pins/delete";
export * as GetUserChatColor from "./chat/color/get";
export * as UpdateUserChatColor from "./chat/color/put";
export * as CreateClip from "./clips/post";
export * as CreateClipFromVOD from "./videos/clips/post";
export * as GetClips from "./clips/get";
export * as GetClipsDownload from "./clips/downloads/get";
export * as GetConduits from "./eventsub/conduits/get";
export * as CreateConduits from "./eventsub/conduits/post";
export * as UpdateConduits from "./eventsub/conduits/patch";
export * as DeleteConduit from "./eventsub/conduits/delete";
export * as GetConduitShards from "./eventsub/conduits/shards/get";
export * as UpdateConduitShards from "./eventsub/conduits/shards/patch";
export * as GetContentClassificationLabels from "./content_classification_labels/get";
export * as GetDropsEntitlements from "./entitlements/drops/get";
export * as UpdateDropsEntitlements from "./entitlements/drops/patch";
export * as GetExtensionConfigurationSegment from "./extensions/configurations/get";
export * as SetExtensionConfigurationSegment from "./extensions/configurations/put";
export * as SetExtensionRequiredConfiguration from "./extensions/required_configuration/put";
export * as SendExtensionPubSubMessage from "./extensions/pubsub/post";
export * as GetExtensionLiveChannels from "./extensions/live/get";
export * as GetExtensionSecrets from "./extensions/jwt/secrets/get";
export * as CreateExtensionSecret from "./extensions/jwt/secrets/post";
export * as SendExtensionChatMessage from "./extensions/chat/post";
export * as GetExtensions from "./extensions/get";
export * as GetReleasedExtensions from "./extensions/released/get";
export * as GetExtensionBitsProducts from "./bits/extensions/get";
export * as UpdateExtensionBitsProduct from "./bits/extensions/put";
export * as CreateEventSubSubscription from "./eventsub/subscriptions/post";
export * as DeleteEventSubSubscription from "./eventsub/subscriptions/delete";
export * as GetEventSubSubscriptions from "./eventsub/subscriptions/get";
export * as GetTopGames from "./games/top/get";
export * as GetGames from "./games/get";
export * as GetCreatorGoals from "./goals/get";
export * as GetChannelGuestStarSettings from "./guest_star/channel_settings/get";
export * as UpdateChannelGuestStarSettings from "./guest_star/channel_settings/put";
export * as GetGuestStarSession from "./guest_star/session/get";
export * as CreateGuestStarSession from "./guest_star/session/post";
export * as EndGuestStarSession from "./guest_star/session/delete";
export * as GetGuestStarInvites from "./guest_star/invites/get";
export * as SendGuestStarInvite from "./guest_star/invites/post";
export * as DeleteGuestStarInvite from "./guest_star/invites/delete";
export * as AssignGuestStarSlot from "./guest_star/slot/post";
export * as UpdateGuestStarSlot from "./guest_star/slot/patch";
export * as DeleteGuestStarSlot from "./guest_star/slot/delete";
export * as UpdateGuestStarSlotSettings from "./guest_star/slot_settings/patch";