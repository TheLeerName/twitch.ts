export class URL extends global.URL {
	constructor(url, base) {
		super(url, base);
		this.searchParams.append = (name, value) => {
			if (value == null) return this.searchParams;

			if (Array.isArray(value)) {
				for (const v of value) {
					if (v != null)
						this.searchParams.append(name, `${encodeURIComponent(v)}`);
				}
			}
			else
				this.searchParams.append(name, `${encodeURIComponent(value)}`);

			return this.searchParams;
		};
		this.searchParams.appendMany = (params) => {
			if (value == null) return this.searchParams;

			for (const [name, value] of Object.entries(params)) {
				if (Array.isArray(value)) {
					for (const v of value) {
						if (v != null)
							this.searchParams.append(name, `${encodeURIComponent(v)}`);
					}
				}
				else
					this.searchParams.append(name, `${encodeURIComponent(value)}`);
			}

			return this.searchParams;
		};
	}
}