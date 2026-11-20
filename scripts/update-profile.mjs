import { readFile, writeFile } from "node:fs/promises";
import { fetchContributions, fetchJson, fetchLanguageTotals, getStreak } from "./lib/github.mjs";
import { renderExhibit } from "./lib/exhibit.mjs";
import { renderMaterials } from "./lib/materials.mjs";
import { describeLatest, renderActivityTable } from "./lib/activity.mjs";

const USER = process.env.GH_USER ?? "rekyi";
const TOKEN = process.env.GITHUB_TOKEN;
const START_DATE = "2026-07-28";
const DAY_MS = 86_400_000;
const README_PATH = "README.md";
const HEADER_PATH = "assets/header.svg";
const MATERIALS_PATH = "assets/materials.svg";
const TOOLS = ["Angular", "Supabase"];

function getDayCount(now) {
  return Math.floor((now - Date.parse(START_DATE)) / DAY_MS) + 1;
}

function formatUpdated(now) {
  return new Date(now).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function replaceBlock(content, key, value) {
  const pattern = new RegExp(`(<!-- ${key}:START -->)[\\s\\S]*?(<!-- ${key}:END -->)`);
  return content.replace(pattern, (_, start, end) => `${start}${value}${end}`);
}

async function updateHeader({ now, profile, events, contributions }) {
  const today = new Date(now).toISOString().slice(0, 10);
  const days = contributions.days.filter((day) => day.date <= today);
  const header = renderExhibit({
    day: getDayCount(now),
    days: days.filter((day) => day.date >= START_DATE),
    total: contributions.total,
    streak: getStreak(days, today),
    repos: profile.public_repos,
    latest: describeLatest(events, USER),
    updated: formatUpdated(now),
  });
  await writeFile(HEADER_PATH, header);
}

async function updateMaterials(now) {
  const languages = await fetchLanguageTotals(USER, TOKEN);
  await writeFile(MATERIALS_PATH, renderMaterials({ languages, tools: TOOLS, updated: formatUpdated(now) }));
}

async function updateActivity(events) {
  const readme = await readFile(README_PATH, "utf8");
  await writeFile(README_PATH, replaceBlock(readme, "ACTIVITY", `\n\n${renderActivityTable(events, USER)}\n\n`));
}

async function main() {
  const now = Date.now();
  const [profile, events, contributions] = await Promise.all([fetchJson(`/users/${USER}`, TOKEN), fetchJson(`/users/${USER}/events/public?per_page=100`, TOKEN), fetchContributions(USER)]);
  await Promise.all([updateHeader({ now, profile, events, contributions }), updateMaterials(now), updateActivity(events)]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
