import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scope `channel:manage:redemptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster to add the custom reward to. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
}

export interface RequestBody {
	/** The custom reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
	title: string;
	/** **64-bit Integer**. The cost of the reward, in Channel Points. The minimum is 1 point. */
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
	/** **Integer**. The maximum number of redemptions allowed per live stream. Applied only if `is_max_per_stream_enabled` is **true**. The minimum value is 1. */
	max_per_stream?: number;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see the `max_per_user_per_stream` field). The default is **false**. */
	is_max_per_user_per_stream_enabled?: boolean;
	/** **Integer**. The maximum number of redemptions allowed per user per stream. Applied only if `is_max_per_user_per_stream_enabled` is **true**. The minimum value is 1. */
	max_per_user_per_stream?: number;
	/** A Boolean value that determines whether to apply a cooldown period between redemptions (see the `global_cooldown_seconds` field for the duration of the cooldown period). The default is **false**. */
	is_global_cooldown_enabled?: boolean;
	/** **Integer**. The cooldown period, in seconds. Applied only if the `is_global_cooldown_enabled` field is **true**. The minimum value is 1; however, the minimum value is 60 for it to be shown in the Twitch UX. */
	global_cooldown_seconds?: number;
	/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If **false**, status is set to UNFULFILLED and follows the normal request queue process. The default is **false**. */
	should_redemptions_skip_request_queue?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** A list that contains the single custom reward you created. */
	data: [{
		/** The ID that uniquely identifies the broadcaster. */
		broadcaster_id: string;
		/** The broadcaster’s login name. */
		broadcaster_login: string;
		/** The broadcaster’s display name. */
		broadcaster_name: string;
		/** The ID that uniquely identifies this custom reward. */
		id: string;
		/** The title of the reward. */
		title: string;
		/** The prompt shown to the viewer when they redeem the reward if user input is required (see the `is_user_input_required` field). */
		prompt: string;
		/** **Integer**. The cost of the reward in Channel Points. */
		cost: number;
		/** A set of custom images for the reward. This field is set to **null** if the broadcaster didn’t upload images. */
		image: {
			/** The URL to a small version of the image. */
			url_1x: string;
			/** The URL to a medium version of the image. */
			url_2x: string;
			/** The URL to a large version of the image. */
			url_4x: string;
		} | null;
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
		/** A Boolean value that determines whether the reward is enabled. Is **true** if enabled; otherwise, **false**. Disabled rewards aren’t shown to the user. */
		is_enabled: boolean;
		/** A Boolean value that determines whether the user must enter information when redeeming the reward. Is **true** if the reward requires user input. */
		is_user_input_required: boolean;
		/** The settings used to determine whether to apply a maximum to the number to the redemptions allowed per live stream. */
		max_per_stream_setting: {
			/** A Boolean value that determines whether the reward applies a limit on the number of redemptions allowed per live stream. Is **true** if the reward applies a limit. */
			is_enabled: boolean;
			/** **64-bit Integer**. The maximum number of redemptions allowed per live stream. */
			max_per_stream: number;
		};
		/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per user per live stream. */
		max_per_user_per_stream_setting: {
			/** A Boolean value that determines whether the reward applies a limit on the number of redemptions allowed per user per live stream. Is **true** if the reward applies a limit. */
			is_enabled: boolean;
			/** **64-bit Integer**. The maximum number of redemptions allowed per user per live stream. */
			max_per_user_per_stream: number;
		}
		/** The settings used to determine whether to apply a cooldown period between redemptions and the length of the cooldown. */
		global_cooldown_setting: {
			/** A Boolean value that determines whether to apply a cooldown period. Is **true** if a cooldown period is enabled. */
			is_enabled: boolean;
			/** **64-bit Integer**. The cooldown period, in seconds. */
			global_cooldown_seconds: number;
		};
		/** A Boolean value that determines whether the reward is currently paused. Is **true** if the reward is paused. Viewers can’t redeem paused rewards. */
		is_paused: boolean;
		/** A Boolean value that determines whether the reward is currently in stock. Is **true** if the reward is in stock. Viewers can’t redeem out of stock rewards. */
		is_in_stock: boolean;
		/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If **false**, status is UNFULFILLED and follows the normal request queue process. */
		should_redemptions_skip_request_queue: boolean;
		/** **Integer**. The number of redemptions redeemed during the current live stream. The number counts against the `max_per_stream_setting` limit. This field is **null** if the broadcaster’s stream isn’t live or `max_per_stream_setting` isn’t enabled. */
		redemptions_redeemed_current_stream: number | null;
		/** The timestamp of when the cooldown period expires. Is **null** if the reward isn’t in a cooldown state (see the `global_cooldown_setting` field). */
		cooldown_expires_at: string | null;
	}];
}

/**
 * ## [Create Custom Rewards](https://dev.twitch.tv/docs/api/reference/#create-custom-rewards)
 * Creates a Custom Reward in the broadcaster’s channel. The maximum number of custom rewards per channel is 50, which includes both enabled and disabled rewards.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 OK|Successfully created the custom reward.
 * 400 Bad Request|The request exceeds the maximum number of rewards allowed per channel.
 * ㅤ|The `broadcaster_id` query parameter is required.
 * ㅤ|The `title` field is required.
 * ㅤ|The `title` must contain a minimum of 1 character and a maximum of 45 characters.
 * ㅤ|The `title` must be unique amongst all of the broadcaster's custom rewards.
 * ㅤ|The `cost` field is required.
 * ㅤ|The `cost` field must contain a minimum of 1 point.
 * ㅤ|The `prompt` field is limited to a maximum of 200 characters.
 * ㅤ|If `is_max_per_stream_enabled` is **true**, the minimum value for `max_per_stream` is 1.
 * ㅤ|If `is_max_per_user_per_stream_enabled` is **true**, the minimum value for `max_per_user_per_stream` is 1.
 * ㅤ|If `is_global_cooldown_enabled` is **true**, the minimum value for `global_cooldown_seconds` is 1.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * ㅤ|The user access token is missing the **channel:manage:redemptions** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "channel_points/custom_rewards", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
	});
	return global.fetch(url as any, {
		method: "POST",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
		body: JSON.stringify({
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
			should_redemptions_skip_request_queue: params.should_redemptions_skip_request_queue,
		}),
	});
}