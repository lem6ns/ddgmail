import path from "path";
import alert from "cli-alerts";
const settingsFile = path.join(__dirname, "settings.json");

function getAllSettings() {
	checkAndCreateIfNone();
	return JSON.parse(fs.readFileSync(settingsFile));
}

function getSetting(setting) {
	checkAndCreateIfNone();
	return getAllSettings()[setting];
}

function setSetting(setting, value) {
	checkAndCreateIfNone();
	let settings = getAllSettings();
	settings[setting] = value;
	fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
}

function createSettingsFile() {
	alert({
		type: "info",
		msg: "Creating settings file..."
	});
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

function checkSettingsFile() {
	return fs.existsSync(settingsFile);
}

function checkAndCreateIfNone() {
	if (!checkSettingsFile()) {
		alert({
			type: "info",
			msg: "Settings file not found. Creating..."
		});
		createSettingsFile();
	}
}

export default { createSettingsFile, getAllSettings, getSetting, setSetting };
