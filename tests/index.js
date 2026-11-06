// @ts-check

const dotenv = require("dotenv");
const readline = require("readline/promises");
const { z } = require("zod");
const axios = require("axios");
const axiosRetry = require("axios-retry");
const Twitch = require("../dist");

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

const options = {
	mockAPIEnabled: false
};

/**
 * 
 * @param {ReturnType<typeof getEnvVariables>} env 
 */
async function main(env) {
	console.log("0. Exit");
	console.log("1. Validate access token");
	console.log("2. Get app access token");
	console.log("3. Get user access token");
	console.log(`4. Refresh user access token${options.mockAPIEnabled ? " (currently is disabled, due enabled Mock API)" : ""}`);
	console.log(`5. Revoke access token${options.mockAPIEnabled ? " (currently is disabled, due enabled Mock API)" : ""}`);
	console.log(`6. EventSub WebSocket: channel.chat.message event (requires user access token${options.mockAPIEnabled ? "" : " with user:read:chat scope"})`);
	console.log(`7. Toggle Mock API (currently is ${options.mockAPIEnabled ? "enabled" : "disabled"})`);
	const rl = readline.createInterface({input: process.stdin, output: process.stdout});
	const answer = await rl.question("Choose (0-7): ");
	rl.close();

	if (answer === "0")
		return;

	console.log("");
	switch(answer) {
		case "1":
			if (!options.mockAPIEnabled) {
				await require("./validate-access-token").main();
				console.log("");
			}
			break;
		case "2":
			await require("./get-app-access-token").main(env.CLIENT_ID, env.CLIENT_SECRET);
			console.log("");
			break;
		case "3":
			await require("./get-user-access-token").main(env.CLIENT_ID, env.CLIENT_SECRET, env.REDIRECT_URI);
			console.log("");
			break;
		case "4":
			if (!options.mockAPIEnabled) {
				await require("./refresh-user-access-token").main(env.CLIENT_ID, env.CLIENT_SECRET);
				console.log("");
			}
			break;
		case "5":
			if (!options.mockAPIEnabled) {
				await require("./revoke-access-token").main(env.CLIENT_ID);
				console.log("");
			}
			break;
		case "6":
			await require("./eventsub-ws-channel-chat-message").main();
			console.log("");
			break;
		case "7":
			options.mockAPIEnabled = !options.mockAPIEnabled;
			Twitch.Options.setTwitchCLIMode(options.mockAPIEnabled);
			break;
	}
	return main(env);
}

module.exports = {
	options,
	getEnvVariables,
	Counter,
};

if (process.argv[1] === __filename) {
	axiosRetry.default(axios, {retryDelay: axiosRetry.exponentialDelay});
	const env = getEnvVariables();
	main(env).catch(console.error);
}