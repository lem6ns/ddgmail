// init
import { getSetting, setSetting } from "./settings.js";
import fetch from "node-fetch";
import { prompt } from "inquirer";
import ora from "ora";
import alert from "cli-alerts";

const API_URL = "https://quack.duckduckgo.com/api";

export default {}