import { Authorization } from ".";
import * as RequestBody from "./requestbody";
import * as EventSub from "./eventsub";

export interface Base<OK extends boolean = true, Status extends number = 200> {
	/** The code status of request. */
	status: Status;
	/** The code status of request. */
	ok: OK;
}

export interface StartCommercial extends Base {
	/** An object with the status of your start commercial request. */
	data: {
		/** The length of the commercial you requested. If you request a commercial that’s longer than 180 seconds, the API uses 180 seconds. */
		length: number;
		/** A message that indicates whether Twitch was able to serve an ad. */
		message: string;
		/** The number of seconds you must wait before running another commercial. */
		retry_after: number;
	};
}

export interface GetAdSchedule extends Base {
	/** An object that contains information related to the channel’s ad schedule. */
	data: {
		/** The number of snoozes available for the broadcaster. */
		snooze_count: number;
		/** The UTC timestamp when the broadcaster will gain an additional snooze, in RFC3339 format. */
		snooze_refresh_at: string;
		/** The UTC timestamp of the broadcaster’s next scheduled ad, in RFC3339 format. Empty if the channel has no ad scheduled or is not live. */
		next_ad_at: string;
		/** The length in seconds of the scheduled upcoming ad break. */
		duration: number;
		/** The UTC timestamp of the broadcaster’s last ad-break, in RFC3339 format. Empty if the channel has not run an ad or is not live. */
		last_ad_at: string;
		/** The amount of pre-roll free time remaining for the channel in seconds. Returns 0 if they are currently not pre-roll free. */
		preroll_free_time: number;
	};
}

export interface SnoozeNextAd extends Base {
	/** A list that contains information about the channel’s snoozes and next upcoming ad after successfully snoozing. */
	data: {
		/** The number of snoozes available for the broadcaster. */
		snooze_count: number;
		/** The UTC timestamp when the broadcaster will gain an additional snooze, in RFC3339 format. */
		snooze_refresh_at: string;
		/** The UTC timestamp of the broadcaster’s next scheduled ad, in RFC3339 format. */
		next_ad_at: string;
	}[];
}

export interface GetExtensionAnalytics extends Base {
	/** A list of reports. The reports are returned in no particular order; however, the data within each report is in ascending order by date (newest first). The report contains one row of data per day of the reporting window; the report contains rows for only those days that the extension was used. The array is empty if there are no reports. */
	data: {
		/** An ID that identifies the extension that the report was generated for. */
		extension_id: string;
		/** The URL that you use to download the report. The URL is valid for 5 minutes. */
		URL: string;
		/** The type of report. */
		type: RequestBody.GetExtensionAnalytics.Type;
		/** The reporting window’s start and end dates, in RFC3339 format. */
		date_range: {
			/** The reporting window’s start date. */
			started_at: string;
			/** The reporting window’s end date. */
			ended_at: string;
		};
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor: string;
	}
}

export interface GetGameAnalytics extends Base {
	/** A list of reports. The reports are returned in no particular order; however, the data within each report is in ascending order by date (newest first). The report contains one row of data per day of the reporting window; the report contains rows for only those days that the game was used. A report is available only if the game was broadcast for at least 5 hours over the reporting period. The array is empty if there are no reports. */
	data: {
		/** An ID that identifies the game that the report was generated for. */
		game_id: string;
		/** The URL that you use to download the report. The URL is valid for 5 minutes. */
		URL: string;
		/** The type of report. */
		type: string;
		/** The reporting window’s start and end dates, in RFC3339 format. */
		date_range: {
			/** The reporting window’s start date. */
			started_at: string;
			/** The reporting window’s end date. */
			ended_at: string;
		};
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export interface GetBitsLeaderboard extends Base {
	/** A list of leaderboard leaders. The leaders are returned in rank order by how much they’ve cheered. The array is empty if nobody has cheered bits. */
	data: {
		/** An ID that identifies a user on the leaderboard. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s position on the leaderboard. */
		rank: number;
		/** The number of Bits the user has cheered. */
		score: number;
	}[];
	/** The reporting window’s start and end dates, in RFC3339 format. The dates are calculated by using the started_at and period query parameters. If you don’t specify the started_at query parameter, the fields contain empty strings. */
	date_range: {
		/** The reporting window’s start date. */
		started_at: string;
		/** The reporting window’s end date. */
		ended_at: string;
	};
	/** The number of ranked users in `data`. This is the value in the `count` query parameter or the total number of entries on the leaderboard, whichever is less. */
	total: number;
}

export interface GetCheermotes extends Base {
	/** The list of Cheermotes. The list is in ascending order by the `order` field’s value. */
	data: {
		/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. For example, if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
		prefix: string;
		/** A list of tier levels that the Cheermote supports. Each tier identifies the range of Bits that you can cheer at that tier level and an image that graphically identifies the tier level. */
		tiers: {
			/** The minimum number of Bits that you must cheer at this tier level. The maximum number of Bits that you can cheer at this level is determined by the required minimum Bits of the next tier level minus 1. For example, if `min_bits` is 1 and `min_bits` for the next tier is 100, the Bits range for this tier level is 1 through 99. The minimum Bits value of the last tier is the maximum number of Bits you can cheer using this Cheermote. For example, 10000. */
			min_bits: number;
			/** The tier level. */
			id: "1" | "100" | "500" | "1000" | "5000" | "10000" | "100000";
			/** The hex code of the color associated with this tier level (for example, #979797). */
			color: string;
			/** The animated and static image sets for the Cheermote. The dictionary of images is organized by theme, format, and size. The theme keys are `dark` and `light`. Each theme is a dictionary of formats: `animated` and `static`. Each format is a dictionary of sizes: 1, 1.5, 2, 3, and 4. The value of each size contains the URL to the image. */
			images: Record<"dark" | "light", Record<"animated" | "static", {
				"1": string;
				"1.5": string;
				"2": string;
				"3": string;
				"4": string;
			}>>;
			/** A Boolean value that determines whether users can cheer at this tier level. */
			can_cheer: boolean;
			/** A Boolean value that determines whether this tier level is shown in the Bits card. Is **true** if this tier level is shown in the Bits card. */
			show_in_bits_card: boolean;
		}[];
		/** The type of Cheermote. Possible values are:
		 * - `global_first_party` — A Twitch-defined Cheermote that is shown in the Bits card.
		 * - `global_third_party` — A Twitch-defined Cheermote that is not shown in the Bits card.
		 * - `channel_custom` — A broadcaster-defined Cheermote.
		 * - `display_only` — Do not use; for internal use only.
		 * - `sponsored` — A sponsor-defined Cheermote. When used, the sponsor adds additional Bits to the amount that the user cheered. For example, if the user cheered Terminator100, the broadcaster might receive 110 Bits, which includes the sponsor's 10 Bits contribution.
		 */
		type: "global_first_party" | "global_third_party" | "channel_custom" | "display_only" | "sponsored";
		/** The order that the Cheermotes are shown in the Bits card. The numbers may not be consecutive. For example, the numbers may jump from 1 to 7 to 13. The order numbers are unique within a Cheermote type (for example, global_first_party) but may not be unique amongst all Cheermotes in the response. */
		order: number;
		/** The date and time, in RFC3339 format, when this Cheermote was last updated. */
		last_updated: string;
		/** A Boolean value that indicates whether this Cheermote provides a charitable contribution match during charity campaigns. */
		is_charitable: boolean;
	}[];
}

export interface GetCustomPowerups extends Base {
	/** A list of custom Power-ups. The list is in ascending order by id. If the broadcaster hasn't created custom Power-ups, the list is empty. */
	data: {
		/** The ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The ID that uniquely identifies this custom Power-up. */
		id: string;
		/** The title of the custom Power-up. */
		title: string;
		/** The prompt shown to the viewer when they redeem the custom Power-up if user input is required (see the `is_user_input_required` field). */
		prompt: string;
		/** The amount of Bits for the custom Power-up. */
		bits: number;
		/** A set of custom images for the custom Power-up. This field is `null` if the broadcaster didn’t upload images. */
		image: {
			/** The URL to a small version of the image. */
			url_1x: string;
			/**	The URL to a medium version of the image. */
			url_2x: string;
			/** The URL to a large version of the image. */
			url_4x: string;
		} | null;
		/** A set of default images for the custom Power-up. */
		default_image: {
			/** The URL to a small version of the image. */
			url_1x: string;
			/**	The URL to a medium version of the image. */
			url_2x: string;
			/** The URL to a large version of the image. */
			url_4x: string;
		} | null;
		/** The background color to use for the custom Power-up. The color is in Hex format (for example, #00E5CB). */
		background_color: string;
		/** A Boolean value that determines whether the custom Power-up is enabled. Is `true` if enabled; otherwise, `false`. Disabled custom Power-ups aren’t shown to the user. */
		is_enabled: boolean;
		/** A Boolean value that determines whether the user must enter information when redeeming the custom Power-up. Is `true` if the user is prompted. */
		is_user_input_required: boolean;
		/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per live stream. */
		max_per_stream_setting: {
			/** A Boolean value that determines whether the custom Power-up applies a limit on the number of redemptions allowed per live stream. Is `true` if the custom Power-up applies a limit. */
			is_enabled: boolean;
			/** The maximum number of redemptions allowed per live stream. */
			max_per_stream: number;
		};
		/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per user per live stream. */
		max_per_user_per_stream_setting: {
			/** A Boolean value that determines whether the custom Power-up applies a limit on the number of redemptions allowed per user per live stream. Is `true` if the custom Power-up applies a limit. */
			is_enabled: boolean;
			/**The maximum number of redemptions allowed per user per live stream. */
			max_per_user_per_stream: number;
		};
		/** The settings used to determine whether to apply a cooldown period between redemptions and the length of the cooldown. */
		global_cooldown_setting: {
			/** A Boolean value that determines whether to apply a cooldown period. Is `true` if a cooldown period is enabled. */
			is_enabled: boolean;
			/** The cooldown period, in seconds. */
			global_cooldown_seconds: number;
		};
		/** A Boolean value that determines whether the custom Power-up is currently paused. Is `true` if the custom Power-up is paused. Viewers can’t redeem paused custom Power-ups. */
		is_paused: boolean;
		/** A Boolean value that determines whether the custom Power-up is currently in stock. Is `true` if the custom Power-up is in stock. Viewers can’t redeem out of stock custom Power-ups. */
		is_in_stock: boolean;
		/** The number of redemptions redeemed during the current live stream. The number counts against the `max_per_stream_setting` limit. This field is `null` if the broadcaster’s stream isn’t live or `max_per_stream_setting` isn’t enabled. */
		redemptions_redeemed_current_stream: number;
		/** The timestamp of when the cooldown period expires. Is `null` if the custom Power-up isn’t in a cooldown state. See the `global_cooldown_setting` field. */
		cooldown_expires_at: string;
	}[];
}

export interface GetExtensionTransactions<ExtensionID extends string> extends Base {
	/** The list of transactions. */
	data: {
		/** An ID that identifies the transaction. */
		id: string;
		/** The UTC date and time (in RFC3339 format) of the transaction. */
		timestamp: string;
		/** The ID of the broadcaster that owns the channel where the transaction occurred. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID of the user that purchased the digital product. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** The type of transaction. */
		product_type: "BITS_IN_EXTENSION";
		/** Contains details about the digital product. */
		product_data: {
			/** An ID that identifies the digital product. */
			sku: string;
			/** Set to `twitch.ext.<extensionID>`. */
			domain: `twitch.ext.${ExtensionID}`;
			/** Contains details about the digital product’s cost. */
			cost: {
				/** The amount exchanged for the digital product. */
				amount: number;
				/** The type of currency exchanged. */
				type: "bits";
			};
			/** A Boolean value that determines whether the product is in development. Is `true` if the digital product is in development and cannot be exchanged. */
			inDevelopment: boolean;
			/** The name of the digital product. */
			displayName: string;
			/** This field is always empty since you may purchase only unexpired products. */
			expiration: "";
			/** A Boolean value that determines whether the data was broadcast to all instances of the extension. Is `true` if the data was broadcast to all instances. */
			broadcast: boolean;
		};
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor: string;
	};
}

export interface GetChannelInformation extends Base {
	/** A list that contains information about the specified channels. The list is empty if the specified channels weren’t found. */
	data: {
		/** An ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s preferred language. The value is an ISO 639-1 two-letter language code (for example, `en` for English). The value is set to “other” if the language is not a Twitch supported language. */
		broadcaster_language: string;
		/** The name of the game that the broadcaster is playing or last played. The value is an empty string if the broadcaster has never played a game. */
		game_name: string;
		/** An ID that uniquely identifies the game that the broadcaster is playing or last played. The value is an empty string if the broadcaster has never played a game. */
		game_id: string;
		/** The title of the stream that the broadcaster is currently streaming or last streamed. The value is an empty string if the broadcaster has never streamed. */
		title: string;
		/**
		 * The value of the broadcaster’s stream delay setting, in seconds. This field’s value defaults to zero unless:
		 * 1. the request specifies a user access token
		 * 2. the ID in the `broadcaster_id` query parameter matches the user ID in the access token
		 * 3. the broadcaster has partner status and they set a non-zero stream delay value.
		 */
		delay: number;
		/** The tags applied to the channel. */
		tags: string[];
		/** The CCLs applied to the channel. */
		content_classification_labels: string[];
		/** Boolean flag indicating if the channel has branded content. */
		is_branded_content: boolean;
	}[];
}

export type ModifyChannelInformation = Base<true, 204>;

export interface GetChannelEditors extends Base {
	/** A list of users that are editors for the specified broadcaster. The list is empty if the broadcaster doesn’t have editors. */
	data: {
		/** An ID that uniquely identifies a user with editor permissions. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The date and time, in RFC3339 format, when the user became one of the broadcaster’s editors. */
		created_at: string;
	}[];
}

export interface GetFollowedChannels extends Base {
	/** The list of broadcasters that the user follows. The list is in descending order by `followed_at` (with the most recently followed broadcaster first). The list is empty if the user doesn’t follow anyone. */
	data: {
		/** An ID that uniquely identifies the broadcaster that this user is following. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The UTC timestamp when the user started following the broadcaster. */
		followed_at: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
	/** The total number of broadcasters that the user follows. As someone pages through the list, the number may change as the user follows or unfollows broadcasters. */
	total: number;
}

export interface GetChannelFollowers extends Base {
	/** The list of users that follow the specified broadcaster. The list is in descending order by `followed_at` (with the most recent follower first). The list is empty if nobody follows the broadcaster, the specified `user_id` isn’t in the follower list, the user access token is missing the `moderator:read:followers` scope, or the user isn’t the broadcaster or moderator for the channel. */
	data: {
		/** The UTC timestamp when the user started following the broadcaster. */
		followed_at: string;
		/** An ID that uniquely identifies the user that’s following the broadcaster. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
	/** The total number of users that follow this broadcaster. As someone pages through the list, the number of users may change as users follow or unfollow the broadcaster. */
	total: number;
}

export interface CreateCustomReward extends Base {
	/** A list that contains the single custom reward you created. */
	data: GetCustomRewards["data"][0];
}

export type DeleteCustomReward = Base<true, 204>;

export interface GetCustomRewards extends Base {
	/** A list of custom rewards. The list is in ascending order by `id`. If the broadcaster hasn't created custom rewards, the list is empty. */
	data: {
		/** The ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The ID that uniquely identifies this custom reward. */
		id: string;
		/** The title of the reward. */
		title: string;
		/** The prompt shown to the viewer when they redeem the reward if user input is required (see the `is_user_input_required` field). */
		prompt: string;
		/** The cost of the reward in Channel Points. */
		cost: number;
		/** A set of custom images for the reward. This field is `null` if the broadcaster didn't upload images. */
		image: GetCustomRewards["data"][0]["default_image"] | null;
		/** A set of default images for the reward. */
		default_image: {
			/** The URL to a small version of the image. */
			url_1x: string;
			/** The URL to a medium version of the image. */
			url_2x: string;
			/** The URL to a large version of the image. */
			url_4x: string;
		};
		/** The background color to use for the reward. The color is in Hex format (for example, #00E5CB). */
		background_color: string;
		/** A Boolean value that determines whether the reward is enabled. Is `true` if enabled; otherwise, `false`. Disabled rewards aren't shown to the user. */
		is_enabled: boolean;
		/** A Boolean value that determines whether the user must enter information when redeeming the reward. Is `true` if the user is prompted. */
		is_user_input_required: boolean;
		/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per live stream. */
		max_per_stream_setting: {
			/** A Boolean value that determines whether the reward applies a limit on the number of redemptions allowed per live stream. Is `true` if the reward applies a limit. */
			is_enabled: boolean;
			/** The maximum number of redemptions allowed per live stream. */
			max_per_stream: number;
		};
		/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per user per live stream. */
		max_per_user_per_stream_setting: {
			/** A Boolean value that determines whether the reward applies a limit on the number of redemptions allowed per user per live stream. Is `true` if the reward applies a limit. */
			is_enabled: boolean;
			/** The maximum number of redemptions allowed per user per live stream. */
			max_per_user_per_stream: number;
		};
		/** The settings used to determine whether to apply a cooldown period between redemptions and the length of the cooldown. */
		global_cooldown_setting: {
			/** A Boolean value that determines whether to apply a cooldown period. Is `true` if a cooldown period is enabled. */
			is_enabled: boolean;
			/** The cooldown period, in seconds. */
			global_cooldown_seconds: number;
		};
		/** A Boolean value that determines whether the reward is currently paused. Is `true` if the reward is paused. Viewers can't redeem paused rewards. */
		is_paused: boolean;
		/** A Boolean value that determines whether the reward is currently in stock. Is `true` if the reward is in stock. Viewers can't redeem out of stock rewards. */
		is_in_stock: boolean;
		/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If `false`, status is set to UNFULFILLED and follows the normal request queue process. */
		should_redemptions_skip_request_queue: boolean;
		/** The number of redemptions redeemed during the current live stream. The number counts against the `max_per_stream_setting` limit. This field is `null` if the broadcaster's stream isn't live or `max_per_stream_setting` isn't enabled. */
		redemptions_redeemed_current_stream: number | null;
		/** The timestamp of when the cooldown period expires. Is `null` if the reward isn't in a cooldown state. See the `global_cooldown_setting` field. */
		cooldown_expires_at: string | null;
	}[];
}

export interface GetCustomRewardRedemptions extends Base {
	/** The list of redemptions for the specified reward. The list is empty if there are no redemptions that match the redemption criteria. */
	data: {
		/** The ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The ID that uniquely identifies this redemption. */
		id: string;
		/** The user's login name. */
		user_login: string;
		/** The ID that uniquely identifies the user that redeemed the reward. */
		user_id: string;
		/** The user's display name. */
		user_name: string;
		/** The text the user entered at the prompt when they redeemed the reward; otherwise, an empty string if user input was not required. */
		user_input: string;
		/** The state of the redemption. Possible values are: `CANCELED`, `FULFILLED`, `UNFULFILLED` */
		status: 'CANCELED' | 'FULFILLED' | 'UNFULFILLED';
		/** The date and time of when the reward was redeemed, in RFC3339 format. */
		redeemed_at: string;
		/** The reward that the user redeemed. */
		reward: {
			/** The ID that uniquely identifies the redeemed reward. */
			id: string;
			/** The reward's title. */
			title: string;
			/** The prompt displayed to the viewer if user input is required. */
			prompt: string;
			/** The reward's cost, in Channel Points. */
			cost: number;
		};
	}[];
}

export interface UpdateCustomReward extends Base {
	/** The list contains the single reward that you updated. */
	data: GetCustomRewards["data"][0];
}

export interface UpdateCustomRewardRedemptionStatus extends Base {
	/** The list contains the single redemption that you updated. */
	data: GetCustomRewardRedemptions["data"][0];
}

export interface GetCharityCampaigns extends Base {
	/** A list that contains the charity campaign that the broadcaster is currently running. The list is empty if the broadcaster is not running a charity campaign; the campaign information is not available after the campaign ends. */
	data: {
		/** An ID that identifies the charity campaign. */
		id: string;
		/** An ID that identifies the broadcaster that's running the campaign. */
		broadcaster_id: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The charity's name. */
		charity_name: string;
		/** A description of the charity. */
		charity_description: string;
		/** A URL to an image of the charity's logo. The image's type is PNG and its size is 100px X 100px. */
		charity_logo: string;
		/** A URL to the charity's website. */
		charity_website: string;
		/** The current amount of donations that the campaign has received. */
		current_amount: {
			/** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, `value` is set to 550. */
			value: number;
			/** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate `value` from minor units to major units by using the formula: `value / 10^decimal_places` */
			decimal_places: number;
			/** The ISO-4217 three-letter currency code that identifies the type of currency in `value`. */
			currency: string;
		};
		/** The campaign's fundraising goal. This field is `null` if the broadcaster has not defined a fundraising goal. */
		target_amount: GetCharityCampaigns["data"][0]["current_amount"] | null;
	}[];
}

export interface GetCharityCampaignDonations extends Base {
	/** A list that contains the donations that users have made to the broadcaster's charity campaign. The list is empty if the broadcaster is not currently running a charity campaign; the donation information is not available after the campaign ends. */
	data: {
		/** An ID that identifies the donation. The ID is unique across campaigns. */
		id: string;
		/** An ID that identifies the charity campaign that the donation applies to. */
		campaign_id: string;
		/** An ID that identifies a user that donated money to the campaign. */
		user_id: string;
		/** The user's login name. */
		user_login: string;
		/** The user's display name. */
		user_name: string;
		/** An object that contains the amount of money that the user donated. */
		amount: GetCharityCampaigns["data"][0]["current_amount"];
	}[];
	/** An object that contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request's after query parameter. */
		cursor?: string;
	};
}

export interface GetChatters extends Base {
	/** The list of users that are connected to the broadcaster's chat room. The list is empty if no users are connected to the chat room. */
	data: {
		/** The ID of a user that's connected to the broadcaster's chat room. */
		user_id: string;
		/** The user's login name. */
		user_login: string;
		/** The user's display name. */
		user_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request's after query parameter. */
		cursor?: string;
	};
	/** The total number of users that are connected to the broadcaster's chat room. As you page through the list, the number of users may change as users join and leave the chat room. */
	total: number;
}

export interface GetChannelEmotes extends Base {
	/** The list of emotes that the specified broadcaster created. If the broadcaster hasn't created custom emotes, the list is empty. */
	data: {
		/** An ID that identifies this emote. */
		id: string;
		/** The name of the emote. This is the name that viewers type in the chat window to get the emote to appear. */
		name: string;
		/** The image URLs for the emote. These image URLs always provide a static, non-animated emote image with a light background. */
		images: {
			/** A URL to the small version (28px x 28px) of the emote. */
			url_1x: `https://static-cdn.jtvnw.net/emoticons/v2/${GetChannelEmotes["data"][0]["id"]}/static/light/1.0`;
			/** A URL to the medium version (56px x 56px) of the emote. */
			url_2x: `https://static-cdn.jtvnw.net/emoticons/v2/${GetChannelEmotes["data"][0]["id"]}/static/light/2.0`;
			/** A URL to the large version (112px x 112px) of the emote. */
			url_4x: `https://static-cdn.jtvnw.net/emoticons/v2/${GetChannelEmotes["data"][0]["id"]}/static/light/3.0`;
		};
		/** The subscriber tier at which the emote is unlocked. This field contains the tier information only if `emote_type` is set to `subscriptions`, otherwise, it's an empty string. */
		tier: string;
		/** The type of emote. */
		emote_type: 'bitstier' | 'follower' | 'subscriptions';
		/** An ID that identifies the emote set that the emote belongs to. */
		emote_set_id: string;
		/** The formats that the emote is available in. */
		format: Array<'static' | 'animated'>;
		/** The sizes that the emote is available in. */
		scale: Array<'1.0' | '2.0' | '3.0'>;
		/** The background themes that the emote is available in. */
		theme_mode: Array<'dark' | 'light'>;
	}[];
	/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
	template: `https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{format}}/{{theme_mode}}/{{scale}}`;
}

export interface GetGlobalEmotes extends Base {
	/** The list of global emotes. */
	data: Omit<GetChannelEmotes["data"][0], "tier" | "emote_type" | "emote_set_id">[];
	/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
	template: GetChannelEmotes["template"];
}

export interface GetEmoteSets extends Base {
	/** The list of emotes found in the specified emote sets. The list is empty if none of the IDs were found. The list is in the same order as the set IDs specified in the request. Each set contains one or more emoticons. */
	data: (Omit<GetChannelEmotes["data"][0], "tier"> & {
		/** The ID of the broadcaster who owns the emote. */
		owner_id: string;
	})[];
	/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
	template: GetChannelEmotes["template"];
}

export interface GetChannelChatBadges extends Base {
	/** The list of chat badges. The list is sorted in ascending order by `set_id`, and within a set, the list is sorted in ascending order by `id`. */
	data: {
		/** An ID that identifies this set of chat badges. For example, Bits or Subscriber. */
		set_id: string;
		/** The list of chat badges in this set. */
		versions: {
			/** An ID that identifies this version of the badge. The ID can be any value. For example, for Bits, the ID is the Bits tier level, but for World of Warcraft, it could be Alliance or Horde. */
			id: string;
			/** A URL to the small version (18px x 18px) of the badge. */
			image_url_1x: string;
			/** A URL to the medium version (36px x 36px) of the badge. */
			image_url_2x: string;
			/** A URL to the large version (72px x 72px) of the badge. */
			image_url_4x: string;
			/** The title of the badge. */
			title: string;
			/** The description of the badge. */
			description: string;
			/** The action to take when clicking on the badge. Set to `null` if no action is specified. */
			click_action: string | null;
			/** The URL to navigate to when clicking on the badge. Set to `null` if no URL is specified. */
			click_url: string | null;
		}[];
	}[];
}

export type GetGlobalChatBadges = GetChannelChatBadges;
export interface GetChatSettings extends Base {
	/** The list of chat settings. The list contains a single object with all the settings. */
	data: {
		/** The ID of the broadcaster specified in the request. */
		broadcaster_id: string;
		/** A Boolean value that determines whether chat messages must contain only emotes. Is `true` if chat messages may contain only emotes; otherwise, `false`. */
		emote_mode: boolean;
		/** A Boolean value that determines whether the broadcaster restricts the chat room to followers only. Is `true` if the broadcaster restricts the chat room to followers only; otherwise, `false`. */
		follower_mode: boolean;
		/** The length of time, in minutes, that users must follow the broadcaster before being able to participate in the chat room. Is `null` if `follower_mode` is `false`. */
		follower_mode_duration: number | null;
		/** The moderator's ID. The response includes this field only if the request specifies a user access token that includes the `moderator:read:chat_settings` scope. */
		moderator_id?: string;
		/** A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the chat room. Is `true` if the broadcaster applies a delay; otherwise, `false`. The response includes this field only if the request specifies a user access token that includes the `moderator:read:chat_settings` scope and owner of token is one of the broadcaster’s moderators. */
		non_moderator_chat_delay?: boolean | null;
		/** The amount of time, in seconds, that messages are delayed before appearing in chat. Is `null` if `non_moderator_chat_delay` is `false`. The response includes this field only if the request specifies a user access token that includes the `moderator:read:chat_settings` scope and owner of token is one of the broadcaster’s moderators. */
		non_moderator_chat_delay_duration?: number | null;
		/** A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages. Is `true` if the broadcaster applies a delay; otherwise, `false`. */
		slow_mode: boolean;
		/** The amount of time, in seconds, that users must wait between sending messages. Is `null` if `slow_mode` is `false`. */
		slow_mode_wait_time: number | null;
		/** A Boolean value that determines whether only users that subscribe to the broadcaster's channel may talk in the chat room. Is `true` if the broadcaster restricts the chat room to subscribers only; otherwise, `false`. */
		subscriber_mode: boolean;
		/** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room. Is `true` if the broadcaster requires unique messages only; otherwise, `false`. */
		unique_chat_mode: boolean;
	};
}

export interface GetSharedChatSession extends Base {
	/** The object of shared chat session. Is **undefined**, if the channel doesn't have active session. */
	data?: {
		/** The unique identifier for the shared chat session. */
		session_id: string;
		/** The User ID of the host channel. */
		host_broadcaster_id: string;
		/** The list of participants in the session. */
		participants: {
			/** The User ID of the participant channel. */
			broadcaster_id: string;
		}[];
		/** The UTC date and time (in RFC3339 format) for when the session was created. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) for when the session was last updated. */
		updated_at: string;
	};
}

export interface GetUserEmotes extends Base {
	data: (Omit<GetEmoteSets["data"][0], "images" | "emote_type"> & {
		/**
		 * The type of emote. The possible values are:
		 * - `none` — No emote type was assigned to this emote.
		 * - `bitstier` — A Bits tier emote.
		 * - `follower` — A follower emote.
		 * - `subscriptions` — A subscriber emote.
		 * - `channelpoints` — An emote granted by using channel points.
		 * - `rewards` — An emote granted to the user through a special event.
		 * - `hypetrain` — An emote granted for participation in a Hype Train.
		 * - `prime` — An emote granted for linking an Amazon Prime account.
		 * - `turbo` — An emote granted for having Twitch Turbo.
		 * - `smilies` — Emoticons supported by Twitch.
		 * - `globals` — An emote accessible by everyone.
		 * - `owl2019` — Emotes related to Overwatch League 2019.
		 * - `twofactor` — Emotes granted by enabling two-factor authentication on an account.
		 * - `limitedtime` — Emotes that were granted for only a limited time.
		 */
		emote_type: 'none' | 'bitstier' | 'follower' | 'subscriptions' | 'channelpoints' | 
			'rewards' | 'hypetrain' | 'prime' | 'turbo' | 'smilies' | 'globals' | 
			'owl2019' | 'twofactor' | 'limitedtime';
	})[];
	/** A templated URL. Use the values from the `id`, `format`, `scale`, and `theme_mode` fields to replace the like-named placeholder strings in the templated URL to create a CDN URL that you use to fetch the emote. */
	template: GetChannelEmotes["template"];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. For more information about pagination support, see [Twitch API Guide - Pagination](https://dev.twitch.tv/docs/api/guide#pagination). */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}

export type UpdateChatSettings = GetChatSettings;

export type SendChatAnnouncement = Base<true, 204>;

export type SendShoutout = Base<true, 204>;

export interface SendChatMessage extends Base {
	data: {
		/** The message id for the message that was sent. */
		message_id: string;
		/** If the message passed all checks and was sent. */
		is_sent: boolean;
		/** The reason the message was dropped, if any. */
		drop_reason?: {
			/** Code for why the message was dropped. */
			code: string;
			/** Message for why the message was dropped. */
			message: string;
		};
	};
}

export interface GetPinnedChatMessage extends Base {
	/** Pinned messages. Empty if none pinned. */
	data: {
		/** The ID of the pinned chat message. */
		message_id: string;
		/** The ID of the broadcaster. */
		broadcaster_id: string;
		/** The ID of the user who sent the pinned message. */
		sender_user_id: string;
		/** The login of the user who sent the pinned message. */
		sender_user_login: string;
		/** The display name of the user who sent the pinned message. */
		sender_user_name: string;
		/** The ID of the user who pinned the message. */
		pinned_by_user_id: string;
		/** The login of the user who pinned the message. */
		pinned_by_user_login: string;
		/** The display name of the user who pinned the message. */
		pinned_by_user_name: string;
		/** The pinned message content. */
		message: {
			/** Plain text of the message. */
			text: string;
			/** Ordered list of message fragments. */
			fragments: EventSub.Payload.ChannelChat.MessageFragment.Text | EventSub.Payload.ChannelChat.MessageFragment.Emote | EventSub.Payload.ChannelChat.MessageFragment.Cheermote | EventSub.Payload.ChannelChat.MessageFragment.Mention[];
		};
		/** RFC3339 timestamp of when the message was pinned. */
		starts_at: string;
		/** RFC3339 expiry timestamp. Is `null` if pinned until stream ends. */
		ends_at: string | null;
		/** RFC3339 timestamp of last update. */
		updated_at: string;
	}[];
}

export type PinChatMessage = Base<true, 204>;

export type UpdatePinnedChatMessage = Base<true, 204>;

export type UnpinChatMessage = Base<true, 204>;

export interface GetUserChatColor extends Base {
	/** The list of users and the color code they use for their name. */
	data: {
		/** An ID that uniquely identifies the user. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** The Hex color code that the user uses in chat for their name. If the user hasn’t specified a color in their settings, the string is empty. */
		color: string;
	}[];
}

export type UpdateUserChatColor = Base<true, 204>;

export interface CreateClip extends Base {
	/** An object containing the created clip. */
	data: {
		/** A URL that you can use to edit the clip’s title, identify the part of the clip to publish, and publish the clip The URL is valid for up to 24 hours or until the clip is published, whichever comes first. [Learn More](https://help.twitch.tv/s/article/how-to-use-clips) */
		edit_url: string;
		/** An ID that uniquely identifies the clip. */
		id: string;
	};
}

export interface CreateClipFromVOD extends Base {
	/** An object containing the created clip. */
	data: {
		/** An ID that uniquely identifies the clip. */
		id: string;
		/** A URL you can use to edit the clip’s title, feature the clip, create a portrait version of the clip, download the clip media, and share the clip directly to third-party platforms. */
		edit_url: string;
	};
}

export interface GetClips extends Base {
	/** The list of video clips. For clips returned by game_id or broadcaster_id, the list is in descending order by view count. For lists returned by id, the list is in the same order as the input IDs. */
	data: {
		/** An ID that uniquely identifies the clip. */
		id: string;
		/** A URL to the clip. */
		url: string;
		/** A URL that you can use in an iframe to embed the clip (see [Embedding Video and Clips](https://dev.twitch.tv/docs/embed/video-and-clips)). */
		embed_url: string;
		/** An ID that identifies the broadcaster that the video was clipped from. */
		broadcaster_id: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** An ID that identifies the user that created the clip. */
		creator_id: string;
		/** The user's display name. */
		creator_name: string;
		/** An ID that identifies the video that the clip came from. This field contains an empty string if the video is not available. */
		video_id: string;
		/** The ID of the game that was being played when the clip was created. */
		game_id: string;
		/** The ISO 639-1 two-letter language code that the broadcaster broadcasts in. For example, en for English. The value is other if the broadcaster uses a language that Twitch doesn't support. */
		language: string;
		/** The title of the clip. */
		title: string;
		/** The number of times the clip has been viewed. */
		view_count: number;
		/** The date and time of when the clip was created. The date and time is in RFC3339 format. */
		created_at: string;
		/** A URL to a thumbnail image of the clip. */
		thumbnail_url: string;
		/** The length of the clip, in seconds. Precision is 0.1. */
		duration: number;
		/** The zero-based offset, in seconds, to where the clip starts in the video (VOD). Is `null` if the video is not available or hasn't been created yet from the live stream (see `video_id`). Note that there's a delay between when a clip is created during a broadcast and when the offset is set. During the delay period, `vod_offset` is `null`. The delay is indeterminant but is typically minutes long. */
		vod_offset: number | null;
		/** A Boolean value that indicates if the clip is featured or not. */
		is_featured: boolean;
	}[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request's after or before query parameter to this value depending on whether you're paging forwards or backwards. */
		cursor?: string;
	};
}

export interface GetClipsDownload extends Base {
	/** List of clips and their download URLs. */
	data: {
		/** An ID that uniquely identifies the clip. */
		clip_id: string;
		/** The landscape URL to download the clip. This field is `null` if the URL is not available. */
		landscape_download_url: string | null;
		/** The portrait URL to download the clip. This field is `null` if the URL is not available. */
		portrait_download_url: string | null;
	}[];
}

export interface GetConduits extends Base {
	/** List of information about the client’s conduits. */
	data: {
		/** Conduit ID. */
		id: string;
		/** Number of shards associated with this conduit. */
		shard_count: number;
	}[];
}

export interface CreateConduit extends Base {
	/** Information about the created conduit. */
	data: GetConduits["data"][0];
}

export interface UpdateConduit extends Base {
	/** Updated information about the conduit. */
	data: GetConduits["data"][0];
}

export type DeleteConduit = Base<true, 204>;

export interface GetConduitShards extends Base {
	/** List of information about a conduit's shards. */
	data: {
		/** Shard ID. */
		id: string;
		/** The shard status. The subscriber receives events only for enabled shards. Possible values are:
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
		status: 
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
		/** The transport details used to send the notifications. */
		transport: EventSub.Transport.WebHook | EventSub.Transport.WebSocket.ConnectedAndDisconnected;
	}[];
	/** Contains information used to page through a list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}

export interface UpdateConduitShards extends Base<true, 202> {
	/** List of successful shard updates. */
	data: GetConduitShards["data"];
	/** List of unsuccessful updates. */
	errors: {
		/** Shard ID. */
		id: string;
		/** The error that occurred while updating the shard. Possible errors:
		 * - `The length of the string in the secret field is not valid`
		 * - `The URL in the transport's callback field is not valid. The URL must use the HTTPS protocol and the 443 port number`
		 * - `The value specified in the method field is not valid`
		 * - `The callback field is required if you specify the webhook transport method`
		 * - `The session_id field is required if you specify the WebSocket transport method`
		 * - `The websocket session is not connected`
		 * - `The shard id is outside of the conduit’s range`
		*/
		message: string;
		/** Error codes used to represent a specific error condition while attempting to update shards. */
		code: string;
	}[];
}

export interface GetContentClassificationLabels extends Base {
	/** A list that contains information about the available content classification labels. */
	data: {
		/** Unique identifier for the CCL. */
		id: string;
		/** Localized description of the CCL. */
		description: string;
		/** Localized name of the CCL. */
		name: string;
	}[];
}

export interface GetDropsEntitlements extends Base {
	/** The list of entitlements. */
	data: {
		/** An ID that identifies the entitlement. */
		id: string;
		/** An ID that identifies the benefit (reward). */
		benefit_id: string;
		/** The UTC date and time (in RFC3339 format) of when the entitlement was granted. */
		timestamp: string;
		/** An ID that identifies the user who was granted the entitlement. */
		user_id: string;
		/** An ID that identifies the game the user was playing when the reward was entitled. */
		game_id: string;
		/**
		 * The entitlement’s fulfillment status. Possible values are:
		 * - CLAIMED — The user claimed the benefit.
		 * - FULFILLED — The developer granted the benefit that the user claimed.
		 */
		fulfillment_status: "CLAIMED" | "FULFILLED";
		/** The UTC date and time (in RFC3339 format) of when the entitlement was last updated. */
		last_updated: string;
	}[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}

export interface UpdateDropsEntitlements extends Base {
	/** A list that indicates which entitlements were successfully updated and those that weren’t. */
	data: {
		/**
		 * A string that indicates whether the status of the entitlements in the ids field were successfully updated. Possible values are:
		 * - INVALID_ID — The entitlement IDs in the ids field are not valid.
		 * - NOT_FOUND — The entitlement IDs in the ids field were not found.
		 * - SUCCESS — The status of the entitlements in the ids field were successfully updated.
		 * - UNAUTHORIZED — The user or organization identified by the user access token is not authorized to update the entitlements.
		 * - UPDATE_FAILED — The update failed. These are considered transient errors and the request should be retried later.
		 */
		status: "INVALID_ID" | "NOT_FOUND" | "SUCCESS" | "UNAUTHORIZED" | "UPDATE_FAILED";
		/** The list of entitlements that the status in the `status` field applies to. */
		ids: string[];
	}[];
}

export interface GetExtensionConfigurationSegment extends Base {
	/** The list of requested configuration segments. The list is returned in the same order that you specified the list of segments in the request. */
	data: {
		/** The type of segment. Possible values are:
		 * - broadcaster
		 * - developer
		 * - global
		 */
		segment: "broadcaster" | "developer" | "global";
		/** The ID of the broadcaster that installed the extension. The object includes this field only if the `segment` query parameter is set to developer or broadcaster. */
		broadcaster_id?: string;
		/** The contents of the segment. This string may be a plain-text string or a string-encoded JSON object. */
		content: string;
		/** The version number that identifies this definition of the segment’s data. */
		version: string;
	}[];
}

export type SetExtensionConfigurationSegment = Base<true, 204>;

export type SetExtensionRequiredConfiguration = Base<true, 204>;

export type SendExtensionPubSubMessage = Base<true, 204>;

export interface GetExtensionLiveChannels extends Base {
	/** The list of broadcasters that are streaming live and that have installed or activated the extension. */
	data: {
		/** The ID of the broadcaster that is streaming live and has installed or activated the extension. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The name of the category or game being streamed. */
		game_name: string;
		/** The ID of the category or game being streamed. */
		game_id: string;
		/** The title of the broadcaster’s stream. May be an empty string if not specified. */
		title: string;
	}[];
	/** This field contains the cursor used to page through the results. The field is empty if there are no more pages left to page through. Note that this field is a string compared to other endpoints that use a **Pagination** object. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: string;
}

export interface GetExtensionSecrets extends Base {
	/** The list of shared secrets that the extension created. */
	data: {
		/** The version number that identifies this definition of the secret’s data. */
		format_version: number;
		secrets: {
			/** The raw secret that you use with JWT encoding. */
			content: string;
			/** The UTC date and time (in RFC3339 format) that you may begin using this secret to sign a JWT. */
			active_at: string;
			/** The UTC date and time (in RFC3339 format) that you must stop using this secret to decode a JWT. */
			expires_at: string;
		}[];
	}[];
}

export interface CreateExtensionSecret extends Base {
	/** A list that contains the newly added secrets. */
	data: {
		/** The version number that identifies this definition of the secret’s data. */
		format_version: number;
		secrets: {
			/** The raw secret that you use with JWT encoding. */
			content: string;
			/** The UTC date and time (in RFC3339 format) that you may begin using this secret to sign a JWT. */
			active_at: string;
			/** The UTC date and time (in RFC3339 format) that you must stop using this secret to decode a JWT. */
			expires_at: string;
		}[];
	}[];
}

export type SendExtensionChatMessage = Base<true, 204>;

export interface GetExtension extends Base {
	/** An object that contains the specified extension. */
	data: {
		/** The name of the user or organization that owns the extension. */
		author_name: string;
		/** A Boolean value that determines whether the extension has features that use Bits. Is **true** if the extension has features that use Bits. */
		bits_enabled: boolean;
		/**
		 * A Boolean value that determines whether a user can install the extension on their channel. Is **true** if a user can install the extension.
		 * 
		 * Typically, this is set to **false** if the extension is currently in testing mode and requires users to be allowlisted (the allowlist is configured on Twitch’s [developer site](https://dev.twitch.tv/console/extensions) under the **Extensions** -> **Extension** -> **Version** -> **Access**).
		 */
		can_install: boolean;
		/** The location of where the extension’s configuration is stored. Possible values are:
		 * - hosted — The Extensions Configuration Service hosts the configuration.
		 * - custom — The Extension Backend Service (EBS) hosts the configuration.
		 * - none — The extension doesn't require configuration.
		 */
		configuration_location: "hosted" | "custom" | "none";
		/** A longer description of the extension. It appears on the details page. */
		description: string;
		/** A URL to the extension’s Terms of Service. */
		eula_tos_url: string;
		/** A Boolean value that determines whether the extension can communicate with the installed channel’s chat. Is **true** if the extension can communicate with the channel’s chat room. */
		has_chat_support: boolean;
		/** A URL to the default icon that’s displayed in the Extensions directory. */
		icon_url: string;
		/** A dictionary that contains URLs to different sizes of the default icon. The dictionary’s key identifies the icon’s size (for example, 24x24), and the dictionary’s value contains the URL to the icon. */
		icon_urls: Record<string, string>;
		/** The extension’s ID. */
		id: string;
		/** The extension’s name. */
		name: string;
		/** A URL to the extension’s privacy policy. */
		privacy_policy_url: string;
		/** A Boolean value that determines whether the extension wants to explicitly ask viewers to link their Twitch identity. */
		request_identity_link: boolean;
		/** A list of URLs to screenshots that are shown in the Extensions marketplace. */
		screenshot_urls: string[];
		/** The extension’s state. Possible values are:
		 * - Approved
		 * - AssetsUploaded
		 * - Deleted
		 * - Deprecated
		 * - InReview
		 * - InTest
		 * - PendingAction
		 * - Rejected
		 * - Released
		 */
		state: "Approved" | "AssetsUploaded" | "Deleted" | "Deprecated" | "InReview" | "InTest" | "PendingAction" | "Rejected" | "Released";
		/** Indicates whether the extension can view the user’s subscription level on the channel that the extension is installed on. Possible values are:
		 * - none — The extension can't view the user’s subscription level.
		 * - optional — The extension can view the user’s subscription level.
		 */
		subscriptions_support_level: "none" | "optional";
		/** A short description of the extension that streamers see when hovering over the discovery splash screen in the Extensions manager. */
		summary: string;
		/** The email address that users use to get support for the extension. */
		support_email: string;
		/** The extension’s version number. */
		version: string;
		/** A brief description displayed on the channel to explain how the extension works. */
		viewer_summary: string;
		/** Describes all views-related information such as how the extension is displayed on mobile devices. */
		views: {
			/** Describes how the extension is displayed on mobile devices. */
			mobile: {
				/** The HTML file that is shown to viewers on mobile devices. This page is presented to viewers as a panel behind the chat area of the mobile app. */
				viewer_url: string;
			};
			/** Describes how the extension is rendered if the extension may be activated as a panel extension. */
			panel: {
				/** The HTML file that is shown to viewers on the channel page when the extension is activated in a Panel slot. */
				viewer_url: string;
				/** The height, in pixels, of the panel component that the extension is rendered in. */
				height: number;
				/** A Boolean value that determines whether the extension can link to non-Twitch domains. */
				can_link_external_content: boolean;
			};
			/** Describes how the extension is rendered if the extension may be activated as a video-overlay extension. */
			video_overlay: {
				/** The HTML file that is shown to viewers on the channel page when the extension is activated on the Video - Overlay slot. */
				viewer_url: string;
				/** A Boolean value that determines whether the extension can link to non-Twitch domains. */
				can_link_external_content: boolean;
			};
			/** Describes how the extension is rendered if the extension may be activated as a video-component extension. */
			component: {
				/** The HTML file that is shown to viewers on the channel page when the extension is activated in a Video - Component slot. */
				viewer_url: string;
				/** The width value of the ratio (width : height) which determines the extension’s width, and how the extension’s iframe will resize in different video player environments. */
				aspect_ratio_x: number;
				/** The height value of the ratio (width : height) which determines the extension’s height, and how the extension’s iframe will resize in different video player environments. */
				aspect_ratio_y: number;
				/** A Boolean value that determines whether to apply CSS zoom. If **true**, a CSS zoom is applied such that the size of the extension is variable but the inner dimensions are fixed based on Scale Pixels. This allows your extension to render as if it is of fixed width and height. If **false**, the inner dimensions of the extension iframe are variable, meaning your extension must implement responsiveness. */
				autoscale: boolean;
				/** The base width, in pixels, of the extension to use when scaling (see `autoscale`). This value is ignored if `autoscale` is **false**. */
				scale_pixels: number;
				/** The height as a percent of the maximum height of a video component extension. Values are between 1% - 100%. */
				target_height: number;
				/** A Boolean value that determines whether the extension can link to non-Twitch domains. */
				can_link_external_content: boolean;
			};
			/** Describes the view that is shown to broadcasters while they are configuring your extension within the Extension Manager. */
			config: {
				/** The HTML file shown to broadcasters while they are configuring your extension within the Extension Manager. */
				viewer_url: string;
				/** A Boolean value that determines whether the extension can link to non-Twitch domains. */
				can_link_external_content: boolean;
			};
		};
		/** Allowlisted configuration URLs for displaying the extension (the allowlist is configured on Twitch’s [developer site](https://dev.twitch.tv/console/extensions) under the **Extensions** -> **Extension** -> **Version** -> **Capabilities**). */
		allowlisted_config_urls: string[];
		/** Allowlisted panel URLs for displaying the extension (the allowlist is configured on Twitch’s [developer site](https://dev.twitch.tv/console/extensions) under the **Extensions** -> **Extension** -> **Version** -> **Capabilities**). */
		allowlisted_panel_urls: string[];
	};
}

export interface GetReleasedExtension extends Base {
	/** A list that contains the specified extension. */
	data: GetExtension["data"];
}

export interface GetExtensionBitsProducts extends Base {
	/** A list of Bits products that the extension created. The list is in ascending SKU order. The list is empty if the extension hasn’t created any products or they’re all expired or disabled. */
	data: {
		/** The product’s SKU. The SKU is unique across an extension’s products. */
		sku: string;
		/** An object that contains the product’s cost information. */
		cost: {
			/** The product’s price. */
			amount: number;
			/** The type of currency. Possible values are:
			 * - bits
			 */
			type: "bits";
		};
		/** A Boolean value that indicates whether the product is in development. If **true**, the product is not available for public use. */
		in_development: boolean;
		/** The product’s name as displayed in the extension. */
		display_name: string;
		/** The date and time, in RFC3339 format, when the product expires. */
		expiration: string;
		/** A Boolean value that determines whether Bits product purchase events are broadcast to all instances of an extension on a channel. The events are broadcast via the `onTransactionComplete` helper callback. Is **true** if the event is broadcast to all instances. */
		is_broadcast: boolean;
	}[];
}

export interface UpdateExtensionBitsProduct extends Base {
	/** An object of Bits product that the extension created. The list is in ascending SKU order. The list is empty if the extension hasn't created any products or they're all expired or disabled. */
	data: GetExtensionBitsProducts["data"][0];
}

export interface CreateEventSubSubscription<_Subscription extends EventSub.Subscription> extends Base<true, 202> {
	/** A object that contains the single subscription that you created. */
	data: _Subscription & {
		/** An ID that identifies the subscription. */
		id: string;
		/**
		 * The subscription’s status. The subscriber receives events only for enabled subscriptions. Possible values are:
		 * - `enabled` — The subscription is enabled.
		 * - `webhook_callback_verification_pending` — The subscription is pending verification of the specified callback URL (see [Responding to a challenge request](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#responding-to-a-challenge-request)).
		 */
		status: "enabled" | "webhook_callback_verification_pending";
		/** The date and time (in RFC3339 format) of when the subscription was created. */
		created_at: string;
		/** The UTC date and time that the WebSocket connection was established. */
		connected_at: string;
		/** The amount that the subscription counts against your limit. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
		cost: number;
	};
	/** The total number of subscriptions you’ve created. */
	total: number;
	/** The sum of all of your subscription costs. [Learn More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
	total_cost: number;
	/** The maximum total cost that you’re allowed to incur for all subscriptions you create. */
	max_total_cost: number;
}

export type DeleteEventSubSubscription = Base<true, 204>;

export interface GetEventSubSubscriptions extends Base {
	/** The list of subscriptions. The list is ordered by the oldest subscription first. The list is empty if the client hasn't created subscriptions or there are no subscriptions that match the specified filter criteria. */
	data: EventSub.Subscription<EventSub.Transport.WebHook | EventSub.Transport.WebSocket.ConnectedAndDisconnected> & {
		/** An ID that identifies the subscription. */
		id: string;
		/** The subscription's status. The subscriber receives events only for enabled subscriptions.
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
		 */
		status: EventSub.Subscription.Status;
		/** The date and time (in RFC3339 format) of when the subscription was created. */
		created_at: string;
		/** The amount that the subscription counts against your limit. [Read More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
		cost: number;
	}[];
	/** The total number of subscriptions that you've created. */
	total: number;
	/** The sum of all of your subscription costs. [Read More](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/#subscription-limits) */
	total_cost: number;
	/** The maximum total cost that you're allowed to incur for all subscriptions that you create. */
	max_total_cost: number;
	/** An object that contains the cursor used to get the next page of subscriptions. The object is empty if there are no more pages to get. */
	pagination?: {
		/** The cursor value that you set the after query parameter to. */
		cursor?: string;
	};
}

export interface GetTopGames extends Base {
	/** The list of broadcasts. The broadcasts are sorted by the number of viewers, with the most popular first. */
	data: {
		/** An ID that identifies the category or game. */
		id: string;
		/** The category’s or game’s name. */
		name: string;
		/** A URL to the category’s or game’s box art. You must replace the `{width}x{height}` placeholder with the size of image you want. */
		box_art_url: string;
		/** The ID that [IGDB](https://www.igdb.com/) uses to identify this game. If the IGDB ID is not available to Twitch, this field is set to an empty string. */
		igdb_id: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after or before query parameter to get the next or previous page of results. */
		cursor?: string;
	};
}

export interface GetGames extends Base {
	/** The list of categories and games. The list is empty if the specified categories and games weren’t found. */
	data: GetTopGames["data"];
}

export interface GetCreatorGoals extends Base {
	/** The list of goals. The list is empty if the broadcaster hasn’t created goals. */
	data: {
		/** An ID that identifies this goal. */
		id: string;
		/** An ID that identifies the broadcaster that created the goal. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** 
		 * Goal type|Description
		 * -|-
		 * `follower`|The goal is to increase followers.
		 * `follower`|The goal is to increase followers.
		 * `subscription`|The goal is to increase subscriptions. This type shows the net increase or decrease in tier points associated with the subscriptions.
		 * `subscription_count`|The goal is to increase subscriptions. This type shows the net increase or decrease in the number of subscriptions.
		 * `new_subscription`|The goal is to increase subscriptions. This type shows only the net increase in tier points associated with the subscriptions (it does not account for users that unsubscribed since the goal started).
		 * `new_subscription_count`|The goal is to increase subscriptions. This type shows only the net increase in the number of subscriptions (it does not account for users that unsubscribed since the goal started)
		 * `new_bit`|The goal is to increase the amount of Bits used on the channel.
		 * `new_cheerer`|The goal is to increase the amount of unique Cheerers on to Cheer on the channel.
		 */
		type:
		| "follower"
		| "subscription"
		| "subscription_count"
		| "new_subscription"
		| "new_subscription_count"
		| "new_bit"
		| "new_cheerer";
		/** A description of the goal. Is an empty string if not specified. */
		description: string;
		/** 
		 * The goal’s current value. The goal’s `type` determines how this value is increased or decreased.
		 * - If `type` is follower, this field is set to the broadcaster's current number of followers. This number increases with new followers and decreases when users unfollow the broadcaster.
		 * - If `type` is subscription, this field is increased and decreased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased or decreased by 2, not 1.
		 * - If `type` is subscription_count, this field is increased by 1 for each new subscription and decreased by 1 for each user that unsubscribes.
		 * - If `type` is new_subscription, this field is increased by the points value associated with the subscription tier. For example, if a tier-two subscription is worth 2 points, this field is increased by 2, not 1.
		 * - If `type` is new_subscription_count, this field is increased by 1 for each new subscription.
		 */
		current_amount: number;
		/** The goal’s target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
		target_amount: number;
		/** The UTC date and time (in RFC3339 format) that the broadcaster created the goal. */
		created_at: string;
	}[];
}

export interface GetChannelGuestStarSettings extends Base {
	data: {
		/** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
		is_moderator_send_live_enabled: boolean;
		/** Number of slots the Guest Star call interface will allow the host to add to a call. Required to be between 1 and 6. */
		slot_count: number;
		/** Flag determining if Browser Sources subscribed to sessions on this channel should output audio */
		is_browser_source_audio_enabled: boolean;
		/**
		 * This setting determines how the guests within a session should be laid out within the browser source. Can be one of the following values:
		 * Value|Description
		 * TILED_LAYOUT|All live guests are tiled within the browser source with the same size.
		 * SCREENSHARE_LAYOUT|All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests.
		 * HORIZONTAL_LAYOUT|All live guests are arranged in a horizontal bar within the browser source
		 * VERTICAL_LAYOUT|All live guests are arranged in a vertical bar within the browser source
		 */
		group_layout: "TILED_LAYOUT" | "SCREENSHARE_LAYOUT" | "HORIZONTAL_LAYOUT" | "VERTICAL_LAYOUT";
		/** View only token to generate browser source URLs */
		browser_source_token: string;
	};
}

export type UpdateChannelGuestStarSettings = Base<true, 204>;

export interface GetGuestStarSession extends Base {
	/** Summary of the session details */
	data: {
		/** ID uniquely representing the Guest Star session. */
		id: string;
		/** List of guests currently interacting with the Guest Star session. */
		guests: {
			/**
			 * ID representing this guest’s slot assignment.
			 * - Host is always in slot "0"
			 * - Guests are assigned the following consecutive IDs (e.g, "1", "2", "3", etc)
			 * - Screen Share is represented as a special guest with the ID "SCREENSHARE"
			 * - The identifier here matches the ID referenced in browser source links used in broadcasting software.
			 */
			slot_id: string;
			/** Flag determining whether or not the guest is visible in the browser source in the host’s streaming software. */
			is_live: boolean;
			/** User ID of the guest assigned to this slot. */
			user_id: string;
			/** Display name of the guest assigned to this slot. */
			user_display_name: string;
			/** Login of the guest assigned to this slot. */
			user_login: string;
			/** Value from 0 to 100 representing the host’s volume setting for this guest. */
			volume: number;
			/** Timestamp when this guest was assigned a slot in the session. */
			assigned_at: string;
			/** Information about the guest’s audio settings */
			audio_settings: {
				/** Flag determining whether the host is allowing the guest’s audio to be seen or heard within the session. */
				is_host_enabled: boolean;
				/** Flag determining whether the guest is allowing their audio to be transmitted to the session. */
				is_guest_enabled: boolean;
				/** Flag determining whether the guest has an appropriate audio device available to be transmitted to the session. */
				is_available: boolean;
			};
			/** Information about the guest’s video settings */
		}[];
	};
}

export interface GetHypeTrainEvents extends Base {
	/** The list of Hype Train events. The list is empty if the broadcaster hasn’t run a Hype Train within the last 5 days. */
	data: {
		/** An ID that identifies this event. */
		id: string;
		/** The type of event. The string is in the form, hypetrain.{event_name}. The request returns only progress event types (i.e., hypetrain.progression). */
		event_type: string;
		/** The UTC date and time (in RFC3339 format) that the event occurred. */
		event_timestamp: string;
		/** The version number of the definition of the event’s data. For example, the value is 1 if the data in `event_data` uses the first definition of the event’s data. */
		version: string;
		/** The event’s data. */
		event_data: {
			/** The ID of the broadcaster that’s running the Hype Train. */
			broadcaster_id: string;
			/** The UTC date and time (in RFC3339 format) that another Hype Train can start. */
			cooldown_end_time: string;
			/** The UTC date and time (in RFC3339 format) that the Hype Train ends. */
			expires_at: string;
			/** The value needed to reach the next level. */
			goal: number;
			/** An ID that identifies this Hype Train. */
			id: string;
			/** The most recent contribution towards the Hype Train’s goal. */
			last_contribution: {
				/** The total amount contributed. If `type` is BITS, `total` represents the amount of Bits used. If `type` is SUBS, `total` is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
				total: number;
				/** The contribution method used. Possible values are:
				 * - `BITS` — Cheering with Bits.
				 * - `SUBS` — Subscription activity like subscribing or gifting subscriptions.
				 * - `OTHER` — Covers other contribution methods not listed. */
				type: 'BITS' | 'SUBS' | 'OTHER';
				/** The ID of the user that made the contribution. */
				user: string;
			};
			/** The highest level that the Hype Train reached (the levels are 1 through 5). */
			level: number;
			/** The UTC date and time (in RFC3339 format) that this Hype Train started. */
			started_at: string;
			/** The top contributors for each contribution type. For example, the top contributor using BITS (by aggregate) and the top contributor using SUBS (by count). */
			top_contributions: GetHypeTrainEvents["data"][0]["event_data"]["last_contribution"];
			/** The current total amount raised. */
			total: number;
		};
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. <a href="/docs/api/guide#pagination">Read More</a> */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}
export interface CheckAutomodStatus extends Base {
	/** The list of messages and whether Twitch would approve them for chat. */
	data: {
		/** The caller-defined ID passed in the request. */
		msg_id: string;
		/** A Boolean value that indicates whether Twitch would approve the message for chat or hold it for moderator review or block it from chat. Is `true` if Twitch would approve the message; otherwise, `false` if Twitch would hold the message for moderator review or block it from chat. */
		is_permitted: boolean;
	}[];
}
export type ManageHeldAutoModMessages = Base<true, 204>;
export interface GetAutoModSettings extends Base {
	/** The list of AutoMod settings. The list contains a single object that contains all the AutoMod settings. */
	data: {
		/** The broadcaster’s ID. */
		broadcaster_id: string;
		/** The moderator’s ID. */
		moderator_id: string;
		/** The default AutoMod level for the broadcaster. This field is `null` if the broadcaster has set one or more of the individual settings. */
		overall_level: number;
		/** The Automod level for discrimination against disability. */
		disability: number;
		/** The Automod level for hostility involving aggression. */
		aggression: number;
		/** The AutoMod level for discrimination based on sexuality, sex, or gender. */
		sexuality_sex_or_gender: number;
		/** The Automod level for discrimination against women. */
		misogyny: number;
		/** The Automod level for hostility involving name calling or insults. */
		bullying: number;
		/** The Automod level for profanity. */
		swearing: number;
		/** The Automod level for racial discrimination. */
		race_ethnicity_or_religion: number;
		/** The Automod level for sexual content. */
		sex_based_terms: number;
	};
}
export type UpdateAutoModSettings = GetAutoModSettings;
export interface GetBannedUsers extends Base {
	/** The list of users that were banned or put in a timeout. */
	data: {
		/** The ID of the banned user. */
		user_id: string;
		/** The banned user’s login name. */
		user_login: string;
		/** The banned user’s display name. */
		user_name: string;
		/** The UTC date and time (in RFC3339 format) of when the timeout expires, or an empty string if the user is permanently banned. */
		expires_at: string;
		/** The UTC date and time (in RFC3339 format) of when the user was banned. */
		created_at: string;
		/** The reason the user was banned or put in a timeout if the moderator provided one. */
		reason: string;
		/** The ID of the moderator that banned the user or put them in a timeout. */
		moderator_id: string;
		/** The moderator’s login name. */
		moderator_login: string;
		/** The moderator’s display name. */
		moderator_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. <a href="/docs/api/guide#pagination">Read More</a> */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}
export interface BanUser extends Base {
	/** A list that contains the user you successfully banned or put in a timeout. */
	data: {
		/** The broadcaster whose chat room the user was banned from chatting in. */
		broadcaster_id: string;
		/** The moderator that banned or put the user in the timeout. */
		moderator_id: string;
		/** The user that was banned or put in a timeout. */
		user_id: string;
		/** The UTC date and time (in RFC3339 format) that the ban or timeout was placed. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) that the timeout will end. Is `null` if the user was banned instead of being put in a timeout. */
		end_time: string;
	};
}
export type UnbanUser = Base<true, 204>;
export interface GetUnbanRequests extends Base {
	/** A list that contains information about the channel's unban requests. */
	data: {
		/** Unban request ID. */
		id: string;
		/** User ID of broadcaster whose channel is receiving the unban request. */
		broadcaster_id: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** User ID of moderator who approved/denied the request. */
		moderator_id: string;
		/** The moderator's login name. */
		moderator_login: string;
		/** The moderator's display name. */
		moderator_name: string;
		/** User ID of the requestor who is asking for an unban. */
		user_id: string;
		/** The user's login name. */
		user_login: string;
		/** The user's display name. */
		user_name: string;
		/** Text of the request from the requesting user. */
		text: string;
		/** Status of the request. */
		status: 'pending' | 'approved' | 'denied' | 'acknowledged' | 'canceled';
		/** Timestamp of when the unban request was created. */
		created_at: string;
		/** Timestamp of when moderator/broadcaster approved or denied the request. */
		resolved_at: string;
		/** Text input by the resolver (moderator) of the unban. request */
		resolution_text: string;
	}[];
	/** Contains information used to page through a list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}
export interface ResolveUnbanRequest<Status extends 'approved' | 'denied' = 'approved' | 'denied'> extends Base {
	data: Omit<GetUnbanRequests["data"][0], "status"> & {
		/** Status of the request. */
		status: Status;
	};
}
export interface GetBlockedTerms extends Base {
	/** The list of blocked terms. The list is in descending order of when they were created (see the `created_at` timestamp). */
	data: {
		/** The broadcaster that owns the list of blocked terms. */
		broadcaster_id: string;
		/** The moderator that blocked the word or phrase from being used in the broadcaster’s chat room. */
		moderator_id: string;
		/** An ID that identifies this blocked term. */
		id: string;
		/** The blocked word or phrase. */
		text: string;
		/** The UTC date and time (in RFC3339 format) that the term was blocked. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) that the term was updated. When the term is added, this timestamp is the same as `created_at`. The timestamp changes as AutoMod continues to deny the term. */
		updated_at: string;
		/** The UTC date and time (in RFC3339 format) that the blocked term is set to expire. After the block expires, users may use the term in the broadcaster’s chat room. This field is `null` if the term was added manually or was permanently blocked by AutoMod. */
		expires_at: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}
export interface AddBlockedTerm extends Base {
	/** A list that contains the single blocked term that the broadcaster added. */
	data: {
		/** The broadcaster that owns the list of blocked terms. */
		broadcaster_id: string;
		/** The moderator that blocked the word or phrase from being used in the broadcaster’s chat room. */
		moderator_id: string;
		/** An ID that identifies this blocked term. */
		id: string;
		/** The blocked word or phrase. */
		text: string;
		/** The UTC date and time (in RFC3339 format) that the term was blocked. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) that the term was updated. When the term is added, this timestamp is the same as `created_at`. The timestamp changes as AutoMod continues to deny the term. */
		updated_at: string;
		/** The UTC date and time (in RFC3339 format) that the blocked term is set to expire. After the block expires, users may use the term in the broadcaster’s chat room. This field is `null` if the term was added manually or was permanently blocked by AutoMod. */
		expires_at: string | null;
	};
}
export type RemoveBlockedTerm = Base<true, 204>;
export type DeleteChatMessage = Base<true, 204>;
export interface GetModeratedChannels extends Base {
	/** The list of channels that the user has moderator privileges in. */
	data: {
		/** An ID that uniquely identifies the channel this user can moderate. */
		broadcaster_id: string;
		/** The channel’s login name. */
		broadcaster_login: string;
		/** The channels’ display name. */
		broadcaster_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s after query parameter. */
		cursor?: string;
	};
}
export interface GetModerators extends Base {
	/** The list of moderators. */
	data: {
		/** The ID of the user that has permission to moderate the broadcaster’s channel. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv//docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}
export type AddChannelModerator = Base<true, 204>;
export type RemoveChannelModerator = Base<true, 204>;
export interface GetChannelVips extends Base {
	/** The list of VIPs. The list is empty if the broadcaster doesn’t have VIP users. */
	data: {
		/** An ID that uniquely identifies the VIP user. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}
export type AddChannelVip = Base<true, 204>;
export type RemoveChannelVip = Base<true, 204>;
export interface UpdateShieldModeStatus extends Base {
	/** Object with the broadcaster’s updated Shield Mode status. */
	data: {
		/** A Boolean value that determines whether Shield Mode is active. Is `true` if Shield Mode is active; otherwise, `false`. */
		is_active: boolean;
		/** An ID that identifies the moderator that last activated Shield Mode. */
		moderator_id: string;
		/** The moderator’s login name. */
		moderator_login: string;
		/** The moderator’s display name. */
		moderator_name: string;
		/** The UTC timestamp (in RFC3339 format) of when Shield Mode was last activated. */
		last_activated_at: string;
	};
}
export interface GetShieldModeStatus extends Base {
	/** Object with the broadcaster’s Shield Mode status. */
	data: {
		/** A Boolean value that determines whether Shield Mode is active. Is `true` if the broadcaster activated Shield Mode; otherwise, `false`. */
		is_active: boolean;
		/** An ID that identifies the moderator that last activated Shield Mode. Is an empty string if Shield Mode hasn’t been previously activated. */
		moderator_id: string;
		/** The moderator’s login name. Is an empty string if Shield Mode hasn’t been previously activated. */
		moderator_login: string;
		/** The moderator’s display name. Is an empty string if Shield Mode hasn’t been previously activated. */
		moderator_name: string;
		/** The UTC timestamp (in RFC3339 format) of when Shield Mode was last activated. Is an empty string if Shield Mode hasn’t been previously activated. */
		last_activated_at: string;
	};
}
export interface WarnChatUser extends Base {
	/** A list that contains information about the warning. */
	data: {
		/** The ID of the channel in which the warning will take effect. */
		broadcaster_id: string;
		/** The ID of the warned user. */
		user_id: string;
		/** The ID of the user who applied the warning. */
		moderator_id: string;
		/** The reason provided for warning. */
		reason: string;
	};
}
export interface GetPolls extends Base {
	/** A list of polls. The polls are returned in descending order of start time unless you specify IDs in the request, in which case they're returned in the same order as you passed them in the request. The list is empty if the broadcaster hasn't created polls. */
	data: {
		/** An ID that identifies the poll. */
		id: string;
		/** An ID that identifies the broadcaster that created the poll. */
		broadcaster_id: string;
		/** The broadcaster's display name. */
		broadcaster_name: string;
		/** The broadcaster's login name. */
		broadcaster_login: string;
		/** The question that viewers are voting on. For example, `What game should I play next?` The title may contain a maximum of 60 characters. */
		title: string;
		/** A list of choices that viewers can choose from. The list will contain a minimum of two choices and up to a maximum of five choices. */
		choices: {
			/** An ID that identifies this choice. */
			id: string;
			/** The choice's title. The title may contain a maximum of 25 characters. */
			title: string;
			/** The total number of votes cast for this choice. */
			votes: number;
			/** The number of votes cast using Channel Points. */
			channel_points_votes: number;
			/** Not used. */
			bits_votes: 0;
		}[];
		/** Not used. */
		bits_voting_enabled: false;
		/** Not used. */
		bits_per_vote: 0;
		/** A Boolean value that indicates whether viewers may cast additional votes using Channel Points. For information about Channel Points, see [Channel Points Guide](https://help.twitch.tv/s/article/channel-points-guide) */
		channel_points_voting_enabled: boolean;
		/** The number of points the viewer must spend to cast one additional vote. */
		channel_points_per_vote: number;
		/**
		 * The poll's status. Valid values are:
		 * - `ACTIVE` — The poll is running.
		 * - `COMPLETED` — The poll ended on schedule (see the `duration` field).
		 * - `TERMINATED` — The poll was terminated before its scheduled end.
		 * - `ARCHIVED` — The poll has been archived and is no longer visible on the channel.
		 * - `MODERATED` — The poll was deleted.
		 * - `INVALID` — Something went wrong while determining the state.
		 */
		status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID';
		/** The length of time (in seconds) that the poll will run for. */
		duration: number;
		/** The UTC date and time (in RFC3339 format) of when the poll began. */
		started_at: string;
		/** The UTC date and time (in RFC3339 format) of when the poll ended. If `status` is ACTIVE, this field is set to `null`. */
		ended_at: string | null;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request's `after` query parameter. */
		cursor?: string;
	};
}
export interface CreatePoll extends Base {
	/** An object that contains the poll that you created. */
	data: Omit<GetPolls["data"][0], "status"> & {
		/** The poll's status. */
		status: "ACTIVE";
	};
}
export interface EndPoll<Status extends 'TERMINATED' | 'ARCHIVED' = 'TERMINATED' | 'ARCHIVED'> extends Base {
	/** An object that contains the poll that you ended. */
	data: Omit<GetPolls["data"][0], "status"> & {
		/** The poll's status. */
		status: Status;
	};
}
export interface GetPredictions extends Base {
	/** The broadcaster’s list of Channel Points Predictions. The list is sorted in descending ordered by when the prediction began (the most recent prediction is first). The list is empty if the broadcaster hasn’t created predictions. */
	data: {
		/** An ID that identifies this prediction. */
		id: string;
		/** An ID that identifies the broadcaster that created the prediction. */
		broadcaster_id: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The question that the prediction asks. For example, `Will I finish this entire pizza?` */
		title: string;
		/** The ID of the winning outcome. Is `null` unless `status` is `RESOLVED`. */
		winning_outcome_id: string | null;
		/** The list of possible outcomes for the prediction. */
		outcomes: {
			/** An ID that identifies this outcome. */
			id: string;
			/** The outcome’s text. */
			title: string;
			/** The number of unique viewers that chose this outcome. */
			users: number;
			/** The number of Channel Points spent by viewers on this outcome. */
			channel_points: number;
			/** A list of viewers who were the top predictors; otherwise, `null` if none. */
			top_predictors: {
				/** An ID that identifies the viewer. */
				user_id: string;
				/** The viewer’s display name. */
				user_name: string;
				/** The viewer’s login name. */
				user_login: string;
				/** The number of Channel Points the viewer spent. */
				channel_points_used: number;
				/** The number of Channel Points distributed to the viewer. */
				channel_points_won: number;
			}[] | null;
			/** The color that visually identifies this outcome in the UX. If the number of outcomes is two, the color is `BLUE` for the first outcome and `PINK` for the second outcome. If there are more than two outcomes, the color is `BLUE` for all outcomes. */
			color: 'BLUE' | 'PINK';
		}[];
		/** The length of time (in seconds) that the prediction will run for. */
		prediction_window: number;
		/** The prediction’s status. Valid values are:
		 * - `ACTIVE` — The Prediction is running and viewers can make predictions.
		 * - `CANCELED` — The broadcaster canceled the Prediction and refunded the Channel Points to the participants.
		 * - `LOCKED` — The broadcaster locked the Prediction, which means viewers can no longer make predictions.
		 * - `RESOLVED` — The winning outcome was determined and the Channel Points were distributed to the viewers who predicted the correct outcome. */
		status: 'ACTIVE' | 'CANCELED' | 'LOCKED' | 'RESOLVED';
		/** The UTC date and time of when the Prediction began. */
		created_at: string;
		/** The UTC date and time of when the Prediction ended. If `status` is `ACTIVE`, this is set to `null`. */
		ended_at: string | null;
		/** The UTC date and time of when the Prediction was locked. If `status` is not `LOCKED`, this is set to `null`. */
		locked_at: string | null;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request’s `after` query parameter. */
		cursor?: string;
	};
}
export interface CreatePrediction extends Base {
	/** An object that contains the single prediction that you created. */
	data: Omit<GetPredictions["data"][0], "status"> & {
		/** The prediction’s status. */
		status: 'ACTIVE';
	};
}
export interface EndPrediction extends Base {
	/** An object that contains the single prediction that you ended. */
	data: Omit<GetPredictions["data"][0], "status"> & {
		/** The prediction’s status. */
		status: 'RESOLVED' | 'CANCELED' | 'LOCKED';
	};
}
export interface StartRaid extends Base {
	/** An object with information about the pending raid. */
	data: {
		/** The UTC date and time, in RFC3339 format, of when the raid was requested. */
		created_at: string;
		/** A Boolean value that indicates whether the channel being raided contains mature content. */
		is_mature: boolean;
	};
}
export type CancelRaid = Base<true, 204>;
// im lazy to make this for methods from Get Channel Stream Schedule to Delete Channel Stream Schedule Segment
export interface SearchCategories extends Base {
	/** The list of games or categories that match the query. The list is empty if there are no matches. */
	data: {
		/** A URL to an image of the game’s box art or streaming category. */
		box_art_url: string;
		/** The name of the game or category. */
		name: string;
		/** An ID that uniquely identifies the game or category. */
		id: string;
	}[];
}
export interface SearchChannels extends Base {
	/** The list of channels that match the query. The list is empty if there are no matches. */
	data: {
		/** The ISO 639-1 two-letter language code of the language used by the broadcaster. For example, `en` for English. If the broadcaster uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang), the value is `other`. */
		broadcaster_language: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		display_name: string;
		/** The ID of the game that the broadcaster is playing or last played. */
		game_id: string;
		/** The name of the game that the broadcaster is playing or last played. */
		game_name: string;
		/** An ID that uniquely identifies the channel (this is the broadcaster’s ID). */
		id: string;
		/** A Boolean value that determines whether the broadcaster is streaming live. Is `true` if the broadcaster is streaming live; otherwise, `false`. */
		is_live: boolean;
		/** **IMPORTANT** As of February 28, 2023, this field is deprecated and returns only an empty array. If you use this field, please update your code to use the `tags` field. */
		tag_ids: [];
		/** The tags applied to the channel. */
		tags: string[];
		/** A URL to a thumbnail of the broadcaster’s profile image. */
		thumbnail_url: string;
		/** The stream’s title. Is an empty string if the broadcaster didn’t set it. */
		title: string;
		/** The UTC date and time (in RFC3339 format) of when the broadcaster started streaming. The string is empty if the broadcaster is not streaming live. */
		started_at: string;
	}[];
}
export interface GetStreamKey extends Base {
	/** A list that contains the channel’s stream key. */
	data: {
		/** The channel’s stream key. */
		stream_key: string;
	};
}
export interface GetStreams extends Base {
	/** The list of streams. */
	data: {
		/** An ID that identifies the stream. You can use this ID later to look up the video on demand (VOD). */
		id: string;
		/** The ID of the user that’s broadcasting the stream. */
		user_id: string;
		/** The user’s login name. */
		user_login: string;
		/** The user’s display name. */
		user_name: string;
		/** The ID of the category or game being played. */
		game_id: string;
		/** The name of the category or game being played. */
		game_name: string;
		/** The type of stream. If an error occurs, this field is set to an empty string. */
		type: 'live' | '';
		/** The stream’s title. Is an empty string if not set. */
		title: string;
		/** The tags applied to the stream. */
		tags: string[];
		/** The number of users watching the stream. */
		viewer_count: number;
		/** The UTC date and time (in RFC3339 format) of when the broadcast began. */
		started_at: string;
		/** The language that the stream uses. This is an ISO 639-1 two-letter language code or `other` if the stream uses a language not in the list of [supported stream languages](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). */
		language: string;
		/** A URL to an image of a frame from the last 5 minutes of the stream. Replace the width and height placeholders in the URL (`{width}x{height}`) with the size of the image you want, in pixels. */
		thumbnail_url: string;
		/** **IMPORTANT** As of February 28, 2023, this field is deprecated and returns only an empty array. If you use this field, please update your code to use the `tags` field. */
		tag_ids: [];
		/** A Boolean value that indicates whether the stream is meant for mature audiences. */
		is_mature: boolean;
	}[];
	/** The information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Set the request’s `after` or `before` query parameter to this value depending on whether you’re paging forwards or backwards. */
		cursor?: string;
	};
}
export type GetFollowedStreams = GetStreams;
// CreateStreamMarker
// GetStreamMarkers
export interface GetBroadcasterSubscriptions extends Base {
	/** The list of users that subscribe to the broadcaster. The list is empty if the broadcaster has no subscribers. */
	data: ({
		/** An ID that identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The name of the subscription. */
		plan_name: string;
		/**
		 * The type of subscription. Possible values are:
		 * - `1000` — Tier 1
		 * - `2000` — Tier 2
		 * - `3000` — Tier 3
		 */
		tier: '1000' | '2000' | '3000';
		/** An ID that identifies the subscribing user. */
		user_id: string;
		/** The user’s display name. */
		user_name: string;
		/** The user’s login name. */
		user_login: string;
	} & ({
		/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
		is_gift: true;
		/** The ID of the user that gifted the subscription to the user. */
		gifter_id: string;
		/** The gifter’s login name. */
		gifter_login: string;
		/** The gifter’s display name. */
		gifter_name: string;
	} | {
		/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
		is_gift: false;
		/** The ID of the user that gifted the subscription to the user. Is an empty string if `is_gift` is `false`. */
		gifter_id: string;
		/** The gifter’s login name. Is an empty string if `is_gift` is `false`. */
		gifter_login: string;
		/** The gifter’s display name. Is an empty string if `is_gift` is `false`. */
		gifter_name: string;
	}))[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next or previous page of results. Use the cursor to set the request’s `after` or `before` query parameter depending on whether you’re paging forwards or backwards. */
		cursor?: string;
	};
	/** The current number of subscriber points earned by this broadcaster. Points are based on the subscription tier of each user that subscribes to this broadcaster. For example, a Tier 1 subscription is worth 1 point, Tier 2 is worth 2 points, and Tier 3 is worth 6 points. The number of points determines the number of emote slots that are unlocked for the broadcaster (see [Subscriber Emote Slots](https://help.twitch.tv/s/article/subscriber-emote-guide#emoteslots)). */
	points: number;
	/** The total number of users that subscribe to this broadcaster. */
	total: number;
}
export interface CheckUserSubscription extends Base {
	/** An object with information about the user’s subscription. */
	data: {
		/** An ID that identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/**
		 * The type of subscription. Possible values are:
		 * - `1000` — Tier 1
		 * - `2000` — Tier 2
		 * - `3000` — Tier 3
		 */
		tier: '1000' | '2000' | '3000';
	} & ({
		/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
		is_gift: true;
		/** The ID of the user that gifted the subscription. */
		gifter_id: string;
		/** The gifter’s login name. */
		gifter_login: string;
		/** The gifter’s display name. */
		gifter_name: string;
	} | {
		/** A Boolean value that determines whether the subscription is a gift subscription. Is `true` if the subscription was gifted. */
		is_gift: false;
	});
}
export interface GetChannelTeams extends Base {
	/** The list of teams that the broadcaster is a member of. Returns an empty array if the broadcaster is not a member of a team. */
	data: {
		/** An ID that identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** A URL to the team’s background image. This field is null if the team does not have a background image set. */
		background_image_url: string | null;
		/** A URL to the team’s banner. This field is `null` if the team does not have a banner set. */
		banner: string | null;
		/** The UTC date and time (in RFC3339 format) of when the team was created. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) of the last time the team was updated. */
		updated_at: string;
		/** The team’s description. The description may contain formatting such as Markdown, HTML, newline (\\n) characters, etc. */
		info: string;
		/** A URL to a thumbnail image of the team’s logo. */
		thumbnail_url: string;
		/** The team’s name. */
		team_name: string;
		/** The team’s display name. */
		team_display_name: string;
		/** An ID that identifies the team. */
		id: string;
	}[];
}
export interface GetTeams extends Base {
	/** A list that contains the single team that you requested. */
	data: {
		/** The list of team members. */
		users: {
			/** An ID that identifies the team member. */
			user_id: string;
			/** The team member’s login name. */
			user_login: string;
			/** The team member’s display name. */
			user_name: string;
		}[];
		/** A URL to the team’s background image. */
		background_image_url: string;
		/** A URL to the team’s banner. */
		banner: string;
		/** The UTC date and time (in RFC3339 format) of when the team was created. */
		created_at: string;
		/** The UTC date and time (in RFC3339 format) of the last time the team was updated. */
		updated_at: string;
		/** The team’s description. The description may contain formatting such as Markdown, HTML, newline (\\n) characters, etc. */
		info: string;
		/** A URL to a thumbnail image of the team’s logo. */
		thumbnail_url: string;
		/** The team’s name. */
		team_name: string;
		/** The team’s display name. */
		team_display_name: string;
		/** An ID that identifies the team. */
		id: string;
	}[];
}
export interface GetUsers extends Base {
	data: {
		/** An ID that identifies the user. */
		id: string;
		/** The user’s login name. */
		login: string;
		/** The user’s display name. */
		display_name: string;
		/** The type of user. Possible values are:
		 * - `admin` — Twitch administrator
		 * - `global_mod`
		 * - `staff` — Twitch staff
		 * - `""` — Normal user
		 */
		type: "admin" | "global_mod" | "staff" | "";
		/** The type of broadcaster. Possible values are:
		 * - `affiliate` — An affiliate broadcaster [affiliate broadcaster](https://help.twitch.tv/s/article/joining-the-affiliate-program%20target=)
		 * - `partner` — A partner broadcaster [partner broadcaster](https://help.twitch.tv/s/article/partner-program-overview)
		 * - `""` — A normal broadcaster
		 */
		broadcaster_type: "affiliate" | "partner" | "";
		/** The user’s description of their channel. */
		description: string;
		/** A URL to the user’s profile image. */
		profile_image_url: string;
		/** A URL to the user’s offline image. */
		offline_image_url: string;
		/** The number of times the user’s channel has been viewed. **NOTE**: This field has been deprecated (see [Get Users API endpoint – “view_count” deprecation](https://discuss.dev.twitch.tv/t/get-users-api-endpoint-view-count-deprecation/37777)). Any data in this field is not valid and should not be used. */
		view_count: number;
		/** The user’s verified email address. The object includes this field only if the user access token includes the **user:read:email** scope. If the request contains more than one user, only the user associated with the access token that provided consent will include an email address — the email address for all other users will be empty. */
		email?: string;
		/** The UTC date and time that the user’s account was created. The timestamp is in RFC3339 format. */
		created_at: string;
	}[];
}
export interface GetUserBlockList extends Base {
	/** The list of blocked users. The list is in descending order by when the user was blocked. */
	data: {
		/** An ID that identifies the blocked user. */
		user_id: string;
		/** The blocked user’s login name. */
		user_login: string;
		/** The blocked user’s display name. */
		display_name: string;
	}[];
}
export type BlockUser = Base<true, 204>;
export type UnblockUser = Base<true, 204>;
// GetUserExtensions
// GetUserActiveExtensions
// UpdateUserExtensions
export interface GetVideos extends Base {
	/** The list of published videos that match the filter criteria. */
	data: {
		/** An ID that identifies the video. */
		id: string;
		/** The ID of the stream that the video originated from if the video\'s type is "archive;" otherwise, `null`. */
		stream_id: string | null;
		/** The ID of the broadcaster that owns the video. */
		user_id: string;
		/** The broadcaster\'s login name. */
		user_login: string;
		/** The broadcaster\'s display name. */
		user_name: string;
		/** The video\'s title. */
		title: string;
		/** The video\'s description. */
		description: string;
		/** The date and time, in UTC, of when the video was created. The timestamp is in RFC3339 format. */
		created_at: string;
		/** The date and time, in UTC, of when the video was published. The timestamp is in RFC3339 format. */
		published_at: string;
		/** The video\'s URL. */
		url: string;
		/** A URL to a thumbnail image of the video. Before using the URL, you must replace the `%{width}` and `%{height}` placeholders with the width and height of the thumbnail you want returned. Due to current limitations, `${width}` must be 320 and `${height}` must be 180. */
		thumbnail_url: string;
		/** The video\'s viewable state. */
		viewable: 'public';
		/** The number of times that users have watched the video. */
		view_count: number;
		/** The ISO 639-1 two-letter language code that the video was broadcast in. For example, the language code is DE if the video was broadcast in German. For a list of supported languages, see [Supported Stream Language](https://help.twitch.tv/s/article/languages-on-twitch#streamlang). The language value is "other" if the video was broadcast in a language not in the list of supported languages. */
		language: string;
		/** The video\'s type. Possible values are:
		 * - `archive` — An on-demand video (VOD) of one of the broadcaster\'s past streams.
		 * - `highlight` — A highlight reel of one of the broadcaster\'s past streams. See [Creating Highlights](https://help.twitch.tv/s/article/creating-highlights-and-stream-markers).
		 * - `upload` — A video that the broadcaster uploaded to their video library. See Upload under [Video Producer](https://help.twitch.tv/s/article/video-on-demand?language=en_US#videoproducer). */
		type: 'archive' | 'highlight' | 'upload';
		/** The video\'s length in ISO 8601 duration format. For example, 3m21s represents 3 minutes, 21 seconds. */
		duration: string;
		/** The segments that Twitch Audio Recognition muted; otherwise, `null`. */
		muted_segments: {
			/** The duration of the muted segment, in seconds. */
			duration: number;
			/** The offset, in seconds, from the beginning of the video to where the muted segment begins. */
			offset: number;
		}[] | null;
	}[];
	/** Contains the information used to page through the list of results. The object is empty if there are no more pages left to page through. [Read More](https://dev.twitch.tv/docs/api/guide#pagination) */
	pagination?: {
		/** The cursor used to get the next page of results. Use the cursor to set the request\'s `after` or `before` query parameter depending on whether you\'re paging forwards or backwards through the results. */
		cursor?: string;
	};
}
export interface DeleteVideos extends Base {
	/** The list of IDs of the videos that were deleted. */
	data: string[];
}
export type SendWhisper = Base<true, 204>;
export type OAuth2Validate<S extends Authorization.Scope[]> = Authorization<S> & Base;
export type OAuth2Revoke = Base;
export namespace OAuth2Token {
	export interface ClientCredentials extends Base {
		/** App access token gotten with client credentials grant flow */
		access_token: string;
		/** How long, in seconds, the token is valid for */
		expires_in: number;
		/** Type of token */
		token_type: "bearer";
	}
	export interface AuthorizationCode<S extends Authorization.Scope[] = Authorization.Scope[]> extends Base {
		/** User access token gotten with authorization code grant flow */
		access_token: string;
		/** How long, in seconds, the access token is valid for */
		expires_in: number;
		/** Token to use in `Request.OAuth2Token.RefreshToken` when access token expires */
		refresh_token: string;
		/** Authorization scopes which contains this access token */
		scopes: S;
		/** Type of token */
		token_type: "bearer";
	}
}

export interface Error extends globalThis.Error {
	/** The code status of request. */
	status: 400 | 401 | 404 | 408 | 409 | 410 | 422 | 425 | 429 | 500;
	/** The code status of request. */
	ok: false;
}
export namespace Error {
	export function makeFromGlobalError(error: globalThis.Error, status: Error["status"]): Error {
		(error as Error).status = status;
		(error as Error).ok = false;
		return error as Error;
	}
	export interface OAuth2Validate<Token extends string = string> extends Error {
		/** The access token you specified in first argument of `Request.OAuth2Validate` */
		token: Token;
	}
	export function makeFromGlobalError_OAuth2Validate<Token extends string = string>(error: globalThis.Error, status: Error["status"], token: Token): Error.OAuth2Validate {
		(error as Error.OAuth2Validate).status = status;
		(error as Error.OAuth2Validate).ok = false;
		(error as Error.OAuth2Validate).token = token;
		return error as Error.OAuth2Validate;
	}
}