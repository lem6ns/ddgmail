#!/usr/bin/env node

/**
 * ddgmail
 * An unofficial CLI for DuckDuckGo Email Protection.
 *
 * @author lem6ns <lem6ns.github.io>
 */

import init from "./utils/init.js";
import cli from "./utils/cli.js";
import fetch from "node-fetch";
import inquirer from "inquirer";
import alert from "cli-alerts";
import clipboard from "clipboardy";
import ora from "ora";
import fs from "fs";
import launch from "launch-editor";

const input = cli.input;
const flags = cli.flags;
const { username, noClipboard } = flags;
const API_URL = "https://quack.duckduckgo.com/api";
const userDataFolder =
    process.env.APPDATA ||
    (process.platform == "darwin" ?
        process.env.HOME + "/Library/Preferences" :
        process.env.HOME + "/.local/share");
const settingsFolder = `${userDataFolder}/lemons/ddgmail`;
const settingsFile = `${settingsFolder}/settings.json`;

// #region APIs
function checkSettingsAndCreateSettingsFileIfUnexistent() {
    if (!fs.existsSync(settingsFile)) createSettingsFile();
}

function createSettingsFile() {
    fs.mkdirSync(settingsFolder, { recursive: true });
    fs.writeFileSync(
        settingsFile,
        JSON.stringify({
            username: "",
            accessToken: "",
            generatedEmails: [],
            amountGenerated: 0,
            waitlist: {
                timestamp: 0,
                token: "",
                code: ""
            }
        }),
        null,
        4
    );
}

const settings = {
    getSetting: key => {
        checkSettingsAndCreateSettingsFileIfUnexistent();
        const settings = JSON.parse(fs.readFileSync(settingsFile));
        return settings[key];
    },
    changeSetting: (key, value) => {
        checkSettingsAndCreateSettingsFileIfUnexistent();
        const settings = JSON.parse(fs.readFileSync(settingsFile));
        const oldSettings = settings;
        settings[key] = value;
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
        return { oldSettings, newSettings: settings };
    },
    getAllSettings: () => {
        checkSettingsAndCreateSettingsFileIfUnexistent();
        return JSON.parse(fs.readFileSync(settingsFile));
    }
};

const email = {
    private: {
        create: async(accessToken, category) => {
            let { address } = await fetch(`${API_URL}/email/addresses`, {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + accessToken
                }
            }).then(r => r.json());
            if (!address)
                return alert({ type: `error`, msg: `Something went wrong.` });

            address = `${address}@duck.com`;
            settings.changeSetting(
                "amountGenerated",
                settings.getSetting("amountGenerated") + 1
            );
            settings.changeSetting("generatedEmails", [
                ...settings.getSetting("generatedEmails"),
                { category, address }
            ]);
            if (settings.getSetting("accessToken") !== accessToken)
                settings.changeSetting("accessToken", accessToken);
            return `${address}`;
        },
        getEmailAmount: async username => {
            return (await auth(username)).stats["addresses_generated"];
        }
    },
    signUp: async(code, forwardingEmail, emailChoice) => {}
};

const waitlist = {
    join: async() => {},
    check: async() => {},
    getCode: async() => {}
};

async function auth(user) {
    if (username) user = username;

    // send request to duckduckgo to send OTP to user
    await fetch(`${API_URL}/auth/loginlink?user=${user}`); // {}
    alert({
        type: `info`,
        msg: `Please check your email for an OTP code from DuckDuckGo. This code is only sent to DuckDuckGo, nowhere else.`
    });
    let { otp } = await inquirer.prompt([{
        type: "input",
        name: "otp",
        message: "Enter OTP code:",
        validate: value => {
            if (value.trim().split(" ").length === 4) {
                return true;
            }
        }
    }]);
    otp = otp.trim();

    const spinner = ora("Authenticating").start();

    const authResp = await fetch(
        `${API_URL}/auth/login?otp=${otp.replace(/ /g, "+")}&user=${user}`
    ).then(r => r.json());
    if (authResp.status == "authenticated") {
        const dashboardResp = await fetch(`${API_URL}/email/dashboard`, {
            headers: {
                Authorization: `Bearer ${authResp.token}`
            }
        }).then(r => r.json());

        if (dashboardResp.error) {
            return alert({ type: "error", msg: dashboardResp });
        }

        spinner.succeed("Authentication successful!");
        settings.changeSetting("username", user);
        settings.changeSetting(
            "accessToken",
            dashboardResp.user["access_token"]
        );
        alert({
            type: `success`,
            msg: `Set username & accessToken successfully.`
        });
        return dashboardResp;
    }

    spinner.fail("An error occured (Invalid OTP Error)");
    return authResp;
}

async function getUsername() {
    if (username) {
        settings.changeSetting("username", username);
        return username;
    }
    if (settings.getSetting("username")) return settings.getSetting("username");
    const user = await inquirer
        .prompt([{
            type: "input",
            name: "username",
            message: "Enter duck.com username:"
        }])
        .then(answer => answer.username);

    settings.changeSetting("username", user);
    return user;
}
// #endregion

(async() => {
        init();
        checkSettingsAndCreateSettingsFileIfUnexistent();
        if (input.length == 0) cli.showHelp(0);

        for (const argument of input) {
            switch (argument) {
                case `help`:
                    cli.showHelp(0);
                    break;

                    // #region Email
                case "new":
                    const { category } = flags;
                    let accessToken;
                    if (flags.accessToken) {
                        accessToken = flags.accessToken;
                    } else if (settings.getSetting("accessToken")) {
                        accessToken = settings.getSetting("accessToken");
                    } else {
                        const user = await getUsername();
                        accessToken = (await auth(user)).user["access_token"];
                    }

                    const address = await email.private.create(
                        accessToken,
                        category
                    );
                    alert({
                                type: `success`,
                                msg: `Successfully created a private email address (${address})${
						category ? ` with the category ${category}` : ""
					}. ${
						!noClipboard
							? "It has been copied to your clipboard."
							: ""
					}`
				});
				if (!noClipboard) clipboard.writeSync(address);
				break;

			case "amount":
				const name = await getUsername();
				const amount = await email.private.getEmailAmount(name);
				alert({
					type: `success`,
					msg: `You have generated ${amount} private email addresses, and have generated ${settings.getSetting(
						"amountGenerated"
					)} using this tool.`
				});
				break;

			case "emails":
				const emails = settings.getSetting("generatedEmails");
				if (emails.length == 0) {
					return alert({
						type: `error`,
						msg: `You have not generated any private email addresses yet.`
					});
				}
				console.table(emails);
				break;

			case "category-change":
				const { cat, index } = await inquirer.prompt([
					{
						type: "input",
						name: "cat",
						message: "Enter category:"
					},
					{
						type: "input",
						name: "index",
						message: "Enter index number:",
						validate: value => {
							!isNaN(parseInt(value));
						}
					}
				]);

				settings.changeSetting(
					"generatedEmails",
					settings.getSetting("generatedEmails").map((email, i) => {
						if (i == index) email.category = cat;
						return email;
					})
				);

				alert({
					type: `success`,
					msg: `Successfully changed category of email address ${
						settings.getSetting("generatedEmails")[index].address
					} to ${cat}.`
				});
				break;

			case "email-delete":
				const { i } = await inquirer.prompt([
					{
						type: "input",
						name: "i",
						message: "Enter index number:"
					}
				]);

				settings.changeSetting(
					"generatedEmails",
					settings
						.getSetting("generatedEmails")
						.filter((email, index) => index != i)
				);
				break;

			case "signup":
				break;
			// #endregion

			// #region Utils
			case "access":
				const user = await getUsername();
				const authResp = await auth(user);
				if (authResp.error)
					return alert({
						type: "error",
						msg: "An error occured (Invalid OTP Error)"
					});
				const token = authResp.user["access_token"];

				alert({
					type: `success`,
					msg: `Your access token is: "${token}". ${
						!noClipboard
							? "This has been copied to your clipboard."
							: ""
					}`
				});
				if (!noClipboard) clipboard.writeSync(token);
				break;
			// #endregion

			// #region config commands
			case "config":
				launch(settingsFile, "code");
				alert({
					type: `success`,
					msg: `Opened ${settingsFile} in your default editor.`
				});
				break;

			case "config-set":
				const { key, value } = await inquirer.prompt([
					{
						type: "input",
						name: "key",
						message: "Enter the key of the setting to change:"
					},
					{
						type: "input",
						name: "value",
						message: "Enter the new value of the setting:"
					}
				]);
				if (settings.getSetting(key) !== undefined) {
					settings.changeSetting(key, value);
					alert({
						type: `success`,
						msg: `Successfully changed setting "${key}" to "${value}".`
					});
				} else {
					alert({
						type: `error`,
						msg: `Setting "${key}" does not exist.`
					});
				}
				break;

			case "config-get":
				const keyName = await inquirer
					.prompt([
						{
							type: "input",
							name: "key",
							message: "Enter the key of the setting to get:"
						}
					])
					.then(answer => answer.key);
				const valueOut = settings.getSetting(keyName);
				if (valueOut !== undefined) {
					return alert({
						type: `success`,
						msg: `The value of the setting "${keyName}" is: "${valueOut}".`
					});
				}
				return alert({
					type: `error`,
					msg: `The setting "${keyName}" does not exist.`
				});

			case "config-reset":
				const { reset } = await inquirer.prompt([
					{
						type: "confirm",
						name: "reset",
						message: "Are you sure you want to reset all settings?"
					}
				]);
				if (reset) createSettingsFile();
				break;

			case "config-table":
				const allSettings = settings.getAllSettings();
				const kv = Object.keys(allSettings).map(key => [
					key,
					allSettings[key]
				]);
				return console.table(kv);

			case "config-delete":
				const { del } = await inquirer.prompt([
					{
						type: "confirm",
						name: "del",
						message:
							"Are you sure you want to delete the config file? Note: Running ddgemail again will regenerate the config file."
					}
				]);
				if (del) {
					fs.unlinkSync(settingsFile);
					fs.rmSync(settingsFolder, { recursive: true });
					alert({
						type: `success`,
						msg: `Successfully deleted the config file.`
					});
				}
				break;
			// #endregion

			// #region Waitlist
			// case `join`:
			// 	const joinResp = await fetch(
			// 		`${API_URL}/auth/waitlist/join`
			// 	).then(r => r.json());
			// 	// TODO: save resp.token somewhere...
			// 	break;

			// case `check`:
			// 	break;
			// #endregion

			default:
				cli.showHelp(0);
				break;
		}
	}
})();