export interface URLSearchParams extends globalThis.URLSearchParams {
	/**
	 * - If **value** is `null`/`undefined`, method will do nothing.
	 * - If **value** is array:
	 *   - If entry is `null`/`undefined`, method will do nothing with that entry.
	 *   - Otherwise, entry will be appended as a new search parameter.
	 * - Otherwise, **value** will be appended as a new search parameter.
	 */
	append(name: string, value: URLSearchParams.Value): this;
	appendMany(params: Record<string, URLSearchParams.Value>): this;
}
export namespace URLSearchParams {
	export type Value = string | boolean | number | null | undefined | (string | boolean | number | null | undefined)[];
}

export class URL extends globalThis.URL {
	declare searchParams: URLSearchParams;

	constructor(url: string | URL, base?: string | URL) {
		super(url, base);
		(this.searchParams as any)._append = this.searchParams.append;
		this.searchParams.append = (name, value) => {
			if (value == null) return this.searchParams;

			if (Array.isArray(value)) {
				for (const v of value) {
					if (v != null)
						(this.searchParams as any)._append(name, `${encodeURIComponent(v)}`);
				}
			}
			else
				(this.searchParams as any)._append(name, `${encodeURIComponent(value)}`);

			return this.searchParams;
		};
		this.searchParams.appendMany = (params) => {
			for (const [name, value] of Object.entries(params)) {
				if (Array.isArray(value)) {
					for (const v of value) {
						if (v != null)
							this.searchParams.append(name, `${encodeURIComponent(v)}`);
					}
				}
				else if (value != null)
					this.searchParams.append(name, `${encodeURIComponent(value)}`);
			}

			return this.searchParams;
		};
	}

	castToDefaultURL(): globalThis.URL {
		return this;
	}
}

export type Response<ResponseJson, ResponseJsonError = undefined> = Response.OK<ResponseJson> | Response.NotOK<ResponseJsonError>;
export namespace Response {
	export interface OK<ResponseJson> extends globalThis.Response {
		ok: true;
		json(): Promise<ResponseJson>;
	}
	export interface NotOK<ResponseJson> extends globalThis.Response {
		ok: false;
		json(): Promise<ResponseJson>;
	}
}