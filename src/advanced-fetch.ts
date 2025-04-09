export interface AdvancedRequestInit extends RequestInit {
	/** URL search/query parameters */
	search?: Record<string, string | number | undefined>;
	/** URL hash/fragment parameters */
	hash?: Record<string, string | number | undefined>;
	/** If `timeout < 0`, RequestTimeout will be disabled */
	timeout?: number;
}
/**
 * Basic `fetch()` function, but with some improvements:
 * - `init.search`  - URL search/query parameters
 * - `init.hash`    - URL hash/fragment parameters
 * - `init.timeout` - time in milliseconds after which request will be aborted with reason `RequestTimeout`
 */
export function AdvancedFetch(input: string, init?: AdvancedRequestInit): Promise<Response> {
	if (!init) init = {};
	var timeout = GlobalTimeout;

	if (init.search) {
		var postfix = "?";
		var added = false;
		for (let [k, v] of Object.entries(init.search)) if (v) {
			postfix += encodeURI(`${k}=${v}&`);
			added = true;
		}
		if (added)
			input += postfix.substring(0, postfix.length - 1);
		delete init.search;
	}
	if (init.hash) {
		var postfix = "#";
		var added = false;
		for (let [k, v] of Object.entries(init.hash)) if (v) {
			input += encodeURI(`${k}=${v}&`);
			added = true;
		}
		if (added)
			input += postfix.substring(0, postfix.length - 1);
		delete init.hash;
	}
	if (init.timeout) {
		timeout = init.timeout;
		delete init.timeout;
	}
	if (timeout > 0 && !init.signal) {
		const controller = new AbortController();
		init.signal = controller.signal;
		setTimeout(() => controller.abort("RequestTimeout"), timeout);
	}

	return fetch(input, init);
}

/** in milliseconds */
export var GlobalTimeout = 5000;