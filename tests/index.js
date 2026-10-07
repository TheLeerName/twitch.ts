// @ts-check

const dotenv = require("dotenv");
const readline = require("readline/promises");
const { z } = require("zod");

function getEnvVariables() {
	const envSchema = z.object({
		CLIENT_ID: z.string().nonempty(),
		CLIENT_SECRET: z.string().nonempty(),
		REDIRECT_URI: z.url({protocol: /^http$/, hostname: /localhost/}).nonempty()
	});

	dotenv.config({quiet: true});
	let _env = envSchema.safeParse(process.env);
	if (!_env.success) {
		console.error(`Invalid .env variables:`);
		for (const error of JSON.parse(_env.error.message))
			console.error(`- ${error.path.join(", ")} - ${error.message}`);
		process.exit(1);
	}
	return _env.data;
}

class Counter {
	/** @type {number} */
	time;

	constructor() {
		this.time = this.reset();
	}

	reset() {
		return this.time = Date.now();
	}
	stamp() {
		return Date.now() - this.time;
	}
}

/**
 * 
 * @param {ReturnType<typeof getEnvVariables>} env 
 */
async function main(env) {
	console.log("0. Exit");
	console.log("1. Get app access token");
	console.log("2. Get user access token");
	console.log("3. Revoke access token");
	const rl = readline.createInterface({input: process.stdin, output: process.stdout});
	const answer = await rl.question("Choose (0-3): ");
	rl.close();

	if (answer === "0")
		return;

	console.log("");
	switch(answer) {
		case "1": await require("./getappaccesstoken").main(env.CLIENT_ID, env.CLIENT_SECRET); console.log(""); break;
		case "2": await require("./getuseraccesstoken").main(env.CLIENT_ID, env.CLIENT_SECRET, env.REDIRECT_URI); console.log(""); break;
		case "3": await require("./revokeaccesstoken").main(env.CLIENT_ID); console.log(""); break;
	}
	return main(env);
}

module.exports = {
	getEnvVariables,
	Counter,
};

if (process.argv[1] === __filename) {
	const env = getEnvVariables();
	main(env).catch(console.error);
}