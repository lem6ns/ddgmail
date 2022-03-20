import meow from "meow";
import meowHelp from "cli-meow-help";

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
	},
	category: {
		type: `string`,
		alias: `c`,
		desc: `Category of the email`,
		default: `E-Mail`
	}
};

const commands = {
	help: { desc: `Print help info` },
	new: { desc: `Create a new private email address` },
	amount: {
		desc: `Get the amount of private email addresses you have generated (Cannot use access token)`
	},
	access: { desc: `Get your access token` },
	config: { desc: `Open config.json in your default editor` },
	"config-table": { desc: `Print config as a table` },
	"config-set": { desc: `Set a config value` },
	"config-get": { desc: `Get a config value` },
	"config-reset": { desc: `Reset config to default` },
	emails: { desc: `Get a list of emails you have generated using ddgmail` },
	"email-delete": {
		desc: `Delete an email you have generated using ddgmail`
	},
	"change-forwarding-address": {
		desc: `Change the forwarding address of your duck.com account`
	},
	"category-search": { desc: `Search for a category` },
	"category-change": { desc: `Change category of an email` },
	join: { desc: `Join the waitlist` },
	check: { desc: `Check if you have a chance to get email protection` },
	"get-code": { desc: `Get code` },
	auth: { desc: `Manually trigger authentication` }
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
