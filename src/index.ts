import axios, { AxiosError, AxiosRequestConfig } from "axios";

export namespace Options {
	export let apiPath = "https://api.twitch.tv/";
	export let apiHelixPath = `${apiPath}helix/`;
	export let idOAuth2Path = "https://id.twitch.tv/oauth2/";
	export let eventSubWSPath = "wss://eventsub.wss.twitch.tv/ws";
	/** Change this with `setTwitchCLIMode` */
	export let twitchCLIMode = false;
	/** https://dev.twitch.tv/docs/cli */
	export function setTwitchCLIMode(twitchCLIMode: boolean) {
		Options.twitchCLIMode = twitchCLIMode;
		if (twitchCLIMode) {
			Options.apiPath = "http://localhost:8080/";
			Options.apiHelixPath = `${Options.apiPath}mock/`;
			Options.idOAuth2Path = `${Options.apiPath}auth/`;
			Options.eventSubWSPath = "ws://127.0.0.1:8080/ws";
		}
		else {
			Options.apiPath = "https://api.twitch.tv/";
			Options.apiHelixPath = `${Options.apiPath}helix/`;
			Options.idOAuth2Path = "https://id.twitch.tv/oauth2/";
			Options.eventSubWSPath = "wss://eventsub.wss.twitch.tv/ws";
		}
	}
}

export interface RequestParameters {
	config?: AxiosRequestConfig;
}

export interface ResponseBodyError {
	/** HTTP error status code. */
	status: number;
	/** HTTP error message. */
	message: string;
}

export type Response<TData, TError extends ResponseBodyError> = 
| (TData &  {ok: true;  status: number;})
| (TError & {ok: false; status: number;});
export async function axiosRequest<TData, TError extends ResponseBodyError>(config: AxiosRequestConfig): Promise<Response<TData, TError>> {
	try {
		const response = await axios<TData>(config);
		return {ok: true, status: response.status, ...response.data};
	}
	catch(error) {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError;
			if (!axiosError.response)
				return {ok: false, status: 500, message: axiosError.message};
			if (typeof axiosError.response.data === "object")
				return {ok: false, status: axiosError.response.status, message: axiosError.message, ...axiosError.response.data};
			return {ok: false, status: axiosError.response.status, message: `${axiosError.response.data}`};
		}
		throw error;
	}
}

export * as OAuth2 from "./oauth2";
export { AxiosRequestConfig } from "axios";
export * as Helix from "./helix";
export * as EventSub from "./eventsub";