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
};

const commands = {
    help: { desc: `Print help info` }
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