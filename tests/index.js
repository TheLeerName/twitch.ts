// @ts-check

const dotenv = require("dotenv");
const { z } = require("zod");

function getEnvVariables() {
	const envSchema = z.object({
		CLIENT_ID: z.string().nonempty(),
		CLIENT_SECRET: z.string().nonempty(),
		REDIRECT_URI: z.string().nonempty()
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

module.exports = {
	getEnvVariables,
	Counter,
};