import * as Main from "../..";

export interface Authentication {
	/**
	 * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).

	 * For example: For example: `"uo6dggojyb8d6soh92zknwmi5ej1q2"`
	 */
	client_id: string;
	/**
	 * String `"Bearer token"`, where:
	 * - `token` must be replaced by signed JSON Web Token (JWT) created by an Extension Backend Service (EBS). For signing requirements, see [Signing the JWT](https://dev.twitch.tv/docs/extensions/building/#signing-the-jwt). The signed JWT must include the `role`, `user_id`, and `exp` fields (see [JWT Schema](https://dev.twitch.tv/docs/extensions/reference/#jwt-schema)). The `role` field must be set to **external**.

	 * For example: `"Bearer cfabdegwdoklmawdzdo98xt2fo512y"`
	 */
	authorization: string;
}

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** The ID of the extension to get. */
	extension_id: string;
	/** The version of the extension to get. If not specified, it returns the latest, released version. If you don’t have a released version, you must specify a version; otherwise, the list is empty. */
	extension_version?: string;
}

export type RequestParameters = Authentication & RequestQueryParameters;

export interface ResponseBody {
	/** A list that contains the specified extension. */
	data: {
		/** The name of the user or organization that owns the extension. */
		author_name: string;
		/** A Boolean value that determines whether the extension has features that use Bits. Is **true** if the extension has features that use Bits. */
		bits_enabled: boolean;
		/**
		 * A Boolean value that determines whether a user can install the extension on their channel. Is **true** if a user can install the extension.

		 * Typically, this is set to **false** if the extension is currently in testing mode and requires users to be allowlisted (the allowlist is configured on Twitch’s [developer site](https://dev.twitch.tv/console/extensions) under the **Extensions** -> **Extension** -> **Version** -> **Access**).
		 */
		can_install: boolean;
		/**
		 * The location of where the extension’s configuration is stored. Possible values are:
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
		/**
		 * The extension’s state. Possible values are:
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
		state:
		| "Approved"
		| "AssetsUploaded"
		| "Deleted"
		| "Deprecated"
		| "InReview"
		| "InTest"
		| "PendingAction"
		| "Rejected"
		| "Released";
		/**
		 * Indicates whether the extension can view the user’s subscription level on the channel that the extension is installed on. Possible values are:
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
				/** **Integer**. The height, in pixels, of the panel component that the extension is rendered in. */
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
				/** **Integer**. The width value of the ratio (width : height) which determines the extension’s width, and how the extension’s iframe will resize in different video player environments. */
				aspect_ratio_x: number;
				/** **Integer**. The height value of the ratio (width : height) which determines the extension’s height, and how the extension’s iframe will resize in different video player environments. */
				aspect_ratio_y: number;
				/** A Boolean value that determines whether to apply CSS zoom. If **true**, a CSS zoom is applied such that the size of the extension is variable but the inner dimensions are fixed based on Scale Pixels. This allows your extension to render as if it is of fixed width and height. If **false**, the inner dimensions of the extension iframe are variable, meaning your extension must implement responsiveness. */
				autoscale: boolean;
				/** **Integer**. The base width, in pixels, of the extension to use when scaling (see `autoscale`). This value is ignored if `autoscale` is **false**. */
				scale_pixels: number;
				/** **Integer**. The height as a percent of the maximum height of a video component extension. Values are between 1% - 100%. */
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
	}[];
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "extensions", Main.Options.apiHelixPath);
	url.searchParams.appendMany({
		extension_id: params.extension_id,
		extension_version: params.extension_version,
	});
	return url;
}

export function makeFetchRequestInit(params: RequestParameters): RequestInit {
	return {
		method: "GET",
		headers: {
			"client-id": params.client_id,
			authorization: params.authorization,
		},
		signal: params.signal,
	};
}

/**
 * ## [Get Extensions](https://dev.twitch.tv/docs/api/reference/#get-extensions)
 * Gets information about an extension.

 * ### Response Codes
 * Code|Description
 * -|-
 * 200 OK|Successfully retrieved the list of extensions.
 * 400 Bad Request|The `extension_id` query parameter is required.
 * 401 Unauthorized|The request must specify the Authorization header.
 * ㅤ|The Authorization header is required and must specify a JWT token.
 * ㅤ|The JWT token is not valid.
 * ㅤ|The request must specify the Client-Id header.
 * 404 Not Found|The extension in the `extension_id` query parameter was not found.
 */
export async function fetch(params: RequestParameters): Promise<Main.Response<ResponseBody>> {
	return global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));
}