const fs = require("fs");

const Create = require("./create.js");
const { Counter } = require("../tests/index.js");

/**
 * 
 * @param {string} name 
 * @param {Record<string, string> | undefined} params 
 */
function recreate(name, params) {
	params ??= JSON.parse(fs.readFileSync(Create.filePaths.data).toString())[name];

	const counter = new Counter();
	const [method, url] = Create.makeMethodAndURL(params.method_and_url);
	Create.filePaths.output = `../src/helix/${url}/${method.toLowerCase()}.ts`;

	try {
		Create.create(name, {...params, url, method});
		console.log(`${Create.filePaths.output} (${counter.stamp()}ms)`);
	}
	catch(e) {
		console.error(e);
	}
}

if (process.argv[1] === __filename) {
	const name = process.argv.slice(2).join(" ");
	if (name.length > 1)
		recreate(name);
	else {
		const json = JSON.parse(fs.readFileSync(Create.filePaths.data).toString());
		for (const [name, params] of Object.entries(json))
			recreate(name, params);
	}
}