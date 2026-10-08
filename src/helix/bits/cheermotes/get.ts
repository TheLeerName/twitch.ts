import * as Main from "../../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by one of the following:
	 *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.
	 *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens). It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters {
	/**
	 * The ID of the broadcaster whose custom Cheermotes you want to get. Specify the broadcaster’s ID if you want to include the broadcaster’s Cheermotes in the response (not all broadcasters upload Cheermotes). If not specified, the response contains only global Cheermotes.

	 * If the broadcaster uploaded Cheermotes, the `type` field in the response is set to **channel_custom**.
	 */
	broadcaster_id?: string;
}

export type RequestParameters = Main.RequestParameters & Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** The list of Cheermotes. The list is in ascending order by the `order` field’s value. */
	data: {
		/** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. For example, if the prefix is “Cheer” and you want to cheer 100 Bits, the full Cheermote string is Cheer100. When the Cheermote string is entered in chat, Twitch converts it to the image associated with the Bits tier that was cheered. */
		prefix: string;
		/** A list of tier levels that the Cheermote supports. Each tier identifies the range of Bits that you can cheer at that tier level and an image that graphically identifies the tier level. */
		tiers: {
			/** **Integer**. The minimum number of Bits that you must cheer at this tier level. The maximum number of Bits that you can cheer at this level is determined by the required minimum Bits of the next tier level minus 1. For example, if `min_bits` is 1 and `min_bits` for the next tier is 100, the Bits range for this tier level is 1 through 99. The minimum Bits value of the last tier is the maximum number of Bits you can cheer using this Cheermote. For example, 10000. */
			min_bits: number;
			/**
			 * The tier level. Possible tiers are:
			 * - 1
			 * - 100
			 * - 500
			 * - 1000
			 * - 5000
			 * - 10000
			 * - 100000
			 */
			id: 1 | 100 | 500 | 1000 | 5000 | 10000 | 100000;
			/** The hex code of the color associated with this tier level (for example, #979797). */
			color: string;
			/** The animated and static image sets for the Cheermote. The dictionary of images is organized by theme, format, and size. The theme keys are `dark` and `light`. Each theme is a dictionary of formats: `animated` and `static`. Each format is a dictionary of sizes: 1, 1.5, 2, 3, and 4. The value of each size contains the URL to the image. */
			images: Record<"dark" | "light", Record<"animated" | "static", Record<"1" | "1.5" | "2" | "3" | "4", string>>>;
			/** A Boolean value that determines whether users can cheer at this tier level. */
			can_cheer: boolean;
			/** A Boolean value that determines whether this tier level is shown in the Bits card. Is **true** if this tier level is shown in the Bits card. */
			show_in_bits_card: boolean;
		}[];
		/**
		 * The type of Cheermote. Possible values are:
		 * - global_first_party — A Twitch-defined Cheermote that is shown in the Bits card.
		 * - global_third_party — A Twitch-defined Cheermote that is not shown in the Bits card.
		 * - channel_custom — A broadcaster-defined Cheermote.
		 * - display_only — Do not use; for internal use only.
		 * - sponsored — A sponsor-defined Cheermote. When used, the sponsor adds additional Bits to the amount that the user cheered. For example, if the user cheered Terminator100, the broadcaster might receive 110 Bits, which includes the sponsor's 10 Bits contribution.
		 */
		type: "global_first_party" | "global_third_party" | "channel_custom" | "display_only" | "sponsored";
		/** **Integer**. The order that the Cheermotes are shown in the Bits card. The numbers may not be consecutive. For example, the numbers may jump from 1 to 7 to 13. The order numbers are unique within a Cheermote type (for example, global_first_party) but may not be unique amongst all Cheermotes in the response. */
		order: number;
		/** The date and time, in RFC3339 format, when this Cheermote was last updated. */
		last_updated: string;
		/** A Boolean value that indicates whether this Cheermote provides a charitable contribution match during charity campaigns. */
		is_charitable: boolean;
	}[];
}

export type ResponseBodyError = Main.ResponseBodyError;

export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {
	return {
		baseURL: Main.Options.apiHelixPath,
		url: "bits/cheermotes",
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		params: {
			broadcaster_id: params.broadcaster_id,
		},
		...params.config,
	};
}

/**
 * ## [Get Cheermotes](https://dev.twitch.tv/docs/api/reference/#get-cheermotes)
 * Gets a list of Cheermotes that users can use to cheer Bits in any Bits-enabled channel’s chat room. Cheermotes are animated emotes that viewers can assign Bits to.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the Cheermotes.
 * 401 Unauthorized|The Authorization header is required and must specify an app access token or user access token.
 * ㅤ|The ID in the Client-Id header must match the Client ID in the OAuth token.
 */
export async function axiosRequest(params: RequestParameters): Promise<Main.Response<ResponseBody, ResponseBodyError>> {
	return Main.axiosRequest(prepareAxiosConfig(params));
}