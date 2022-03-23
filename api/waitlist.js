// init
import { getSetting, setSetting } from "./settings.js";
import fetch from "node-fetch";
import { prompt } from "inquirer";
import ora from "ora";
import alert from "cli-alerts";

const API_URL = "https://quack.duckduckgo.com/api";

async function join() {
	const waitlist = getSetting("waitlist");
	const { timestamp, token } = waitlist; // get timestamp and token from waitlist

	if (timestamp && token) {
		// if timestamp and token are set, prompt user if they want to overwrite their current settings
		const { overwrite } = await prompt({
			type: "confirm",
			name: "overwrite",
			message:
				"You already joined the waitlist. Do you want to overwrite everything?"
		});
		if (!overwrite) {
			return;
		}
	}

	const spinner = ora("Joining waitlist...").start(); // start spinner
	const waitlistRequest = await fetch(`${API_URL}/auth/waitlist/join`, {
		method: "POST"
	}) // send request to DDG servers for code
		.then(r => r.json());

	setSetting("waitlist", {
		// set waitlist settings
		timestamp: waitlistRequest.timestamp,
		token: waitlistRequest.token,
		code: waitlist.code
	});

	spinner.succeed(`Successfully joined waitlist.`); // show success message
}

async function check() {
    checkIfJoined();
	const waitlist = getSetting("waitlist"); // get waitlist settings and check if joined

	const spinner = ora("Checking status...").start(); // start spinner
	const { timestamp } = await fetch(`${API_URL}/auth/waitlist/status`).then(
		r => r.json()
	); // send request to DDG servers for status

	if (timestamp >= waitlist.timestamp) { // if timestamp is greater than or equal to the one in the waitlist settings, show message
		return spinner.success(
			"You may be eligble to get an invite code! Use the get-code command."
		);
	} else {
		return spinner.fail("You are not eligible to get an invite code yet.");
	}
}

async function getCode() {
    checkIfJoined();
	const { token } = getSetting("waitlist"); // get waitlist settings and check if joined

	const code = await fetch( // send request to DDG servers for code
		`https://quack.duckduckgo.com/api/auth/waitlist/code`,
		{
			method: "POST",
			body: {
				token: token
			}
		}
	).then(r => r.json());

	if (JSON.stringify(code) === "{}") { // if code is empty, show error message
		return alert({
			type: "error",
			msg: "You are not eligible to get an invite code yet."
		});
	}

	console.log(code); // show code JSON
}

function checkIfJoined() {
	const { timestamp, token } = getSetting("waitlist");
	if (!timestamp || !token) {
		return alert({
			type: "error",
			msg: "You haven't joined the waitlist yet. Use the join command."
		});
	}
}

export default { join, check, getCode };
