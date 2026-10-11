const fs = require("fs");
const { JSDOM } = require("jsdom");
const readline = require("readline/promises");

const { readlineQuestion, addDescriptionLines, addTextToOutput, filePaths } = require("../create");

function make() {
	filePaths.output = "output.ts";
	fs.writeFileSync(filePaths.output, "");
	/** @type {Element[]} */
	const prevHeaders = [];
	const dom = new JSDOM(fs.readFileSync("input.html").toString(), "application/xhtml+xml");
	for (const element of dom.window.document.querySelector("html body").children) {
		console.log(element.nodeName, element.textContent.substring(0, 50));
		if (element.nodeName.match(/H(\d)/) != null)
			prevHeaders.push(element);
		if (element.nodeName === "BLOCKQUOTE" || element.nodeName === "P")
			addTextToOutput(`// ${element.textContent}`);
		else if (element.nodeName === "TABLE") {
			if (prevHeaders.length > 0) {
				for (let i = 0; i < prevHeaders.length - 1; i++)
					addTextToOutput(`// ${prevHeaders[i].textContent}`);
				
				addTextToOutput(`export interface ${prevHeaders[prevHeaders.length - 1].textContent.split(" ").map(v => v.substring(0, 1).toUpperCase() + v.substring(1)).join("")} {`);
				while (prevHeaders.length > 0)
					prevHeaders.pop();
			}
			else
				addTextToOutput(`export interface Unknown {`);

			const indexes = {
				name: -1,
				type: -1,
				required: -1,
				description: -1,
			};

			let i = 0;
			for (const th of element.querySelectorAll("thead tr th")) {
				const th_textContent_toLowerCase = th.textContent.toLowerCase();
				if (th_textContent_toLowerCase.includes("name") || th_textContent_toLowerCase.includes("field") || th_textContent_toLowerCase.includes("param"))
					indexes.name = i;
				if (th_textContent_toLowerCase.includes("type"))
					indexes.type = i;
				if (th_textContent_toLowerCase.includes("required"))
					indexes.required = i;
				if (th_textContent_toLowerCase.includes("description"))
					indexes.description = i;
				i++;
			}
			for (const tr of element.querySelectorAll("tbody tr")) {
				const tds = tr.querySelectorAll("td");
				const type = tds[indexes.type].textContent.toLowerCase().replaceAll(/\s/g, "");
				let text = `\t/** `;

				if (type === "integer" || type === "int")
					text += "**Integer**. ";
				else if (type === "unsigned integer")
					text += "**Unsigned Integer**. ";
				else if (type === "int64")
					text += "**64-bit Integer**. ";
				let severalLines = false;
				const nodes = Array.from(tds[indexes.description].childNodes).filter(el => el.parentElement === tr);
				if (nodes.length > 0) {
					for (const element2 of nodes) {
						function b(el) {
							if (el.nodeName === "#text")
								text += el.textContent;
							else if (el.nodeName === "BR") {
								text += `\n\n\t * `;
								severalLines = true;
							}
							else if (el.nodeName === "STRONG" || el.nodeName === "B" || el.nodeName === "SPAN")
								text += `**${el.textContent}**`;
							else if (el.nodeName === "A")
								text += `[${el.textContent}](${new URL(el.getAttribute("href"), "https://dev.twitch.tv/docs/eventsub/eventsub-reference").toString()})`;
							else if (el.nodeName === "EM" || el.nodeName === "CODE" || el.nodeName === "I")
								text += `\`${el.textContent}\``;
							else if (el.nodeName === "UL" || el.nodeName === "P")
								b(el);
							else if (el.nodeName === "LI") {
								severalLines = true;
								text += `\n\t * - `;
								b(el);
							}
						}
						b(element2);
					}
				}
				else
					text += tds[indexes.description].textContent;
				if (severalLines)
					text += `\t */`;
				else
					text += ` */`;
				text += `\n\t${tds[indexes.name].textContent.replaceAll(/\s/g, "")}`;
				if (indexes.required > -1)
					text += tds[indexes.required].textContent.toLowerCase() === "yes" ? ":" : "?:";
				else
					text += ":";
				text += " ";
				if (type === "integer" || type === "int" || type === "unsigned integer" || type === "int64")
					text += "number";
				else if (type === "bool")
					text += "boolean";
				else
					text += type;
				text += ";";
				addTextToOutput(text);
			}

			addTextToOutput(`}\n`);
		}
	}
}

/*async function main() {
	const rl = readline.createInterface({input: process.stdin, output: process.stdout});
	const html = await readlineQuestion(rl, null, null, "html: ");
	rl.close();
	make(html);
}*/

if (process.argv[1] === __filename) {
	//main().catch(console.error);
	make();
}