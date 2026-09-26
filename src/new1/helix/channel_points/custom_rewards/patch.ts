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
	/** The ID of the broadcaster that’s updating the reward. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/** The ID of the reward to update. */
	id: string;
}

/** The body of the request should contain only the fields you’re updating. */
export interface RequestBody {
	/** The reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards. */
	title?: string;
	/** The prompt shown to the viewer when they redeem the reward. Specify a prompt if `is_user_input_required` is **true**. The prompt is limited to a maximum of 200 characters. */
	prompt?: string;
	/** **64-bit Integer**. The cost of the reward, in channel points. The minimum is 1 point. */
	cost?: number;
	/** The background color to use for the reward. Specify the color using Hex format (for example, \#00E5CB). */
	background_color?: string;
	/** A Boolean value that indicates whether the reward is enabled. Set to **true** to enable the reward. Viewers see only enabled rewards. */
	is_enabled?: boolean;
	/** A Boolean value that determines whether users must enter information to redeem the reward. Set to **true** if user input is required. See the `prompt` field. */
	is_user_input_required?: boolean;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the `max_per_stream` field). Set to **true** to limit redemptions. */
	is_max_per_stream_enabled?: boolean;
	/** **64-bit Integer**. The maximum number of redemptions allowed per live stream. Applied only if `is_max_per_stream_enabled` is **true**. The minimum value is 1. */
	max_per_stream?: number;
	/** A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see `max_per_user_per_stream`). The minimum value is 1. Set to **true** to limit redemptions. */
	is_max_per_user_per_stream_enabled?: boolean;
	/** **64-bit Integer**. The maximum number of redemptions allowed per user per stream. Applied only if `is_max_per_user_per_stream_enabled` is **true**. */
	max_per_user_per_stream?: number;
	/** A Boolean value that determines whether to apply a cooldown period between redemptions. Set to **true** to apply a cooldown period. For the duration of the cooldown period, see `global_cooldown_seconds`. */
	is_global_cooldown_enabled?: boolean;
	/** **64-bit Integer**. The cooldown period, in seconds. Applied only if `is_global_cooldown_enabled` is **true**. The minimum value is 1; however, for it to be shown in the Twitch UX, the minimum value is 60. */
	global_cooldown_seconds?: number;
	/** A Boolean value that determines whether to pause the reward. Set to **true** to pause the reward. Viewers can’t redeem paused rewards.. */
	is_paused?: boolean;
	/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If **false**, status is set to UNFULFILLED and follows the normal request queue process. */
	should_redemptions_skip_request_queue?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters & RequestBody;

export interface ResponseBody {
	/** The list contains the single reward that you updated. */
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
		/** The prompt shown to the viewer when they redeem the reward if user input is required. See the `is_user_input_required` field. */
		prompt: string;
		/** **64-bit Integer**. The cost of the reward in Channel Points. */
		cost: number;
		/** A set of custom images for the reward. This field is **null** if the broadcaster didn’t upload images. */
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
		/** A Boolean value that determines whether the user must enter information when they redeem the reward. Is **true** if the user is prompted. */
		is_user_input_required: boolean;
		/** The settings used to determine whether to apply a maximum to the number of redemptions allowed per live stream. */
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
		};
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
		/** A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If **false**, status is set to UNFULFILLED and follows the normal request queue process. */
		should_redemptions_skip_request_queue: boolean;
		/** **Integer**. The number of redemptions redeemed during the current live stream. The number counts against the `max_per_stream_setting` limit. This field is **null** if the broadcaster’s stream isn’t live or `max_per_stream_setting` isn’t enabled. */
		redemptions_redeemed_current_stream: number | null;
		/** The timestamp of when the cooldown period expires. Is **null** if the reward isn’t in a cooldown state. See the `global_cooldown_setting` field. */
		cooldown_expires_at: string | null;
	}];
}

/**
 * ## [Update Custom Reward](https://dev.twitch.tv/docs/api/reference/#update-custom-reward)
 * Updates a custom reward. The app used to create the reward is the only app that may update the reward.

 * **NOTE**: The body of the request should contain only the fields you’re updating.

 * ### Response Codes
 * HTTP Code|Description
 * -|-
 * 200 OK|Successfully updated the custom reward.
 * 400 Bad Request|ul>
 * ㅤ|The `broadcaster_id` query parameter is required.
 * ㅤ|The `id` query parameter is required.
 * ㅤ|The `title` must contain a minimum of 1 character and a maximum of 45 characters.
 * ㅤ|The `title` must be unique amongst all of the broadcaster's custom rewards.
 * ㅤ|The `cost` field must contain a minimum of 1 point.
 * ㅤ|The `prompt` field is limited to a maximum of 200 characters.
 * ㅤ|If `is_max_per_stream_enabled` is **true**, the minimum value for `max_per_stream` is 1.
 * ㅤ|If `is_max_per_user_per_stream_enabled` is **true**, the minimum value for `max_per_user_per_stream` is 1.
 * ㅤ|If `is_global_cooldown_enabled` is **true**, the minimum value for `global_cooldown_seconds` is 1 and the maximum is 604800.
 * 401 Unauthorized|The Authorization header is required and must specify a user access token.
 * ㅤ|The user access token must include the **channel:manage:redemptions** scope.
 * ㅤ|The OAuth token is not valide.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The ID in the Client-Id header must match the client ID used to create the custom reward.
 * ㅤ|The broadcaster is not a partner or affiliate.
 * 404 Not Found|The custom reward specified in the `id` query parameter was not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "channel_points/custom_rewards", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		id: params.id,
	});
	return global.fetch(url as any, {
		method: "PATCH",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
		body: JSON.stringify({
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
			should_redemptions_skip_request_queue: params.should_redemptions_skip_request_queue,
		}),
	});
}