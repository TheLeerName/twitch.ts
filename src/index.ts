import axios, { AxiosError, AxiosRequestConfig } from "axios";

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
			const axiosError = error as AxiosError<TError>;
			return {ok: false, ...axiosError.response?.data ?? {status: axiosError.response?.status ?? 500, message: axiosError.message}};
		}
		throw error;
	}
}

export * as OAuth2 from "./oauth2";
export { AxiosRequestConfig } from "axios";
//export * as Helix from "./helix";
//export { URL, URLSearchParams, Response } from "./url";