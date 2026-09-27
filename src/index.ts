import * as Helix from "./helix";
/*
Helix.WarnChatUser.fetch({
	client_id: "",
	authorization: "Bearer jlkkl;sxdfgjk;dflsjkl;fsdgjkl;sdfg",
	broadcaster_id: "2123",
	moderator_id: "21312",
	user_id: "3123",
	reason: "213"
}).then(r => r.json()).then(r => r.data[0].);*/

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

export * as Helix from "./helix";