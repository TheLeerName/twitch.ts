export interface ModifyChannelInformation {
	/** The ID of the game that the user plays. The game is not updated if the ID isn’t a game ID that Twitch recognizes. To unset this field, use “0” or “” (an empty string). */
	game_id?: string;
	/** The user’s preferred language. Set the value to an ISO 639-1 two-letter language code (for example, en for English). Set to “other” if the user’s preferred language is not a Twitch supported language. The language isn’t updated if the language code isn’t a Twitch supported language. */
	broadcaster_language?: string;
	/** The title of the user’s stream. You may not set this field to an empty string. */
	title?: string;
	/** The number of seconds you want your broadcast buffered before streaming it live. The delay helps ensure fairness during competitive play. Only users with Partner status may set this field. The maximum delay is 900 seconds (15 minutes). */
	delay?: number;
	/** A list of channel-defined tags to apply to the channel. To remove all tags from the channel, set tags to an empty array. Tags help identify the content that the channel streams. A channel may specify a maximum of 10 tags. Each tag is limited to a maximum of 25 characters and may not be an empty string or contain spaces or special characters. Tags are case insensitive. For readability, consider using camelCasing or PascalCasing. [Learn More](https://help.twitch.tv/s/article/guide-to-tags) */
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
export interface CreateCustomReward {
	/** The custom reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
	title: string;
	/** The cost of the reward, in Channel Points. The minimum is 1 point. */
	cost: number;
	/** The prompt shown to the viewer when they redeem the reward. Specify a prompt if `is_user_input_required` is `true`. The prompt is limited to a maximum of 200 characters. */
	prompt?: string;
	/** A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is `true`. */
	is_enabled?: boolean;
	/** The background color to use for the reward. Specify the color using Hex format (for example, #9147FF). */
	background_color?: string;
	/** A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the `prompt` field. The default is `false`. */
	is_user_input_required?: boolean;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the `max_per_stream` field). The default is `false`. */
	is_max_per_stream_enabled?: boolean;
	/** The maximum number of redemptions allowed per live stream. Applied only if `is_max_per_stream_enabled` is `true`. The minimum value is 1. */
	max_per_stream?: number;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see the `max_per_user_per_stream` field). The default is `false`. */
	is_max_per_user_per_stream_enabled?: boolean;
	/** The maximum number of redemptions allowed per user per stream. Applied only if `s_max_per_user_per_stream_enabled` is `true`. The minimum value is 1. */
	max_per_user_per_stream?: number;
	/** A Boolean value that determines whether to apply a cooldown period between redemptions (see the `global_cooldown_seconds` field for the duration of the cooldown period). The default is `false`. */
	is_global_cooldown_enabled?: boolean;
	/** The cooldown period, in seconds. Applied only if the `is_global_cooldown_enabled` field is `true`. The minimum value is 1; however, the minimum value is 60 for it to be shown in the Twitch UX. */
	global_cooldown_seconds?: number;
	/** A Boolean value that determines whether redemptions should be set to `FULFILLED` status immediately when a reward is redeemed. If `false`, status is set to `UNFULFILLED` and follows the normal request queue process. The default is `false`. */
	should_redemptions_skip_request_queue?: boolean;
}
export interface UpdateCustomReward {
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
export interface UpdateChatSettings {
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