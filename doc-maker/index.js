import fs from "fs";
import readline from "readline/promises";
import { JSDOM } from "jsdom";

/*

cd doc-maker
node index.js
1. copypaste endpoint name
2. copypaste <p>'s after name and until authorization or smth else
3. check requiring tokens and scopes
4. insert request query table if any
5. insert request body table if any
6. insert response body table if any
7. insert response codes table if any

*/

const scriptFileNameWithoutExt = (() => {
	let filename = import.meta.filename.replaceAll("\\", "/");
	filename = filename.substring(filename.lastIndexOf("/") + 1);
	filename = filename.substring(0, filename.indexOf("."));
	return filename;
})();
let outputFileNameWithoutExt = "../src/new1/helix/";

/**
 * 
 * @param {string} text 
 */
function addTextToOutput(text) {
	const content = fs.existsSync(outputFileNameWithoutExt + ".ts") ? fs.readFileSync(outputFileNameWithoutExt + ".ts").toString() : "";
	fs.writeFileSync(outputFileNameWithoutExt + ".ts", content + "\n" + text);
}

/**
 * 
 * @param {string | null} endpointName 
 * @param {string} fieldName 
 * @returns {string}
 */
function getFieldFromJSON(endpointName, fieldName) {
	const content = fs.existsSync(scriptFileNameWithoutExt + ".json") ? fs.readFileSync(scriptFileNameWithoutExt + ".json").toString() : "{}";
	const json = JSON.parse(content);
	return endpointName != null ? json[endpointName]?.[fieldName] : json[fieldName];
}

/**
 * 
 * @param {string | null} endpointName 
 * @param {string} fieldName 
 * @param {string} value 
 */
function saveFieldFromJSON(endpointName, fieldName, value) {
	const content = fs.existsSync(scriptFileNameWithoutExt + ".json") ? fs.readFileSync(scriptFileNameWithoutExt + ".json").toString() : "{}";
	const json = JSON.parse(content);
	value = value.replaceAll(/> +</g, "><");
	if (endpointName != null) {
		json[endpointName] ??= {};
		json[endpointName][fieldName] = value;
	}
	else
		json[fieldName] = value;
	fs.writeFileSync(scriptFileNameWithoutExt + ".json", JSON.stringify(json));
}

/**
 * 
 * @param {readline.Interface} rl
 * @param {string | null} endpointName 
 * @param {string | null} fieldName 
 * @param {string} text 
 * @returns {Promise<string>}
 */
async function readlineQuestion(rl, endpointName, fieldName, text) {
	const useValues = endpointName != null && fieldName != null;
	if (useValues) {
		const fieldValue = getFieldFromJSON(endpointName, fieldName);
		if (fieldValue != null)
			rl.write(fieldValue);
	}
	const v = await rl.question(text);
	if (useValues)
		saveFieldFromJSON(endpointName, fieldName, v);
	return v;
}

/**
 * 
 * @param {boolean} appAccessTokenRequired 
 * @param {boolean} userAccessTokenRequired 
 * @param {string} scopesText 
 */
function makeAuthenticationAuthorizationDescription(userAccessTokenRequired, appAccessTokenRequired, scopesText) {
	if (scopesText.length > 0)
		scopesText = ` that includes scope${scopesText.includes(" ") ? "s" : ""} ${scopesText}`;

	if (userAccessTokenRequired && appAccessTokenRequired) {
		addTextToOutput(`\t * - \`token\` must be replaced by one of the following:`);
		addTextToOutput(`\t *   - An [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)${scopesText}. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.`);
		addTextToOutput(`\t *   - An [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)${scopesText}. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.`);
	}
	else if (userAccessTokenRequired)
		addTextToOutput(`\t * - \`token\` must be replaced by [user access token](https://dev.twitch.tv/docs/authentication#user-access-tokens)${scopesText}. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.`);
	else
		addTextToOutput(`\t * - \`token\` must be replaced by [app access token](https://dev.twitch.tv/docs/authentication#app-access-tokens)${scopesText}. It must belong to [developer app](https://dev.twitch.tv/docs/authentication/register-app/) specified in {@link client_id}.`);
}

/**
 * 
 * @param {boolean} userAccessTokenRequired 
 * @param {boolean} appAccessTokenRequired 
 * @param {string} scopesText 
 */
function makeAuthentication(userAccessTokenRequired, appAccessTokenRequired, scopesText) {
	addTextToOutput(``);
	addTextToOutput(`export interface Authentication {`);
	addTextToOutput(`\t/**`);
	addTextToOutput(`\t * ID of [developer app](https://dev.twitch.tv/docs/authentication/register-app/).`);
	addTextToOutput(``);
	addTextToOutput(`\t * For example: For example: \`"uo6dggojyb8d6soh92zknwmi5ej1q2"\``);
	addTextToOutput(`\t */`);
	addTextToOutput(`\tclient_id: string;`);

	addTextToOutput(`\t/**`);
	addTextToOutput(`\t * String \`"Bearer token"\`, where:`);

	makeAuthenticationAuthorizationDescription(userAccessTokenRequired, appAccessTokenRequired, scopesText);

	addTextToOutput(``);
	addTextToOutput(`\t * For example: \`"Bearer cfabdegwdoklmawdzdo98xt2fo512y"\``);
	addTextToOutput(`\t */`);
	addTextToOutput(`\tauthorization: string;`);

	addTextToOutput(`}`);
}

/**
 * @param {HTMLTableCellElement} cell 
 * @param {string[]} descriptionLines 
 * @param {number} i 
 */
function addDescriptionLines(cell, descriptionLines, i) {
	if (cell.childNodes == null) {
		if (!descriptionLines[i])
			descriptionLines[i] = "";

		descriptionLines[i] += cell.textContent;
		i++;
		return i;
	}

	for (const el of cell.childNodes) {
		if (!descriptionLines[i])
			descriptionLines[i] = "";

		if (el.nodeName === "#text")
			descriptionLines[i] += el.textContent;
		else if (el.nodeName === "BR")
			i++;
		else if (el.nodeName === "STRONG" || el.nodeName === "B" || el.nodeName === "SPAN")
			descriptionLines[i] += `**${el.textContent}**`;
		else if (el.nodeName === "A")
			descriptionLines[i] += `[${el.textContent}](${new URL(el.getAttribute("href"), "https://dev.twitch.tv/docs/api/reference").toString()})`;
		else if (el.nodeName === "EM" || el.nodeName === "CODE" || el.nodeName === "I")
			descriptionLines[i] += `\`${el.textContent}\``;
		else if (el.nodeName === "UL" || el.nodeName === "P")
			i = addDescriptionLines(el, descriptionLines, i);
		else if (el.nodeName === "LI") {
			if (descriptionLines[i] !== "") {
				descriptionLines.push(`- `);
				i++;
			}
			else
				descriptionLines[i] += `- `;
			i = addDescriptionLines(el, descriptionLines, i);
		}
		else {
			throw new Error(`unknown nodeName: ${el.nodeName}`);
		}
	}
	return i;
}

/**
 * 
 * @param {string} requestQueryParametersHTML 
 * @returns {string[]}
 */
function makeRequestQueryParameters(requestQueryParametersHTML) {
	const params = [];
	if (requestQueryParametersHTML.length < 1)
		return params;

	addTextToOutput(``);
	addTextToOutput(`export interface RequestQueryParameters extends Helix.RequestQueryParameters {`);

	const dom = new JSDOM(requestQueryParametersHTML, "application/xhtml+xml");
	for (const tr of dom.window.document.querySelectorAll("table tbody tr")) {
		const tds = tr.querySelectorAll("td");
		if (tds.length < 4)
			throw new Error(`table.tbody.tr[${Array.from(tr.parentElement.children).indexOf(tr)}].td.length is ${tds.length} (must be < 4)`);

		let descriptionPrefix = "";
		let fieldDeclaration = "";

		tds[0].textContent = tds[0].textContent.replaceAll(/[  ]+/g, "\t");
		params.push(tds[0].textContent.replaceAll("\t", "").replaceAll(" ", ""));
		fieldDeclaration += tds[0].textContent;
		fieldDeclaration += tds[2].textContent === "Yes" ? ":" : "?:";

		const tds_1_textlower = tds[1].textContent.toLowerCase();
		if (tds_1_textlower === "float")
			fieldDeclaration += " number;";
		else if (tds_1_textlower === "integer") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**Integer**. ";
		}
		else if (tds_1_textlower === "unsigned integer") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**Unsigned Integer**. ";
		}
		else if (tds_1_textlower === "int64") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**64-bit Integer**. ";
		}
		else
			fieldDeclaration += ` ${tds_1_textlower};`;

		const descriptionLines = [];
		addDescriptionLines(tds[3], descriptionLines, descriptionLines.length);
		descriptionLines[0] = descriptionPrefix + descriptionLines[0];

		if (descriptionLines.length > 1) {
			addTextToOutput(`\t/**`);
			for (const line of descriptionLines)
				addTextToOutput(line.length > 0 ? `\t * ${line}` : "");
			addTextToOutput(`\t */`);
		}
		else
			addTextToOutput(`\t/** ${descriptionLines[0]} */`);
		addTextToOutput(`\t${fieldDeclaration}`);
	}

	addTextToOutput(`}`);

	return params;
}

/**
 * 
 * @param {string} requestBodyHTML 
 * @returns {string[]}
 */
function makeRequestBody(requestBodyHTML) {
	const params = [];
	if (requestBodyHTML.length < 1)
		return params;

	addTextToOutput(``);
	addTextToOutput(`export interface RequestBody {`);

	const dom = new JSDOM(requestBodyHTML, "application/xhtml+xml");
	for (const tr of dom.window.document.querySelectorAll("table tbody tr")) {
		const tds = tr.querySelectorAll("td");
		if (!(tds.length === 3 || tds.length === 4))
			throw new Error(`table.tbody.tr[${Array.from(tr.parentElement.children).indexOf(tr)}].td.length is ${tds.length} (must be 3 or 4)`);

		let descriptionPrefix = "";
		let fieldDeclaration = "";

		tds[0].textContent = tds[0].textContent.replaceAll(/[  ]+/g, "\t");
		params.push(tds[0].textContent.replaceAll("\t", "").replaceAll(" ", ""));
		if (tds.length === 3) {
			fieldDeclaration += tds[0].textContent + ":";
		}
		else {
			fieldDeclaration += tds[0].textContent;
			fieldDeclaration += tds[2].textContent === "Yes" ? ":" : "?:";
		}

		const tds_1_textlower = tds[1].textContent.toLowerCase();
		if (tds_1_textlower === "float")
			fieldDeclaration += " number;";
		else if (tds_1_textlower === "integer") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**Integer**. ";
		}
		else if (tds_1_textlower === "unsigned integer") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**Unsigned Integer**. ";
		}
		else if (tds_1_textlower === "int64") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**64-bit Integer**. ";
		}
		else
			fieldDeclaration += ` ${tds_1_textlower};`;

		const descriptionLines = [];
		addDescriptionLines(tds[tds.length === 3 ? 2 : 3], descriptionLines, descriptionLines.length);
		descriptionLines[0] = descriptionPrefix + descriptionLines[0];

		if (descriptionLines.length > 1) {
			addTextToOutput(`\t/**`);
			for (const line of descriptionLines)
				addTextToOutput(line.length > 0 ? `\t * ${line}` : "");
			addTextToOutput(`\t */`);
		}
		else
			addTextToOutput(`\t/** ${descriptionLines[0]} */`);
		addTextToOutput(`\t${fieldDeclaration}`);
	}

	addTextToOutput(`}`);

	return params;
}

/**
 * 
 * @param {string[]} requestQueryParameters 
 * @param {string[]} requestBody 
 */
function makeRequestParameters(requestQueryParameters, requestBody) {
	addTextToOutput(``);
	addTextToOutput(`export type RequestParameters = Authentication & ${requestQueryParameters.length > 0 ? "RequestQueryParameters" : "Helix.RequestQueryParameters"}${requestBody.length > 0 ? " & RequestBody" : ""};`);
}

/**
 * 
 * @param {string} responseBodyHTML 
 */
 function makeResponseBody(responseBodyHTML) {
	if (responseBodyHTML.length < 1)
		return false;

	addTextToOutput(``);
	addTextToOutput(`export interface ResponseBody {`);

	const dom = new JSDOM(responseBodyHTML, "application/xhtml+xml");
	for (const tr of dom.window.document.querySelectorAll("table tbody tr")) {
		const tds = tr.querySelectorAll("td");
		if (tds.length < 3)
			throw new Error(`table.tbody.tr[${Array.from(tr.parentElement.children).indexOf(tr)}].td.length is ${tds.length} (must be < 3)`);

		let descriptionPrefix = "";
		let fieldDeclaration = "";

		tds[0].textContent = tds[0].textContent.replaceAll(/[  ]+/g, "\t");
		fieldDeclaration += tds[0].textContent + ":";

		const tds_1_textlower = tds[1].textContent.toLowerCase();
		if (tds_1_textlower === "float")
			fieldDeclaration += " number;";
		else if (tds_1_textlower === "integer") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**Integer**. ";
		}
		else if (tds_1_textlower === "unsigned integer") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**Unsigned Integer**. ";
		}
		else if (tds_1_textlower === "int64") {
			fieldDeclaration += " number;";
			descriptionPrefix += "**64-bit Integer**. ";
		}
		else
			fieldDeclaration += ` ${tds_1_textlower};`;

		const descriptionLines = [];
		addDescriptionLines(tds[2], descriptionLines, descriptionLines.length);
		descriptionLines[0] = descriptionPrefix + descriptionLines[0];

		if (descriptionLines.length > 1) {
			addTextToOutput(`\t/**`);
			for (const line of descriptionLines)
				addTextToOutput(line.length > 0 ? `\t * ${line}` : "");
			addTextToOutput(`\t */`);
		}
		else
			addTextToOutput(`\t/** ${descriptionLines[0]} */`);
		addTextToOutput(`\t${fieldDeclaration}`);
	}

	addTextToOutput(`}`);

	return true;
}

/**
 * 
 * @param {string} endpointName 
 * @param {string[]} pTexts 
 * @param {string} responseCodesHTML 
 * @param {boolean} isResponseBody 
 * @param {string} url 
 * @param {string[]} requestQueryParameters 
 * @param {string} method 
 * @param {string[]} requestBody 
 */
function makeFetch(endpointName, pTexts, responseCodesHTML, isResponseBody, url, requestQueryParameters, method, requestBody) {
	const apiDocsURL = `https://dev.twitch.tv/docs/api/reference/#${endpointName.toLowerCase().replaceAll(" ", "-")}`;

	addTextToOutput(``);
	addTextToOutput(`/**`);
	addTextToOutput(` * ## [${endpointName}](${apiDocsURL})`);

	for (const pText of pTexts) {
		const p = new JSDOM(pText, "application/xhtml+xml").window.document.querySelector("p");
		const descriptionLines = [];
		addDescriptionLines(p, descriptionLines, descriptionLines.length);
		for (const line of descriptionLines)
			addTextToOutput(line.length > 0 ? ` * ${line}\n` : "");
	}

	if (responseCodesHTML.length > 0) {
		addTextToOutput(` * ### Response Codes`);
		const dom = new JSDOM(responseCodesHTML, "application/xhtml+xml");
		const ths = dom.window.document.querySelectorAll("table thead tr th");
		addTextToOutput(` * ${Array.from(ths).map(th => th.textContent).join("|")}`);
		addTextToOutput(` * ${Array.from(Array(ths.length), _ => "-").join("|")}`);
		for (const tr of dom.window.document.querySelectorAll("table tbody tr")) {
			let code = tr.children[0];
			const description = tr.children[1];

			if (description.childNodes) {
				const descriptionLines = [];
				addDescriptionLines(description, descriptionLines, descriptionLines.length);
				for (const line of descriptionLines) {
					addTextToOutput(` * ${code?.textContent ?? "ㅤ"}|${line.startsWith("- ") ? line.substring(2) : line}`);
					code = null;
				}
			}
			else
				addTextToOutput(` * ${code.textContent}|${description.textContent}`);
		}
	}

	addTextToOutput(` */`);

	addTextToOutput(`export async function fetch(params: RequestParameters): Promise<Helix.Response<${isResponseBody ? "ResponseBody" : "undefined"}>> {`);
	addTextToOutput(`\tconst url = new Helix.URL(params.apiPath ?? "${url}", Options.apiHelixPath);`);
	if (requestQueryParameters.length > 0) {
		addTextToOutput(`\turl.searchParams.appendMany({`);
		for (const param of requestQueryParameters)
			addTextToOutput(`\t\t${param}: params.${param},`);
		addTextToOutput(`\t});`);
	}
	addTextToOutput(`\treturn global.fetch(url as any, {`);
	addTextToOutput(`\t\tmethod: "${method}",`);
	addTextToOutput(`\t\theaders: {`);
	addTextToOutput(`\t\t\t"client-id": params.client_id,`);
	addTextToOutput(`\t\t\tauthorization: params.authorization,`);
	if (requestBody.length > 0)
		addTextToOutput(`\t\t\t"content-type": "application/json",`);
	addTextToOutput(`\t\t},`);
	addTextToOutput(`\t\tsignal: params.signal,`);
	if (requestBody.length > 0) {
		addTextToOutput(`\t\tbody: JSON.stringify({`);
		for (const param of requestBody)
			addTextToOutput(`\t\t\t${param}: params.${param},`);
		addTextToOutput(`\t\t}),`);
	}
	addTextToOutput(`\t});`);
	addTextToOutput(`}`);
}

async function main() {
	const rl = readline.createInterface({input: process.stdin, output: process.stdout});
	const endpointName = await readlineQuestion(rl, null, null, "endpointName: ");

	const pTexts = await (async() => {
		/** @type {string[]} */
		const pTexts = [];
		while(true) {
			const pText = await readlineQuestion(rl, endpointName, `p_${pTexts.length}`, `html p ${pTexts.length} (leave empty to stop adding it): `);
			if (pText.length < 1) break;

			pTexts.push(pText);
		}
		return pTexts;
	})();
	const userAccessTokenRequired = await readlineQuestion(rl, endpointName, "userAccessTokenRequired", "userAccessTokenRequired (y/n): ");
	const appAccessTokenRequired = await readlineQuestion(rl, endpointName, "appAccessTokenRequired", "appAccessTokenRequired (y/n): ");
	const scopesText = await (async() => {
		const text = await readlineQuestion(rl, endpointName, "scopes", "scopes: ");
		return (text.length > 0 ? text.split(" ") : []).map(scopeOrSeparator => scopeOrSeparator.includes(":") ? `\`${scopeOrSeparator}\`` : scopeOrSeparator).join(" ");
	})();
	let [method, url] = await (async() => {
		const params = (await readlineQuestion(rl, endpointName, "method_and_url", "method_and_url (like POST https://api.twitch.tv/helix/channel_points/custom_rewards): ")).split(" ");
		params[1] = params[1].substring(28);
		return params;
	})();
	const requestQueryParametersHTML = await readlineQuestion(rl, endpointName, "requestQueryParametersHTML", "requestQueryParametersHTML (leave empty to not add it): ");
	const requestBodyHTML = await readlineQuestion(rl, endpointName, "requestBodyHTML", "requestBodyHTML (leave empty to not add it): ");
	const responseBodyHTML = await readlineQuestion(rl, endpointName, "responseBodyHTML", "responseBodyHTML (leave empty to not add it): ");
	const responseCodesHTML = await readlineQuestion(rl, endpointName, "responseCodesHTML", "responseCodesHTML (leave empty to not add it): ");
	rl.close();

	outputFileNameWithoutExt += url;
	if (!fs.existsSync(outputFileNameWithoutExt))
		fs.mkdirSync(outputFileNameWithoutExt, {recursive: true});
	outputFileNameWithoutExt += "/" + method.toLowerCase();

	fs.writeFileSync(outputFileNameWithoutExt + ".ts", `import { Options, Helix } from "../${url.replaceAll(/[\w_]+/g, "..")}";`);
	makeAuthentication(userAccessTokenRequired, appAccessTokenRequired, scopesText);
	const requestQueryParameters = makeRequestQueryParameters(requestQueryParametersHTML);
	const requestBody = makeRequestBody(requestBodyHTML);
	makeRequestParameters(requestQueryParameters, requestBody);
	const isResponseBody = makeResponseBody(responseBodyHTML);
	makeFetch(endpointName, pTexts, responseCodesHTML, isResponseBody, url, requestQueryParameters, method, requestBody);

	const newString = `\nexport * as ${endpointName.replaceAll(" ", "").replaceAll("-", "")} from "./${url}/${method.toLowerCase()}";`;
	const content = fs.readFileSync("../src/new1/helix/index.d.ts").toString();
	if (content.substring(content.lastIndexOf("\n")) !== newString)
		fs.writeFileSync("../src/new1/helix/index.d.ts", content + newString);
}
main().catch(console.error);