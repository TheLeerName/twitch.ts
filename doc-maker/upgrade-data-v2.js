const fs = require("fs");

const Create = require("./create.js");

const json = JSON.parse(fs.readFileSync(Create.filePaths.data).toString());
for (const [name, params] of Object.entries(json)) {
	console.log(name);
	for (const paramName of Object.keys(params)) {
		//console.log(paramName);
		let match = paramName.match(/^p_(\d+)/);
		if (match != null) {
			const index = parseInt(match[1]);
			if (params[paramName].length > 0) {
				params.pTexts ??= [];
				params.pTexts[index] = params[paramName];
			}
			delete params[`p_${index}`];
		}
	}
}
fs.writeFileSync(Create.filePaths.data, JSON.stringify(json));