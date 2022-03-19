import meow from 'meow'
import meowHelp from 'cli-meow-help'

const flags = {
    version: {
        type: `boolean`,
        alias: `v`,
        desc: `Print CLI version`
    },
    username: {
        type: `string`,
        alias: `u`,
        desc: `Username of duck.com account`,
        default: ``
    },
    accessToken: {
        type: `string`,
        alias: `t`,
        desc: `Access token of duck.com account`,
        default: ``
    },
    noClipboard: {
        type: `boolean`,
        alias: `n`,
        desc: `Don't automatically copy to clipboard`,
        default: false
    }
};

const commands = {
    help: { desc: `Print help info` },
    new: { desc: `Create a new private email address` },
    amount: { desc: `Get the amount of private email addresses you have generated (Cannot use access token)` },
    access: { desc: `Get your access token` },
    // join: { desc: `Join the waitlist` },
    // check: { desc: `Check if you are in the waitlist` },
    // create: { desc: `Create an Email Protection account with an invite code` },
};

const helpText = meowHelp({
    name: `ddgmail`,
    flags,
    commands
});

const options = {
    inferType: true,
    description: false,
    hardRejection: false,
    flags
};

export default meow(helpText, options);