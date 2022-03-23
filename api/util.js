import { prompt } from "inquirer";
import ora from "ora";
import alert from "cli-alerts";
import fetch from "node-fetch";
import { getSetting, setSetting } from "./settings.js";

const API_URL = "https://quack.duckduckgo.com/api";

async function auth(username) {
    await fetch(`${API_URL}/auth/loginlink?user=${username}`); // send email to user
    alert({
        type: "info",
        title: "Please check your email from DuckDuckGo. This code will never be sent to external parties.",
    });

    let { code } = await prompt({ // prompt user for OTP code
        type: "input",
        name: "code",
        message: "Enter OTP code:",
        validate: value => {
            if (value.trim().split(" ").length === 4) {
                return true;
            }
        }
    });
    code = code.trim().split(" ").join("+"); // parse it for sending to login endpoint

    const spinner = ora("Authenticating...").start(); // start spinner
    const login = await fetch(`${API_URL}/auth/login?otp=${code}&user=${username}`)
        .then(r => r.json()); // login
    if (login.status != "authenticated") return spinner.fail("An error occured (Invalid OTP code)"); // catch error
    
    const dashboard = await fetch(`${API_URL}/email/dashboard`, { // get dashboard
        headers: {
            Authorization: `Bearer ${login.token}`
        }
    })
        .then(r => r.json());
    if (dashboard.error) return alert({ type: "error", msg: dashboard.error }); // catch error

    spinner.succeed("Successfully authenticated!"); // show success message
    setSetting("username", username);
    setSetting("accessToken", dashboard.user["access_token"]); // set settings
    alert({
        type: "success",
        title: "Saved username & access token to settings.json.",
    });

    return { dashboard, login }; // return dashboard and login for use in other commands
}

async function getUser() {
    // prompt user for username
    const { username } = await prompt({
        type: "input",
        name: "username",
        message: "Enter your DuckDuckGo username:",
        validate: value => {
            if (value.trim() !== "") {
                return true;
            }
        }
    });
    
    // save username to settings
    setSetting("username", username);
    return username;
}

export default { auth, getUser };