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
		const match = content.match(/(\/\*\*\s \* ## \[.+\*\/).+export async function fetch\(params: RequestParameters\): Promise<Main\.Response<(.+)>> {.+((?:const url = new Main\.URL\(params\.apiPath \?\? ".+", Main\.Options\.apiHelixPath\);)(?:.+url\.searchParams\.appendMany\({.+}\);)?).+return global\.fetch\(url as any, ({.+method: ".+",.+headers: {.+"client-id": params\.client_id,.+authorization: params\.authorization,.+},.+signal: params\.signal,.+})\);/s);
		const [
			comment,
			responseBodyType,
			makeURLBody,
			makeFetchRequestInitBody,
		] = match.slice(1, 5);
		content = content.substring(0, match.index)
			+ `export function makeURL(params: RequestParameters) {\n\t${makeURLBody}\n\treturn url;\n}\n\n`
			+ `export function makeFetchRequestInit(params: RequestParameters): RequestInit {\n\treturn ${makeFetchRequestInitBody};\n}\n\n`
			+ `${comment}\nexport async function fetch(params: RequestParameters): Promise<Main.Response<${responseBodyType}>> {\n\treturn global.fetch(makeURL(params).castToDefaultURL(), makeFetchRequestInit(params));\n}`;

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