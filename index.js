#!/usr/bin/env node

/**
 * ddgmail
 * An unofficial CLI for DuckDuckGo Email Protection.
 *
 * @author lem6ns <lem6ns.github.io>
 */

import init from './utils/init.js';
import cli from './utils/cli.js';
import fetch from 'node-fetch';
import inquirer from 'inquirer';
import alert from 'cli-alerts';
import clipboard from 'clipboardy';

const input = cli.input;
const flags = cli.flags;
const { username, debug, clear } = flags;
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
                let accessToken;
                if (flags.accessToken) {
                    accessToken = flags.accessToken;
                } else {
                    let user = username;
                    if (!username) {
                        user = await inquirer
                            .prompt([{
                                type: 'input',
                                name: 'username',
                                message: 'Enter duck.com username:',
                            }]).then(answer => answer.username);
                    }
                    accessToken = await auth(user);
                };

                const address = await email.private.create(accessToken);
                alert({ type: `success`, msg: `Successfully created a private email address (${address}). It has been copied to your clipboard.` });
                clipboard.writeSync(`${address}`);
                break;
        }
    }
})();

const email = {
    private: {
        create: async(accessToken) => {
            const { address } = await fetch(`${API_URL}/email/addresses`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                }
            }).then(r => r.json());

            if (!address) return alert({ type: `error`, msg: `Something went wrong.` });
            return `${address}@duck.com`;
        },
        getEmailAmount: async(jwtToken) => {

        }
    },
    signUp: async(user, forwardingEmail, emailChoice) => {

    }
}

const waitlist = {
    join: async() => {

    },
    check: async() => {

    },
    getCode: async() => {

    }
};

async function auth(user) {
    if (username) user = username;

    // send request to duckduckgo to send OTP to user
    await fetch(`${API_URL}/auth/loginlink?user=${user}`); // {}
    alert({ type: `info`, msg: `Please check your email for an OTP code from DuckDuckGo. This code is only sent to DuckDuckGo, nowhere else.` })
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

        alert({ type: `success`, msg: `Authentication successful!` });
        return dashboardResp.user["access_token"];
    }
};