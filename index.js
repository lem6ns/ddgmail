#!/usr/bin/env node

/**
 * ddgmail
 * An unofficial CLI for DuckDuckGo Email Protection.
 *
 * @author lem6ns <lem6ns.github.io>
 */

const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');
const fetch = require('node-fetch');
const prompt = require('prompt');

const input = cli.input;
const flags = cli.flags;
const { username, accessToken, debug } = flags;
const API_URL = 'https://quack.duckduckgo.com/api';

(async() => {
    init({ clear });
    debug && log(flags);

    for (const argument of input) {
        switch (argument) {
            case `help`:
                cli.showHelp(0);
                break;
            case `join`:
                const joinResp = await fetch(`${API_URL}/auth/waitlist/join`).then(r => r.json());
                // TODO: save resp.token somewhere...
                break;
            case 'new':
                // TODO: check if not authenticated
                const newResp = await fetch(`${API_URL}/email/addresses`, {
                    method: 'POST',
                    headers: {
                        'Authentication': 'Bearer ' + accessToken, // accessToken is after all authentication, or if it is passed via a flag
                    }
                }).then(r => r.json());
        }
    }
})();

async function authentication(user) {
    if (username && !user) user = username;
    // send request to duckduckgo to send OTP to user
    await fetch(`${API_URL}/auth/loginlink?user=${user}`); // {}
    console.log("Please check your email for an OTP code from DuckDuckGo. This code is only sent to DDG, nowhere else.");
    prompt.start();
    const { otp } = prompt.get("otp");

    const authResp = await fetch(`${API_URL}/auth/login?otp=${otp.replace(/ /g, "+")}&user=${user}`).then(r => r.json());
    if (authResp.token) {
        const dashboardResp = await fetch(`${API_URL}/email/dashboard`, {
            headers: {
                'Authentication': 'Bearer ' + authResp.token,
            }
        }).then(r => r.json());
        console.log("Authentication successful!");
        return dashboardResp.user["access_token"];
    }
};