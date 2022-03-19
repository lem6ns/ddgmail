const fetch = require('node-fetch');
const config = require('./config.json');
const inquirer = require('inquirer');
const API_URL = 'https://quack.duckduckgo.com/api';

async function auth() {
    const { user } = config;
    // send request to duckduckgo to send OTP to user
    await fetch(`${API_URL}/auth/loginlink?user=${user}`); // {}
    console.log("Please check your email for an OTP code from DuckDuckGo. This code is only sent to DuckDuckGo, nowhere else.");
    const { otp } = await inquirer
        .prompt([{
            type: 'input',
            name: 'otp',
            message: 'Enter OTP code:',
            validate: value => {
                if (value.split(" ").length === 4) {
                    return true;
                }
            }
        }])

    const authResp = await fetch(`${API_URL}/auth/login?otp=${otp.replace(/ /g, "+")}&user=${user}`).then(r => r.json());
    if (authResp.status == "authenticated") {
        const dashboardResp = await fetch(`${API_URL}/email/dashboard`, {
            headers: {
                'Authorization': `Bearer ${authResp.token}`,
            }
        }).then(r => r.json());

        if (dashboardResp.error) {
            return console.log(dashboardResp.error);
        };

        console.log("Authentication successful!");
        console.log(dashboardResp);
    }
};

auth();