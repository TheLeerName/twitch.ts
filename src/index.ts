export namespace Options {
	export let apiHelixPath = "https://api.twitch.tv/helix/";
	export let idOAuth2Path = "https://id.twitch.tv/oauth2/";
	export let eventSubWSPath = "wss://eventsub.wss.twitch.tv/ws";
	/** Change this with `setTwitchCLIMode` */
	export let twitchCLIMode = false;
	/** https://dev.twitch.tv/docs/cli */
	export function setTwitchCLIMode(twitchCLIMode: boolean) {
		Options.twitchCLIMode = twitchCLIMode;
		if (twitchCLIMode) {
			Options.apiHelixPath = "http://localhost:8080/mock/";
			Options.idOAuth2Path = "http://localhost:8080/auth/";
			Options.eventSubWSPath = "ws://127.0.0.1:8080/ws";
		}
		else {
			Options.apiHelixPath = "https://api.twitch.tv/helix/";
			Options.idOAuth2Path = "https://id.twitch.tv/oauth2/";
			Options.eventSubWSPath = "wss://eventsub.wss.twitch.tv/ws";
		}
	}
}

export interface RequestQueryParameters {
	/** If specified, API endpoint path will be changed to this value */
	apiPath?: string;
	/** An AbortSignal to set request's signal. */
	signal?: AbortSignal;
}

export * as OAuth2 from "./oauth2";
export * as Helix from "./helix";
export { URL, URLSearchParams, Response } from "./url";