import { GetChannelEmotes } from "./request";
import * as EventSub from "./eventsub";

export interface ClientIDAndAccessToken {
	/** Client ID which belongs to this access token. */
	client_id: string;
	/** Access token */
	token: string;
}

export interface StartCommercial extends ClientIDAndAccessToken {
	/** The ID of the partner or affiliate broadcaster that wants to run the commercial. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** The length of the commercial to run, in seconds. Twitch tries to serve a commercial that’s the requested length, but it may be shorter or longer. The maximum length you should request is 180 seconds. */
	length: number;
}

export interface GetAdSchedule extends ClientIDAndAccessToken {
	/** Provided `broadcaster_id` must match the `user_id` in the auth token. */
	broadcaster_id: string;
}

export interface SnoozeNextAd extends ClientIDAndAccessToken {
	/** Provided `broadcaster_id` must match the `user_id` in the auth token. */
	broadcaster_id: string;
}

export type GetExtensionAnalytics = GetExtensionAnalytics.Base | GetExtensionAnalytics.WithDates;
export namespace GetExtensionAnalytics {
	export type Type = "overview_v2";
	export interface Base extends ClientIDAndAccessToken {
		/** The extension's client ID. If specified, the response contains a report for the specified extension. If not specified, the response includes a report for each extension that the authenticated user owns. */
		extension_id?: string;
		/**
		 * The type of analytics report to get. Possible values are:
		 * - `overview_v2`
		 */
		type?: Type;
		/**
		 * The reporting window's start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z).
		 * 
		 * The start date must be on or after January 31, 2018. If you specify an earlier date, the API ignores it and uses January 31, 2018. If you specify a start date, you must specify an end date. If you don't specify a start and end date, the report includes all available data since January 31, 2018.
		 * 
		 * The report contains one row of data for each day in the reporting window.
		 */
		started_at: undefined;
		/**
		 * The reporting window's end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-27T00:00:00Z). The report is inclusive of the end date.
		 * 
		 * Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that's earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
		 */
		ended_at: undefined;
		/**
		 * The maximum number of report URLs to return per page in the response. The minimum page size is 1 URL per page and the maximum is 100 URLs per page. The default is 20.
		 * 
		 * **NOTE**: While you may specify a maximum value of 100, the response will contain at most 20 URLs per page.
		 */
		first?: number;
		/**
		 * The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)
		 * 
		 * This parameter is ignored if the `extension_id` parameter is set.
		 */
		after?: string;
	}
	export interface WithDates extends Omit<Base, "started_at" | "ended_at"> {
		/**
		 * The reporting window's start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z).
		 * 
		 * The start date must be on or after January 31, 2018. If you specify an earlier date, the API ignores it and uses January 31, 2018. If you specify a start date, you must specify an end date. If you don't specify a start and end date, the report includes all available data since January 31, 2018.
		 * 
		 * The report contains one row of data for each day in the reporting window.
		 */
		started_at: string;
		/**
		 * The reporting window's end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-27T00:00:00Z). The report is inclusive of the end date.
		 * 
		 * Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that's earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
		 */
		ended_at: string;
	}
}

export type GetGameAnalytics = GetGameAnalytics.Base | GetGameAnalytics.WithDates;
export namespace GetGameAnalytics {
	export type Type = "overview_v2";
	export interface Base extends ClientIDAndAccessToken {
		/** The game’s client ID. If specified, the response contains a report for the specified game. If not specified, the response includes a report for each of the authenticated user’s games. */
		game_id?: string;
		/**
		 * The type of analytics report to get. Possible values are:
		 * - `overview_v2`
		 */
		type?: Type;
		/**
		 * The reporting window’s start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). If you specify a start date, you must specify an end date.

		 * The start date must be within one year of today’s date. If you specify an earlier date, the API ignores it and uses a date that’s one year prior to today’s date. If you don’t specify a start and end date, the report includes all available data for the last 365 days from today.

		 * The report contains one row of data for each day in the reporting window.
		 */
		started_at: undefined;
		/**
		 * The reporting window’s end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). The report is inclusive of the end date.

		 * Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that’s earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
		 */
		ended_at: undefined;
		/**
		 * The maximum number of report URLs to return per page in the response. The minimum page size is 1 URL per page and the maximum is 100 URLs per page. The default is 20.

		 * **NOTE**: While you may specify a maximum value of 100, the response will contain at most 20 URLs per page.
		 */
		first?: number;
		/**
		 * The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination)

		 * This parameter is ignored if the `game_id` parameter is set.
		 */
		after?: string;
	}
	export interface WithDates extends Omit<Base, "started_at" | "ended_at"> {
		/**
		 * The reporting window’s start date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). If you specify a start date, you must specify an end date.

		 * The start date must be within one year of today’s date. If you specify an earlier date, the API ignores it and uses a date that’s one year prior to today’s date. If you don’t specify a start and end date, the report includes all available data for the last 365 days from today.

		 * The report contains one row of data for each day in the reporting window.
		 */
		started_at: string;
		/**
		 * The reporting window’s end date, in RFC3339 format. Set the time portion to zeroes (for example, 2021-10-22T00:00:00Z). The report is inclusive of the end date.

		 * Specify an end date only if you provide a start date. Because it can take up to two days for the data to be available, you must specify an end date that’s earlier than today minus one to two days. If not, the API ignores your end date and uses an end date that is today minus one to two days.
		 */
		ended_at: string;
	}
}

export type GetBitsLeaderboard = GetBitsLeaderboard.Base | GetBitsLeaderboard.WithPeriod | GetBitsLeaderboard.WithPeriodAll;
export namespace GetBitsLeaderboard {
	export interface Base extends ClientIDAndAccessToken {
		/** The number of results to return. The minimum count is 1 and the maximum is 100. The default is 10. */
		count?: number;
		/**
		 * The time period over which data is aggregated (uses the PST time zone). Possible values are:
		 * - day — A day spans from 00:00:00 on the day specified in `started_at` and runs through 00:00:00 of the next day.
		 * - week — A week spans from 00:00:00 on the Monday of the week specified in `started_at` and runs through 00:00:00 of the next Monday.
		 * - month — A month spans from 00:00:00 on the first day of the month specified in `started_at` and runs through 00:00:00 of the first day of the next month.
		 * - year — A year spans from 00:00:00 on the first day of the year specified in `started_at` and runs through 00:00:00 of the first day of the next year.
		 * - all — Default. The lifetime of the broadcaster's channel.
		 */
		period: undefined;
		/**
		 * The start date, in RFC3339 format, used for determining the aggregation period. Specify this parameter only if you specify the `period` query parameter. The start date is ignored if period is `all`.

		* Note that the date is converted to PST before being used, so if you set the start time to `2022-01-01T00:00:00.0Z` and `period` to `month`, the actual reporting period is December 2021, not January 2022. If you want the reporting period to be January 2022, you must set the start time to `2022-01-01T08:00:00.0Z` or `2022-01-01T00:00:00.0-08:00`.

		* If your start date uses the `+` offset operator (for example, `2022-01-01T00:00:00.0+05:00`), you must URL encode the start date.
		*/
		started_at: undefined;
		/** An ID that identifies a user that cheered bits in the channel. If `count` is greater than 1, the response may include users ranked above and below the specified user. To get the leaderboard’s top leaders, don’t specify a user ID. */
		user_id?: string;
	}
	export interface WithPeriod extends Omit<Base, "period" | "started_at"> {
		/**
		 * The time period over which data is aggregated (uses the PST time zone). Possible values are:
		 * - day — A day spans from 00:00:00 on the day specified in `started_at` and runs through 00:00:00 of the next day.
		 * - week — A week spans from 00:00:00 on the Monday of the week specified in `started_at` and runs through 00:00:00 of the next Monday.
		 * - month — A month spans from 00:00:00 on the first day of the month specified in `started_at` and runs through 00:00:00 of the first day of the next month.
		 * - year — A year spans from 00:00:00 on the first day of the year specified in `started_at` and runs through 00:00:00 of the first day of the next year.
		 * - all — Default. The lifetime of the broadcaster's channel.
		 */
		period: "year" | "month" | "week" | "day";
		/**
		 * The start date, in RFC3339 format, used for determining the aggregation period. Specify this parameter only if you specify the `period` query parameter. The start date is ignored if period is `all`.

		* Note that the date is converted to PST before being used, so if you set the start time to `2022-01-01T00:00:00.0Z` and `period` to `month`, the actual reporting period is December 2021, not January 2022. If you want the reporting period to be January 2022, you must set the start time to `2022-01-01T08:00:00.0Z` or `2022-01-01T00:00:00.0-08:00`.

		* If your start date uses the `+` offset operator (for example, `2022-01-01T00:00:00.0+05:00`), you must URL encode the start date.
		*/
		started_at: string;
	}
	export interface WithPeriodAll extends Omit<Base, "period"> {
		/**
		 * The time period over which data is aggregated (uses the PST time zone). Possible values are:
		 * - day — A day spans from 00:00:00 on the day specified in `started_at` and runs through 00:00:00 of the next day.
		 * - week — A week spans from 00:00:00 on the Monday of the week specified in `started_at` and runs through 00:00:00 of the next Monday.
		 * - month — A month spans from 00:00:00 on the first day of the month specified in `started_at` and runs through 00:00:00 of the first day of the next month.
		 * - year — A year spans from 00:00:00 on the first day of the year specified in `started_at` and runs through 00:00:00 of the first day of the next year.
		 * - all — Default. The lifetime of the broadcaster's channel.
		 */
		period: "all";
	}
}

export interface GetCheermotes extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose custom Cheermotes you want to get. Specify the broadcaster’s ID if you want to include the broadcaster’s Cheermotes in the response (not all broadcasters upload Cheermotes). If not specified, the response contains only global Cheermotes. If the broadcaster uploaded Cheermotes, the `type` field in the response is set to `channel_custom`. */
	broadcaster_id?: string;
}

export interface GetCustomPowerups extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose custom Power-ups you want to get. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/**
	 * A list of IDs to filter the Power-ups by. You may specify a maximum of 50 IDs.

	 * Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
	 */
	id?: string | string[];
}

export interface GetExtensionTransactions extends ClientIDAndAccessToken {
	/** The ID of the extension whose list of transactions you want to get. */
	extension_id: string;
	/** A transaction ID used to filter the list of transactions. You may specify a maximum of 100 IDs. */
	id?: string | string[];
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export interface GetChannelInformation extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose channel you want to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that are not found. */
	broadcaster_id: string | string[];
}

/** You must specify at least one field in: game_id, broadcaster_language, title, delay, tags, content_classification_labels, is_branded_content. */
export interface ModifyChannelInformation extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose channel you want to update. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID of the game that the user plays. The game is not updated if the ID isn’t a game ID that Twitch recognizes. To unset this field, use “0” or “” (an empty string). */
	game_id?: string;
	/** The user’s preferred language. Set the value to an ISO 639-1 two-letter language code (for example, en for English). Set to “other” if the user’s preferred language is not a Twitch supported language. The language isn’t updated if the language code isn’t a Twitch supported language. */
	broadcaster_language?: string;
	/** The title of the user’s stream. Title must not exceed 140 character limit. You may not set this field to an empty string. */
	title?: string;
	/** The number of seconds you want your broadcast buffered before streaming it live. The delay helps ensure fairness during competitive play. Only users with Partner status may set this field. The maximum delay is 900 seconds (15 minutes). */
	delay?: number;
	/** A list of channel-defined tags to apply to the channel. To remove all tags from the channel, set tags to an empty array. Tags help identify the content that the channel streams. [Learn More](https://help.twitch.tv/s/article/guide-to-tags) A channel may specify a maximum of 10 tags. Each tag is limited to a maximum of 25 characters and may not be an empty string or contain spaces or special characters. */
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

export interface GetChannelEditors extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that owns the channel. This ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export interface GetFollowedChannels extends ClientIDAndAccessToken {
	/** A user’s ID. Returns the list of broadcasters that this user follows. This ID must match the user ID in the user OAuth token. */
	user_id: string;
	/** A broadcaster’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this broadcaster if the user follows them. If not specified, the response contains all broadcasters that the user follows. */
	broadcaster_id?: string;
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read more](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export interface GetChannelFollowers extends ClientIDAndAccessToken {
	/** The broadcaster’s ID. Returns the list of users that follow this broadcaster. */
	broadcaster_id: string;
	/**
	 * A user’s ID. Use this parameter to see whether the user follows this broadcaster. If specified, the response contains this user if they follow the broadcaster. If not specified, the response contains all users that follow the broadcaster.
	 * 
	 * Using this parameter requires both a user access token with the **moderator:read:followers** scope and the user ID in the access token match the `broadcaster_id` or be the user ID for a moderator of the specified broadcaster.
	 */
	user_id?: string;
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read more](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export interface CreateCustomReward extends ClientIDAndAccessToken {
	/** The ID of the broadcaster to add the custom reward to. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** The custom reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
	title: string;
	/** The cost of the reward, in Channel Points. The minimum is 1 point. */
	cost: number;
	/** The prompt shown to the viewer when they redeem the reward. Specify a prompt if `is_user_input_required` is **true**. The prompt is limited to a maximum of 200 characters. */
	prompt?: string;
	/** A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is **true**. */
	is_enabled?: boolean;
	/** The background color to use for the reward. Specify the color using Hex format (for example, #9147FF). */
	background_color?: string;
	/** A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the `prompt` field. The default is **false**. */
	is_user_input_required?: boolean;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the `max_per_stream` field). The default is **false**. */
	is_max_per_stream_enabled?: boolean;
	/** The maximum number of redemptions allowed per live stream. Applied only if `is_max_per_stream_enabled` is **true**. The minimum value is 1. */
	max_per_stream?: number;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see the `max_per_user_per_stream` field). The default is **false**. */
	is_max_per_user_per_stream_enabled?: boolean;
	/** The maximum number of redemptions allowed per user per stream. Applied only if `s_max_per_user_per_stream_enabled` is **true**. The minimum value is 1. */
	max_per_user_per_stream?: number;
	/** A Boolean value that determines whether to apply a cooldown period between redemptions (see the `global_cooldown_seconds` field for the duration of the cooldown period). The default is **false**. */
	is_global_cooldown_enabled?: boolean;
	/** The cooldown period, in seconds. Applied only if the `is_global_cooldown_enabled` field is **true**. The minimum value is 1; however, the minimum value is 60 for it to be shown in the Twitch UX. */
	global_cooldown_seconds?: number;
	/** A Boolean value that determines whether redemptions should be set to `FULFILLED` status immediately when a reward is redeemed. If **false**, status is set to `UNFULFILLED` and follows the normal request queue process. The default is **false**. */
	should_redemptions_skip_request_queue?: boolean;
}

export interface DeleteCustomReward extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that created the custom reward. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** The ID of the custom reward to delete. */
	id: string;
}

export interface GetCustomRewards extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose custom rewards you want to get. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/**
	 * A list of IDs to filter the rewards by. You may specify a maximum of 50 IDs.
	 * 
	 * Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found. */
	id?: string | string[];
	/** A Boolean value that determines whether the response contains only the custom rewards that the app may manage (the app is identified by the ID in the Client-Id header). Set to **true** to get only the custom rewards that the app may manage. The default is **false**. */
	only_manageable_rewards?: boolean;
}

/** The body of the request should contain only the fields you’re updating. */
export type GetCustomRewardRedemptions = GetCustomRewardRedemptions.Base | GetCustomRewardRedemptions.WithStatus | GetCustomRewardRedemptions.WithID;
export namespace GetCustomRewardRedemptions {
	export interface Base extends ClientIDAndAccessToken {
		/** The ID of the broadcaster that owns the custom reward. This ID must match the user ID found in the user OAuth token. */
		broadcaster_id: string;
		/** The ID that identifies the custom reward whose redemptions you want to get. */
		reward_id: string;
		/**
		 * The status of the redemptions to return. The possible case-sensitive values are:
		 * - CANCELED
		 * - FULFILLED
		 * - UNFULFILLED
		 * 
		 * **NOTE**: This field is required only if you don’t specify the `id` query parameter.
		 * 
		 * **NOTE**: Canceled and fulfilled redemptions are returned for only a few days after they’re canceled or fulfilled.
		 */
		status: undefined;
		/**
		 * A list of IDs to filter the redemptions by. You may specify a maximum of 50 IDs.

		* Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
		*/
		id: undefined;
		/**
		 * The order to sort redemptions by. The possible case-sensitive values are:
		 * - OLDEST
		 * - NEWEST
		 * 
		 * The default is OLDEST.
		 */
		sort?: string;
		/** The maximum number of redemptions to return per page in the response. The minimum page size is 1 redemption per page and the maximum is 50. The default is 20. */
		first?: number;
		/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read more](https://dev.twitch.tv/docs/api/guide#pagination) */
		after?: string;
	}
	export interface WithStatus extends Omit<Base, "status" | "id"> {
		/**
		 * The status of the redemptions to return. The possible case-sensitive values are:
		 * - CANCELED
		 * - FULFILLED
		 * - UNFULFILLED
		 * 
		 * **NOTE**: This field is required only if you don’t specify the `id` query parameter.
		 * 
		 * **NOTE**: Canceled and fulfilled redemptions are returned for only a few days after they’re canceled or fulfilled.
		 */
		status: "CANCELED" | "FULFILLED" | "UNFULFILLED";
		/**
		 * A list of IDs to filter the redemptions by. You may specify a maximum of 50 IDs.

		* Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
		*/
		id: undefined;
	}
	export interface WithID extends Omit<Base, "status" | "id"> {
		/**
		 * The status of the redemptions to return. The possible case-sensitive values are:
		 * - CANCELED
		 * - FULFILLED
		 * - UNFULFILLED
		 * 
		 * **NOTE**: This field is required only if you don’t specify the `id` query parameter.
		 * 
		 * **NOTE**: Canceled and fulfilled redemptions are returned for only a few days after they’re canceled or fulfilled.
		 */
		status: undefined;
		/**
		 * A list of IDs to filter the redemptions by. You may specify a maximum of 50 IDs.

		* Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
		*/
		id: string;
	}
}

export interface UpdateCustomReward extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that’s updating the reward. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** The ID of the reward to update. */
	id: string;
	/** The reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
	title?: string;
	/** The prompt shown to the viewer when they redeem the reward. Specify a prompt if  is . The prompt is limited to a maximum of 200 characters. (is_user_input_required, true) */
	prompt?: string;
	/** The cost of the reward, in channel points. The minimum is 1 point. */
	cost?: number;
	/** The background color to use for the reward. Specify the color using Hex format (for example, \\#00E5CB). */
	background_color?: string;
	/** A Boolean value that indicates whether the reward is enabled. Set to  to enable the reward. Viewers see only enabled rewards. (true) */
	is_enabled?: boolean;
	/** A Boolean value that determines whether users must enter information to redeem the reward. Set to  if user input is required. See the  field. (prompt, true) */
	is_user_input_required?: boolean;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the  field). Set to  to limit redemptions. (max_per_stream, true) */
	is_max_per_stream_enabled?: boolean;
	/** The maximum number of redemptions allowed per live stream. Applied only if  is . The minimum value is 1. (is_max_per_stream_enabled, true) */
	max_per_stream?: number;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see ). The minimum value is 1. Set to  to limit redemptions. (max_per_user_per_stream, true) */
	is_max_per_user_per_stream_enabled?: boolean;
	/** The maximum number of redemptions allowed per user per stream. Applied only if  is . (is_max_per_user_per_stream_enabled, true) */
	max_per_user_per_stream?: number;
	/** A Boolean value that determines whether to apply a cooldown period between redemptions. Set to  to apply a cooldown period. For the duration of the cooldown period, see . (global_cooldown_seconds, true) */
	is_global_cooldown_enabled?: boolean;
	/** The cooldown period, in seconds. Applied only if  is . The minimum value is 1; however, for it to be shown in the Twitch UX, the minimum value is 60. (is_global_cooldown_enabled, true) */
	global_cooldown_seconds?: number;
	/** A Boolean value that determines whether to pause the reward. Set to  to pause the reward. Viewers can’t redeem paused rewards.. (true) */
	is_paused?: boolean;
	/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If , status is set to UNFULFILLED and follows the normal request queue process. (false) */
	should_redemptions_skip_request_queue?: boolean;
}

export interface UpdateCustomRewardRedemptionStatus extends ClientIDAndAccessToken {
	/** A list of IDs that identify the redemptions to update. You may specify a maximum of 50 IDs. */
	id: string | string[];
	/** The ID of the broadcaster that’s updating the redemption. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
	/** The ID that identifies the reward that’s been redeemed. */
	reward_id: string;
	/** 
	 * The status to set the redemption to. Possible values are:
	 * - CANCELED
	 * - FULFILLED
	 * Setting the status to CANCELED refunds the user’s channel points.
	 */
	status: string;
}

export interface GetCharityCampaigns extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that’s currently running a charity campaign. This ID must match the user ID in the access token. */
	broadcaster_id: string;
}

export interface GetCharityCampaignDonations extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that’s currently running a charity campaign. This ID must match the user ID in the access token. */
	broadcaster_id: string;
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100. The default is 20. */
	first?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export interface GetChatters extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose list of chatters you want to get. */
	broadcaster_id: string;
	/** The ID of the broadcaster or one of the broadcaster’s moderators. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 1,000. The default is 100. */
	first?: string;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export interface GetChannelEmotes extends ClientIDAndAccessToken {
	/** An ID that identifies the broadcaster whose emotes you want to get. */
	broadcaster_id: string;
}

export interface GetEmoteSets extends ClientIDAndAccessToken {
	/** An ID that identifies the emote set to get. You may specify a maximum of 25 IDs. The response contains only the IDs that were found and ignores duplicate IDs. To get emote set IDs, use the {@link GetChannelEmotes | Get Channel Emotes API}. */
	emote_set_id: string;
}

export interface GetChannelChatBadges extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose chat badges you want to get. */
	broadcaster_id: string;
}

export interface GetChatSettings extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose chat settings you want to get. */
	broadcaster_id: string;
	/**
	 * The ID of the broadcaster or one of the broadcaster’s moderators.

	 * This field is required only if you want to include the `non_moderator_chat_delay` and `non_moderator_chat_delay_duration` settings in the response.

	 * If you specify this field, this ID must match the user ID in the user access token.
	 */
	moderator_id?: string;
}

export interface GetSharedChatSession extends ClientIDAndAccessToken {
	/** The User ID of the channel broadcaster. */
	broadcaster_id: string;
}

export interface GetUserEmotes extends ClientIDAndAccessToken {
	/** The ID of the user. This ID must match the user ID in the user access token. */
	user_id: string;
	/** The cursor used to get the next page of results. The Pagination object in the response contains the cursor’s value. */
	after?: string;
	/**
	 * The User ID of a broadcaster you wish to get follower emotes of. Using this query parameter will guarantee inclusion of the broadcaster’s follower emotes in the response body.
	 * 
	 * **Note**: If the user specified in `user_id` is subscribed to the broadcaster specified, their follower emotes will appear in the response body regardless if this query parameter is used.
	 */
	broadcaster_id?: string;
}

/**
 * Specify only fields that you want to update.
 * 
 * To set the `slow_mode_wait_time` or `follower_mode_duration` field to its default value, set the corresponding `slow_mode` or `follower_mode` field to **true** (and don’t include the `slow_mode_wait_time` or `follower_mode_duration` field).
 * 
 * To set the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field’s value, you must set the corresponding `slow_mode`, `follower_mode`, or `non_moderator_chat_delay` field to **true**.
 * 
 * To remove the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field’s value, set the corresponding `slow_mode`, `follower_mode`, or `non_moderator_chat_delay` field to **false** (and don’t include the `slow_mode_wait_time`, `follower_mode_duration`, or `non_moderator_chat_delay_duration` field).
 */
export interface UpdateChatSettings extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose chat settings you want to update. */
	broadcaster_id: string;
	/** The ID of a user that has permission to moderate the broadcaster’s chat room, or the broadcaster’s ID if they’re making the update. This ID must match the user ID in the user access token. */
	moderator_id: string;
	/** A Boolean value that determines whether chat messages must contain only emotes. Set to `true` if only emotes are allowed; otherwise, `false`. The default is `false`. */
	emote_mode?: boolean;
	/** A Boolean value that determines whether the broadcaster restricts the chat room to followers only. Set to `true` if the broadcaster restricts the chat room to followers only; otherwise, `false`. The default is `true`. To specify how long users must follow the broadcaster before being able to participate in the chat room, see the `follower_mode_duration` field. */
	follower_mode?: boolean;
	/** The length of time, in minutes, that users must follow the broadcaster before being able to participate in the chat room. Set only if `follower_mode` is `true`. Possible values are: 0 (no restriction) through 129600 (3 months). The default is 0. */
	follower_mode_duration?: number;
	/** A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message. Set to `true` if the broadcaster applies a delay; otherwise, `false`. The default is `false`. To specify the length of the delay, see the `non_moderator_chat_delay_duration` field. */
	non_moderator_chat_delay?: boolean;
	/**
	 * The amount of time, in seconds, that messages are delayed before appearing in chat. Set only if `non_moderator_chat_delay` is `true`. Possible values are:
	 * - `2` — 2 second delay (recommended)
	 * - `4` — 4 second delay
	 * - `6` — 6 second delay
	 */
	non_moderator_chat_delay_duration?: 2 | 4 | 6;
	/** A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Set to `true` if the broadcaster applies a wait period between messages; otherwise, `false`. The default is `false`. To specify the delay, see the `slow_mode_wait_time` field. */
	slow_mode?: boolean;
	/** The amount of time, in seconds, that users must wait between sending messages. Set only if `slow_mode` is `true`. Possible values are: from `3` (3 second delay) to `120` (2 minute delay). The default is 30 seconds. */
	slow_mode_wait_time?: number;
	/** A Boolean value that determines whether only users that subscribe to the broadcaster’s channel may talk in the chat room. Set to `true` if the broadcaster restricts the chat room to subscribers only; otherwise, `false`. The default is `false`. */
	subscriber_mode?: boolean;
	/** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room. Set to `true` if the broadcaster allows only unique messages; otherwise, `false`. The default is `false`. */
	unique_chat_mode?: boolean;
}

export interface SendChatAnnouncement extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that owns the chat room to send the announcement to. */
	broadcaster_id: string;
	/** The ID of a user who has permission to moderate the broadcaster’s chat room, or the broadcaster’s ID if they’re sending the announcement. */
	moderator_id: string;
}

export interface SendShoutout extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that’s sending the Shoutout. */
	from_broadcaster_id: string;
	/** The ID of the broadcaster that’s receiving the Shoutout. */
	to_broadcaster_id: string;
	/** The ID of the broadcaster or a user that is one of the broadcaster’s moderators. This ID must match the user ID in the access token. */
	moderator_id: string;
}

export interface SendChatMessage extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose chat room the message will be sent to. */
	broadcaster_id: string;
	/** The ID of the user sending the message. This ID must match the user ID in the user access token. */
	sender_id: string;
	/** The message to send. The message is limited to a maximum of 500 characters. Chat messages can also include emoticons. To include emoticons, use the name of the emote. The names are case sensitive. Don’t include colons around the name (e.g., :bleedPurple:). If Twitch recognizes the name, Twitch converts the name to the emote before writing the chat message to the chat room. */
	message: string;
	/** The ID of the chat message being replied to. */
	reply_parent_message_id?: string;
	/** 
	 * **NOTE**: This parameter can only be set when utilizing an App Access Token. It cannot be specified when a User Access Token is used, and will instead result in an HTTP 400 error.

	 * Determines if the chat message is sent only to the source channel (defined by `broadcaster_id`) during a shared chat session. This has no effect if the message is not sent during a shared chat session.

	 * If this parameter is not set, the default value when using an App Access Token is **false**. On May 19, 2025 the default value for this parameter will be updated to **true**, and chat messages sent using an App Access Token will only be shared with the source channel by default. If you prefer to send a chat message to both channels in a shared chat session, make sure this parameter is explicitly set to **false** in your API request before May 19.
	 */
	for_source_only?: boolean;
	/** If **true**, the message will be sent and immediately pinned. Default: **false**. Cannot be combined with `reply_parent_message_id` or `for_source_only`. When pin is **true**, additionally requires the **moderator:manage:chat_messages** scope and the sender must be the broadcaster or a moderator. Messages pinned via this endpoint are always pinned for 20 minutes. If the pin fails, the message is not sent. */
	pin?: boolean;
}

export interface GetPinnedChatMessage extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
}

export interface PinChatMessage extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
	/** The ID of the pinned message to update. */
	message_id: string;
	/** The new number of seconds the message should remain pinned, starting from now. Minimum: 30. Maximum: 1800. If not specified, the message will be pinned until the stream ends. */
	duration_seconds?: number;
}

export interface UpdatePinnedChatMessage extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
	/** The ID of the pinned message to update. */
	message_id: string;
	/** The new number of seconds the message should remain pinned, starting from now. Minimum: 30. Maximum: 1800. If not specified, the message will be pinned until the stream ends. */
	duration_seconds?: number;
}

export interface UnpinChatMessage extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that owns the chat room. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. */
	moderator_id: string;
	/** The ID of the message to unpin. */
	message_id: string;
}

export interface GetUserChatColor extends ClientIDAndAccessToken {
	/**
	 * The ID of the user whose username color you want to get. The maximum number of IDs that you may specify is 100.

	 * The API ignores duplicate IDs and IDs that weren’t found.
	 */
	user_id: string | string[];
}

export interface UpdateUserChatColor extends ClientIDAndAccessToken {
	/** The ID of the user whose chat color you want to update. This ID must match the user ID in the access token. */
	user_id: string;
	/**
	 * The color to use for the user's name in chat. All users may specify one of the following named color values:
	 * - blue
	 * - blue_violet
	 * - cadet_blue
	 * - chocolate
	 * - coral
	 * - dodger_blue
	 * - firebrick
	 * - golden_rod
	 * - green
	 * - hot_pink
	 * - orange_red
	 * - red
	 * - sea_green
	 * - spring_green
	 * - yellow_green
	 * 
	 * Turbo and Prime users may specify a named color or a Hex color code like #9146FF. If you use a Hex color code, remember to URL encode it.
	 */
	color: string;
}

export interface CreateClip extends ClientIDAndAccessToken {
	/** The ID of the broadcaster whose stream you want to create a clip from. */
	broadcaster_id: string;
	/** The title of the clip. */
	title?: string;
	/** The length of the clip in seconds. Possible values range from 5 to 60 inclusively with a precision of 0.1. The default is 30. */
	duration?: number;
}

export interface CreateClipFromVOD extends ClientIDAndAccessToken {
	/** The user ID of the editor for the channel you want to create a clip for. If using the broadcaster’s auth token, this is the same as `broadcaster_id`. This must match the `user_id` in the user access token. */
	editor_id: string;
	/** The user ID for the channel you want to create a clip for. */
	broadcaster_id: string;
	/** ID of the VOD the user wants to clip. */
	vod_id: string;
	/** The zero-based offset, in seconds, to where the clip should end in the video (VOD). See this endpoint’s description for more information on how to use this parameter. */
	vod_offset: number;
	/** The length of the clip, in seconds. Precision is 0.1. Defaults to 30. Min: 5 seconds, Max: 60 seconds. */
	duration?: number;
	/** The title of the clip. */
	title: string;
}

/** The `id`, `game_id`, and `broadcaster_id` query parameters are mutually exclusive. */
export type GetClips = GetClips.WithID | GetClips.WithGameID | GetClips.WithBroadcasterID;
export namespace GetClips {
	export interface Base extends ClientIDAndAccessToken {
		/** An ID that identifies the broadcaster whose video clips you want to get. Use this parameter to get clips that were captured from the broadcaster’s streams. */
		broadcaster_id: undefined;
		/** An ID that identifies the game whose clips you want to get. Use this parameter to get clips that were captured from streams that were playing this game. */
		game_id: undefined;
		/** An ID that identifies the clip to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that aren’t found. */
		id: undefined;
		/** The start date used to filter clips. The API returns only clips within the start and end date window. Specify the date and time in RFC3339 format. */
		started_at?: string;
		/** The end date used to filter clips. If not specified, the time window is the start date plus one week. Specify the date and time in RFC3339 format. */
		ended_at?: string;
		/** The maximum number of clips to return per page in the response. The minimum page size is 1 clip per page and the maximum is 100. The default is 20. */
		first?: number;
		/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		before?: string;
		/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
		after?: string;
		/** A Boolean value that determines whether the response includes featured clips. If **true**, returns only clips that are featured. If **false**, returns only clips that aren’t featured. All clips are returned if this parameter is not present. */
		is_featured?: boolean;
	}
	export interface WithID extends Omit<Base, "id"> {
		/** An ID that identifies the clip to get. You may specify a maximum of 100 IDs. The API ignores duplicate IDs and IDs that aren’t found. */
		id: string | string[];
	}
	export interface WithGameID extends Omit<Base, "game_id"> {
		/** An ID that identifies the game whose clips you want to get. Use this parameter to get clips that were captured from streams that were playing this game. */
		game_id: string;
	}
	export interface WithBroadcasterID extends Omit<Base, "broadcaster_id"> {
		/** An ID that identifies the broadcaster whose video clips you want to get. Use this parameter to get clips that were captured from the broadcaster’s streams. */
		broadcaster_id: string;
	}
}

export interface GetClipsDownload extends ClientIDAndAccessToken {
	/** The User ID of the editor for the channel you want to download a clip for. If using the broadcaster’s auth token, this is the same as `broadcaster_id`. This must match the `user_id` in the user access token. */
	editor_id: string;
	/** The ID of the broadcaster you want to download clips for. */
	broadcaster_id: string;
	/** The ID that identifies the clip you want to download. Maximum: 10 clips. */
	clip_id: string | string[];
}

export interface CreateConduit extends ClientIDAndAccessToken {
	/** The number of shards to create for this conduit. */
	shard_count: number;
}

export interface UpdateConduit extends ClientIDAndAccessToken {
	/** Conduit ID. */
	id: string;
	/** The new number of shards for this conduit. */
	shard_count: number;
}

export interface DeleteConduit extends ClientIDAndAccessToken {
	/** Conduit ID. */
	id: string;
}

export interface GetConduitShards extends ClientIDAndAccessToken {
	/** Conduit ID. */
	conduit_id: string;
	/** The shard status filter by. The subscriber receives events only for enabled shards. Possible values are:
	 * - `enabled` — The shard is enabled.
	 * - `webhook_callback_verification_pending` — The shard is pending verification of the specified callback URL.
	 * - `webhook_callback_verification_failed` — The specified callback URL failed verification.
	 * - `notification_failures_exceeded` — The notification delivery failure rate was too high.
	 * - `websocket_disconnected` — The client closed the connection.
	 * - `websocket_failed_ping_pong` — The client failed to respond to a ping message.
	 * - `websocket_received_inbound_traffic` — The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
	 * - `websocket_internal_error` — The Twitch WebSocket server experienced an unexpected error.
	 * - `websocket_network_timeout` — The Twitch WebSocket server timed out writing the message to the client.
	 * - `websocket_network_error` — The Twitch WebSocket server experienced a network error writing the message to the client.
	 * - `websocket_failed_to_reconnect` - The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
	 */
	status?:
	| "enabled"
	| "webhook_callback_verification_pending"
	| "webhook_callback_verification_failed"
	| "notification_failures_exceeded"
	| "websocket_disconnected"
	| "websocket_failed_ping_pong"
	| "websocket_received_inbound_traffic"
	| "websocket_internal_error"
	| "websocket_network_timeout"
	| "websocket_network_error"
	| "websocket_failed_to_reconnect";
	/** The cursor used to get the next page of results. The pagination object in the response contains the cursor’s value. */
	after?: string;
}

export interface UpdateConduitShards extends ClientIDAndAccessToken {
	/** Conduit ID. */
	conduit_id: string;
	/** List of shards to update. */
	shards: {
		/** Shard ID. */
		id: string;
		transport: EventSub.Transport.WebHook | EventSub.Transport.WebSocket;
	}[];
}

export interface GetContentClassificationLabels extends ClientIDAndAccessToken {
	/** Locale for the Content Classification Labels. Default: "en-US".
Supported locales: "bg-BG", "cs-CZ", "da-DK", "da-DK", "de-DE", "el-GR", "en-GB", "en-US", "es-ES", "es-MX", "fi-FI", "fr-FR", "hu-HU", "it-IT", "ja-JP", "ko-KR", "nl-NL", "no-NO", "pl-PL", "pt-BT", "pt-PT", "ro-RO", "ru-RU", "sk-SK", "sv-SE", "th-TH", "tr-TR", "vi-VN", "zh-CN", "zh-TW". */
	locale?:
	| "en-US"
	| "bg-BG"
	| "cs-CZ"
	| "da-DK"
	| "de-DE"
	| "el-GR"
	| "en-GB"
	| "es-ES"
	| "es-MX"
	| "fi-FI"
	| "fr-FR"
	| "hu-HU"
	| "it-IT"
	| "ja-JP"
	| "ko-KR"
	| "nl-NL"
	| "no-NO"
	| "pl-PL"
	| "pt-BT"
	| "pt-PT"
	| "ro-RO"
	| "ru-RU"
	| "sk-SK"
	| "sv-SE"
	| "th-TH"
	| "tr-TR"
	| "vi-VN"
	| "zh-CN"
	| "zh-TW";
}

export interface GetDropsEntitlements extends ClientIDAndAccessToken {
	/** An ID that identifies the entitlement to get. You may specify a maximum of 100 IDs. */
	id?: string | string[];
	/** An ID that identifies a user that was granted entitlements. */
	user_id?: string;
	/** An ID that identifies a game that offered entitlements. */
	game_id?: string;
	/** 
	 * The entitlement’s fulfillment status. Used to filter the list to only those with the specified status. Possible values are:
	 * - CLAIMED — The user claimed the benefit.
	 * - FULFILLED — The developer granted the benefit that the user claimed.
	 */
	fulfillment_status?: "CLAIMED" | "FULFILLED";
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** The maximum number of entitlements to return per page in the response. The minimum page size is 1 entitlement per page and the maximum is 1000. The default is 20. */
	first?: number;
}

export interface UpdateDropsEntitlements extends ClientIDAndAccessToken {
	/** A list of IDs that identify the entitlements to update. You may specify a maximum of 100 IDs. */
	entitlement_ids?: string[];
	/**
	 * The fulfillment status to set the entitlements to. Possible values are:
	 * - CLAIMED — The user claimed the benefit.
	 * - FULFILLED — The developer granted the benefit that the user claimed.
	 */
	fulfillment_status?: "CLAIMED" | "FULFILLED";
}

export interface GetExtensionConfigurationSegment {
	client_id: string;
	jwt_token: string;
	/** The ID of the broadcaster that installed the extension. This parameter is required if you set the `segment` parameter to broadcaster or developer. Do not specify this parameter if you set `segment` to global. */
	broadcaster_id?: string;
	/** The ID of the extension that contains the configuration segment you want to get. */
	extension_id: string;
	/** The type of configuration segment to get. Possible case-sensitive values are:
	 * - broadcaster
	 * - developer
	 * - global
	 * You may specify one or more segments. Ignores duplicate segments.
	 */
	segment: ("broadcaster" | "developer" | "global") | ("broadcaster" | "developer" | "global")[];
}

export interface SetExtensionConfigurationSegment {
	client_id: string;
	jwt_token: string;
	/** The ID of the extension to update. */
	extension_id: string;
	/** The configuration segment to update. Possible case-sensitive values are:
	 * - broadcaster
	 * - developer
	 * - global
	 */
	segment: "broadcaster" | "developer" | "global";
	/** The ID of the broadcaster that installed the extension. Include this field only if the `segment` is set to **developer** or **broadcaster**. */
	broadcaster_id?: string;
	/** The contents of the segment. This string may be a plain-text string or a string-encoded JSON object. */
	content?: string;
	/** The version number that identifies this definition of the segment’s data. If not specified, the latest definition is updated. */
	version?: string;
}

export interface SetExtensionRequiredConfiguration {
	client_id: string;
	jwt_token: string;
	/** The ID of the broadcaster that installed the extension on their channel. */
	broadcaster_id: string;
	/** The ID of the extension to update. */
	extension_id: string;
	/** The version of the extension to update. */
	extension_version: string;
	/** The required_configuration string to use with the extension. */
	required_configuration: string;
}

export interface SendExtensionPubSubMessage {
	client_id: string;
	jwt_token: string;
	/** 
	 * The target of the message. Possible values are:
	 * - broadcast
	 * - global
	 * - whisper-<user-id>
	 * If `is_global_broadcast` is **true**, you must set this field to **global**. The **broadcast** and **global** values are mutually exclusive; specify only one of them.
	 */
	target: string[];
	/** The ID of the broadcaster to send the message to. Don’t include this field if `is_global_broadcast` is set to **true**. */
	broadcaster_id?: string;
	/** A Boolean value that determines whether the message should be sent to all channels where your extension is active. Set to **true** if the message should be sent to all channels. The default is **false**. */
	is_global_broadcast?: boolean;
	/** The message to send. The message can be a plain-text string or a string-encoded JSON object. The message is limited to a maximum of 5 KB. */
	message: string;
}

export interface GetExtensionLiveChannels extends ClientIDAndAccessToken {
	/** The ID of the extension to get. Returns the list of broadcasters that are live and that have installed or activated this extension. */
	extension_id: string;
	/** The specific maximum number of items per page in the response. The actual number returned may be less than this limit. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** field in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
}

export interface GetExtensionSecrets {
	client_id: string;
	jwt_token: string;
	/** The ID of the extension whose shared secrets you want to get. */
	extension_id: string;
}

export interface CreateExtensionSecret {
	client_id: string;
	jwt_token: string;
	/** The ID of the extension to apply the shared secret to. */
	extension_id: string;
	/** The amount of time, in seconds, to delay activating the secret. The delay should provide enough time for instances of the extension to gracefully switch over to the new secret. The minimum delay is 300 seconds (5 minutes). The default is 300 seconds. */
	delay?: number;
}

export interface SendExtensionChatMessage {
	client_id: string;
	jwt_token: string;
	/** The ID of the broadcaster that has activated the extension. */
	broadcaster_id: string;
	/** The message. The message may contain a maximum of 280 characters. */
	text: string;
	/** The ID of the extension that’s sending the chat message. */
	extension_id: string;
	/** The extension’s version number. */
	extension_version: string;
}

export interface GetExtension {
	client_id: string;
	jwt_token: string;
	/** The ID of the extension to get. */
	extension_id: string;
	/** The version of the extension to get. If not specified, it returns the latest, released version. If you don’t have a released version, you must specify a version; otherwise, the list is empty. */
	extension_version?: string;
}

export interface GetReleasedExtension extends ClientIDAndAccessToken {
	/** The ID of the extension to get. */
	extension_id: string;
	/** The version of the extension to get. If not specified, it returns the latest version. */
	extension_version?: string;
}

export interface GetExtensionBitsProducts extends ClientIDAndAccessToken {
	/** A Boolean value that determines whether to include disabled or expired Bits products in the response. The default is **false**. */
	should_include_all?: boolean;
}

export interface UpdateExtensionBitsProduct extends ClientIDAndAccessToken {
	/** The product's SKU. The SKU must be unique within an extension. The product's SKU cannot be changed. The SKU may contain only alphanumeric characters, dashes (-), underscores (_), and periods (.) and is limited to a maximum of 255 characters. No spaces. */
	sku: string;
	/** An object that contains the product's cost information. */
	cost: {
		/** The product's price. */
		amount: number;
		/** 
		 * The type of currency. Possible values are:
		 * - bits — The minimum price is 1 and the maximum is 10000.
		 */
		type: "bits";
	};
	/** The product's name as displayed in the extension. The maximum length is 255 characters. */
	display_name: string;
	/** A Boolean value that indicates whether the product is in development. Set to **true** if the product is in development and not available for public use. The default is **false**. */
	in_development?: boolean;
	/** The date and time, in RFC3339 format, when the product expires. If not set, the product does not expire. To disable the product, set the expiration date to a date in the past. */
	expiration?: string;
	/** A Boolean value that determines whether Bits product purchase events are broadcast to all instances of the extension on a channel. The events are broadcast via the onTransactionComplete helper callback. The default is **false**. */
	is_broadcast?: boolean;
}

export interface CreateEventSubSubscription<_Subscription extends EventSub.Subscription> extends ClientIDAndAccessToken {
	/** The type of subscription to create. For a list of subscriptions that you can create, see [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). Set this field to the value in the **Name** column of the Subscription Types table. */
	type: _Subscription["type"];
	/** The version number that identifies the definition of the subscription type that you want the response to use. */
	version: _Subscription["version"];
	/** A JSON object that contains the parameter values that are specific to the specified subscription type. For the object’s required and optional fields, see the subscription type’s documentation. */
	condition: _Subscription["condition"];
	/** The transport details that you want Twitch to use when sending you notifications. */
	transport: _Subscription["transport"];
}

export interface DeleteEventSubSubscription extends ClientIDAndAccessToken {
	/** The ID of the subscription to delete. */
	id: string;
}

export type GetEventSubSubscriptions = GetEventSubSubscriptions.NoFilters | GetEventSubSubscriptions.ByStatus | GetEventSubSubscriptions.ByType | GetEventSubSubscriptions.ByUserID | GetEventSubSubscriptions.BySubscriptionID | GetEventSubSubscriptions.ByConduitID;
export namespace GetEventSubSubscriptions {
	export interface NoFilters extends ClientIDAndAccessToken {
		status: undefined;
		type: undefined;
		user_id: undefined;
		subscription_id: undefined;
		conduit_id: undefined;
		/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. */
		after?: string;
	}
	export interface ByStatus extends Omit<NoFilters, "status"> {
		/**
		 * Filter subscriptions by its status.
		 * Type|Description
		 * -|-
		 * `enabled`|The subscription is enabled.
		 * `webhook_callback_verification_pending`|The subscription is pending verification of the specified callback URL.
		 * `webhook_callback_verification_failed`|The specified callback URL failed verification.
		 * `notification_failures_exceeded`|The notification delivery failure rate was too high.
		 * `authorization_revoked`|The authorization was revoked for one or more users specified in the Condition object.
		 * `moderator_removed`|The moderator that authorized the subscription is no longer one of the broadcaster's moderators.
		 * `user_removed`|One of the users specified in the Condition object was removed.
		 * `version_removed`|The subscription to subscription type and version is no longer supported.
		 * `beta_maintenance`|The subscription to the beta subscription type was removed due to maintenance.
		 * `websocket_disconnected`|The client closed the connection.
		 * `websocket_failed_ping_pong`|The client failed to respond to a ping message.
		 * `websocket_received_inbound_traffic`|The client sent a non-pong message. Clients may only send pong messages (and only in response to a ping message).
		 * `websocket_connection_unused`|The client failed to subscribe to events within the required time.
		 * `websocket_internal_error`|The Twitch WebSocket server experienced an unexpected error.
		 * `websocket_network_timeout`|The Twitch WebSocket server timed out writing the message to the client.
		 * `websocket_network_error`|The Twitch WebSocket server experienced a network error writing the message to the client.
		 * `conduit_deleted`|The conduit associated with the subscription was deleted.
		 */
		status: EventSub.Subscription.Status;
	}
	export interface ByType extends Omit<NoFilters, "type"> {
		/** Filter subscriptions by subscription type. For a list of subscription types, see [Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#subscription-types). */
		type: string;
	}
	export interface ByUserID extends Omit<NoFilters, "user_id"> {
		/** Filter subscriptions by user ID. The response contains subscriptions where this ID matches a user ID that you specified in the **Condition** object when you [created the subscription](https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription). */
		user_id: string;
	}
	export interface BySubscriptionID extends Omit<NoFilters, "subscription_id"> {
		/** Returns an array with the subscription matching the ID (as long as it is owned by the client making the request), or an empty array if there is no matching subscription. */
		subscription_id: string;
	}
	export interface ByConduitID extends Omit<NoFilters, "conduit_id"> {
		/** Filter subscriptions by [conduit](https://dev.twitch.tv/docs/eventsub/handling-conduit-events) ID. */
		conduit_id: string;
	}
}

export interface GetTopGames extends ClientIDAndAccessToken {
	/** The maximum number of items to return per page in the response. The minimum page size is 1 item per page and the maximum is 100 items per page. The default is 20. */
	first?: number;
	/** The cursor used to get the next page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	after?: string;
	/** The cursor used to get the previous page of results. The **Pagination** object in the response contains the cursor’s value. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	before?: string;
}

export interface GetGames extends ClientIDAndAccessToken {
	/** The ID of the category or game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found. */
	id?: string | string[];
	/** The name of the category or game to get. The name must exactly match the category’s or game’s title. You may specify a maximum of 100 names. The endpoint ignores duplicate names and names that weren’t found. */
	name?: string | string[];
	/** The [IGDB](https://www.igdb.com/) ID of the game to get. You may specify a maximum of 100 IDs. The endpoint ignores duplicate and invalid IDs or IDs that weren’t found. */
	igdb_id?: string | string[];
}

export interface GetCreatorGoals extends ClientIDAndAccessToken {
	/** The ID of the broadcaster that created the goals. This ID must match the user ID in the user access token. */
	broadcaster_id: string;
}

export interface GetChannelGuestStarSettings extends ClientIDAndAccessToken {
	/** The ID of the broadcaster you want to get guest star settings for. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;
}

export interface UpdateChannelGuestStarSettings extends ClientIDAndAccessToken {
	/** The ID of the broadcaster you want to update Guest Star settings for. */
	broadcaster_id: string;
	/** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
	is_moderator_send_live_enabled?: boolean;
	/** Number of slots the Guest Star call interface will allow the host to add to a call. Required to be between 1 and 6. */
	slot_count?: number;
	/** Flag determining if Browser Sources subscribed to sessions on this channel should output audio */
	is_browser_source_audio_enabled?: boolean;
	/**
	 * This setting determines how the guests within a session should be laid out within the browser source. Can be one of the following values:
	 * Value|Description
	 * TILED_LAYOUT|All live guests are tiled within the browser source with the same size.
	 * SCREENSHARE_LAYOUT|All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests.
	 * HORIZONTAL_LAYOUT|All live guests are arranged in a horizontal bar within the browser source
	 * VERTICAL_LAYOUT|All live guests are arranged in a vertical bar within the browser source
	 */
	group_layout?: "TILED_LAYOUT" | "SCREENSHARE_LAYOUT" | "HORIZONTAL_LAYOUT" | "VERTICAL_LAYOUT";
	/** Flag determining if Guest Star should regenerate the auth token associated with the channel’s browser sources. Providing a true value for this will immediately invalidate all browser sources previously configured in your streaming software. */
	regenerate_browser_sources?: boolean;
}

export interface GetGuestStarSession extends ClientIDAndAccessToken {
	/** ID for the user hosting the Guest Star session. */
	broadcaster_id: string;
	/** The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token. */
	moderator_id: string;	
}