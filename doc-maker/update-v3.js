const fs = require("fs");

const Create = require("./create.js");

/**
 * 
 * @param {string} name 
 * @param {Record<string, string> | undefined} params 
 */
function updateV2(name, params) {
	params ??= JSON.parse(fs.readFileSync(Create.filePaths.data).toString())[name];

	const [method, url] = Create.makeMethodAndURL(params.method_and_url);
	const path = `../src/helix/${url}/${method.toLowerCase()}.ts`;
	console.log(path);
	let content = fs.readFileSync(path).toString();
	let hasCarriageReturn = false;
	if (content.includes("\r\n")) {
		content = content.replaceAll("\r\n", "\n");
		hasCarriageReturn = true;
	}

	try {
		content = content.replace("export interface RequestQueryParameters extends Main.RequestQueryParameters {", "export interface RequestQueryParameters {");
		content = content.replace("export type RequestParameters = ", "export type RequestParameters = Main.RequestParameters & ");
		const match = content.match(/export function makeURL\(params: RequestParameters\) {.+const url = new Main\.URL\(params\.apiPath \?\? (".+"), Main\.Options\.apiHelixPath\);(.+)return url;.+}.+export function makeFetchRequestInit\(params: RequestParameters\): RequestInit {.+return {.+(method: ".+",).+(headers: {.+},).+signal: params\.signal,(.+)};.+}.+(\/\*\*\s \* ## \[.+\*\/).+export async function fetch\(params: RequestParameters\): Promise<Main\.Response<(.+)>> {.+return global\.fetch\(makeURL\(params\).castToDefaultURL\(\), makeFetchRequestInit\(params\)\);.+}/s);
		let [
			url,
			params,
			method,
			headers,
			body,
			comment,
			responseBodyType,
		] = match.slice(1, 8);

		const matchParams = params.match(/url\.searchParams\.appendMany\(({.+})\);/s);
		params = matchParams != null ? `\t\tparams: ${matchParams[1].replaceAll("\t\t", "\t\t\t").replace("\t}", "\t\t}")},\n` : "";

		const matchBody = body.match(/body(: JSON\.stringify\({.+}\),)/s);
		body = matchBody != null ? `\t\tdata${matchBody[1]}\n` : "";

		content = content.substring(0, match.index)
			+ `export type ResponseBodyError = Main.ResponseBodyError;\n\n`
			+ `export function prepareAxiosConfig(params: RequestParameters): Main.AxiosRequestConfig {\n`
			+ `\treturn {\n`
			+ `\t\tbaseURL: Main.Options.apiHelixPath,\n`
			+ `\t\turl: ${url},\n`
			+ `\t\t${method}\n`
			+ `\t\t${headers}\n`
			+ params
			+ body
			+ `\t\t...params.config,\n`
			+ `\t};\n`
			+ `}\n\n`
			+ comment + `\n`
			+ `export async function axiosRequest(params: RequestParameters): Promise<Main.Response<${responseBodyType.includes("undefined") ? "{}" : responseBodyType}, ResponseBodyError>> {\n`
			+ `\treturn Main.axiosRequest(prepareAxiosConfig(params));\n`
			+ `}`;

		if (hasCarriageReturn)
			content = content.replaceAll("\n", "\r\n");
		fs.writeFileSync(path, content);
	}
	catch(e) {
		console.log(`Failed: ${e}`);
	}
}

if (process.argv[1] === __filename) {
	const name = process.argv.slice(2).join(" ");
	if (name.length > 1)
		updateV2(name);
	else {
		const json = JSON.parse(fs.readFileSync(Create.filePaths.data).toString());
		for (const [name, params] of Object.entries(json))
			updateV2(name, params);
	}
}