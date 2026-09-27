import { Options, Helix } from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens) that includes scopes `channel:read:redemptions` or `channel:manage:redemptions`. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Helix.RequestQueryParameters {
	/** The ID of the broadcaster whose custom rewards you want to get. This ID must match the user ID found in the OAuth token. */
	broadcaster_id: string;
	/**
	 * A list of IDs to filter the rewards by. You may specify a maximum of 50 IDs.

	 * Duplicate IDs are ignored. The response contains only the IDs that were found. If none of the IDs were found, the response is 404 Not Found.
	 */
	id?: string | string[];
	/** A Boolean value that determines whether the response contains only the custom rewards that the app may manage (the app is identified by the ID in the Client-Id header). Set to **true** to get only the custom rewards that the app may manage. The default is **false**. */
	only_manageable_rewards?: boolean;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list of custom rewards. The list is in ascending order by `id`. If the broadcaster hasn’t created custom rewards, the list is empty. */
	data: {
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
		/** A Boolean value that determines whether the user must enter information when redeeming the reward. Is **true** if the user is prompted. */
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
	}[];
}

/**
 * ## [Get Custom Reward](https://dev.twitch.tv/docs/api/reference/#get-custom-reward)
 * Gets a list of custom rewards that the specified broadcaster created.

 * **NOTE**: A channel may offer a maximum of 50 rewards, which includes both enabled and disabled rewards.

 * ### Response Codes
 * HTTP Code|Meaning
 * -|-
 * 200 OK|Successfully retrieved the broadcaster’s list of custom rewards.
 * 400 Bad Request|The `broadcaster_id` query parameter is required.
 * ㅤ|The request exceeds the maximum number of `id` query parameters that you may specify.
 * 401 Unauthorized|The Authorization header must specify a user access token.
 * ㅤ|The user access token must include the **channel:read:redemptions** scope.
 * ㅤ|The OAuth token is not valid.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 * 403 Forbidden|The broadcaster is not a partner or affiliate.
 * 404 Not Found|All of the custom rewards specified using the `id` query parameter were not found.
 * 500 Internal Server Error|An internal server error occurred. Please report this issue on [our issue tracker](https://github.com/twitchdev/issues/).
 */
export async function fetch(params: RequestParameters): Promise<Helix.Response<ResponseBody>> {
	const url = new Helix.URL(params.apiPath ?? "channel_points/custom_rewards", Options.apiHelixPath);
	url.searchParams.appendMany({
		broadcaster_id: params.broadcaster_id,
		id: params.id,
		only_manageable_rewards: params.only_manageable_rewards,
	});
	return global.fetch(url as any, {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	});
}