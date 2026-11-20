const API = 'https://api.github.com';

export async function fetchJson(path, token) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-updater' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}`);
  return response.json();
}

export async function fetchContributions(user) {
  const response = await fetch(`https://github.com/users/${user}/contributions`);
  if (!response.ok) throw new Error(`Contributions page ${response.status}`);
  const html = await response.text();
  return { total: parseTotal(html), days: parseDays(html) };
}

export async function fetchLanguageTotals(user, token) {
  const repos = await fetchJson(`/users/${user}/repos?per_page=100&type=owner`, token);
  const sources = repos.filter((repo) => !repo.fork && repo.name !== user);
  const languages = await Promise.all(sources.map((repo) => fetchJson(`/repos/${user}/${repo.name}/languages`, token)));
  return sumLanguages(languages);
}

function sumLanguages(languageMaps) {
  const totals = new Map();
  for (const languages of languageMaps) {
    for (const [name, bytes] of Object.entries(languages)) totals.set(name, (totals.get(name) ?? 0) + bytes);
  }
  return [...totals].map(([name, bytes]) => ({ name, bytes })).sort((a, b) => b.bytes - a.bytes);
}

export function getStreak(days, today) {
  const past = days.filter((day) => day.date <= today);
  const finished = past.at(-1)?.count === 0 ? past.slice(0, -1) : past;
  const lastGap = finished.findLastIndex((day) => day.count === 0);
  return finished.length - 1 - lastGap;
}

function parseTotal(html) {
  const match = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  return match ? Number(match[1].replaceAll(',', '')) : 0;
}

function parseDays(html) {
  const counts = parseTooltipCounts(html);
  const cells = html.matchAll(/<td[^>]*data-date="([\d-]+)"[^>]*>/g);
  return [...cells]
    .map(([tag, date]) => ({ date, count: counts.get(tag.match(/\bid="([^"]+)"/)?.[1]) ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function parseTooltipCounts(html) {
  const tips = html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g);
  return new Map([...tips].map(([, id, text]) => [id, Number(text.match(/^\s*(\d+)/)?.[1] ?? 0)]));
}
