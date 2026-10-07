import * as Main from "../..";

export interface RequestQueryParameters extends Main.RequestQueryParameters {
	/** Your app’s [registered](https://dev.twitch.tv/docs/authentication/register-app) client ID. */
	client_id: string;
	/** Set to **true** to force the user to re-authorize your app’s access to their resources. The default is **false**. */
	force_verify?: boolean;
	/** Your app’s registered redirect URI. The authorization code is sent to this URI. */
	redirect_uri: string;
	/** A space-delimited list of scopes. The APIs that you’re calling will identify the scopes you must list. */
	scope?: string[];
	/** Although optional, you are **strongly** encouraged to pass a state string to help prevent [Cross-Site Request Forgery](https://datatracker.ietf.org/doc/html/rfc6749#section-10.12) (CSRF) attacks. The server returns this string to you in your redirect URI (see the `state` parameter in the fragment portion of the URI). If this string doesn’t match the state string that you passed, ignore the response. The state string should be randomly generated and unique for each OAuth request. */
	state?: string;
}

export type RequestParameters = RequestQueryParameters;

export type ResponseBody = ResponseBody.OK | ResponseBody.NotOK;
export namespace ResponseBody {
	export interface OK {
		error: undefined;
		error_description: undefined;

		code: string;
		scope: string[];
		state?: string;
	}
	export interface NotOK {
		code: undefined;
		scope: undefined;

		error: string;
		error_description: string;
		state?: string;
	}
}

export function makeURL(params: RequestParameters) {
	const url = new Main.URL(params.apiPath ?? "authorize", Main.Options.idOAuth2Path);
	url.searchParams.appendMany({
		client_id: params.client_id,
		force_verify: params.force_verify,
		redirect_uri: params.redirect_uri,
		response_type: "code",
		scope: params.scope != null ? params.scope.join(" ") : undefined,
		state: params.state,
	});
	return url;
}

export function parseRedirectURL(url: string | URL): ResponseBody {
	if (typeof url === "string")
		url = new URL(url);
	const obj: any = Object.fromEntries(url.searchParams);
	if (obj.code != null)
		obj.scope = obj.scope.split(" ").filter((s: string) => s.length > 1);
	return obj;
}