const MAX_ROWS = 6;

const DESCRIBERS = {
  PushEvent: () => 'Pushed',
  CreateEvent: (payload) => (isFounding(payload) ? 'Created repository' : null),
  PublicEvent: () => 'Made public',
  PullRequestEvent: (payload) => describePullRequest(payload),
  IssuesEvent: (payload) => (payload.action === 'opened' ? 'Opened issue' : null),
  ReleaseEvent: () => 'Published release',
  WatchEvent: () => 'Starred',
  ForkEvent: () => 'Forked',
};

const SENTENCES = {
  Pushed: (label) => `Pushed to ${label}`,
  'Created repository': (label) => `Created ${label}`,
  'Made public': (label) => `Published ${label}`,
  'Opened issue': (label) => `Opened an issue in ${label}`,
  'Published release': (label) => `Released ${label}`,
};

export function renderActivityTable(events, user) {
  const lines = getActivityRows(events, user).slice(0, MAX_ROWS).map(formatRow);
  if (!lines.length) lines.push('| | No public activity yet. | |');
  return ['| Date | Activity | Repository |', '| :-- | :-- | :-- |', ...lines].join('\n');
}

export function describeLatest(events, user) {
  const [latest] = getActivityRows(events, user);
  if (!latest) return 'Quiet days';
  const label = formatLabel(latest);
  const sentence = SENTENCES[latest.action]?.(label) ?? `${latest.action} ${label}`;
  return `${sentence} · ${formatDate(latest.date)}`;
}

function getActivityRows(events, user) {
  const rows = sortNewestFirst(events).map((event) => toRow(event, user)).filter(Boolean);
  return collapseRepeats(rows);
}

function isFounding(payload) {
  return payload.ref_type === 'repository' || payload.ref === payload.master_branch;
}

function describePullRequest({ action, pull_request: pullRequest }) {
  if (action === 'opened') return 'Opened pull request';
  if (action === 'merged' || pullRequest?.merged) return 'Merged pull request';
  return null;
}

function sortNewestFirst(events) {
  return [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function toRow(event, user) {
  if (event.repo.name === `${user}/${user}`) return null;
  const action = DESCRIBERS[event.type]?.(event.payload);
  if (!action) return null;
  return { date: event.created_at.slice(0, 10), action, repo: event.repo.name, user, count: 1 };
}

function collapseRepeats(rows) {
  return rows.reduce((list, row) => {
    const last = list.at(-1);
    const isRepeat = last?.date === row.date && last.action === row.action && last.repo === row.repo;
    if (!isRepeat) return [...list, row];
    return [...list.slice(0, -1), { ...last, count: last.count + 1 }];
  }, []);
}

function formatLabel({ repo, user }) {
  return repo.startsWith(`${user}/`) ? repo.slice(user.length + 1) : repo;
}

function formatRow(row) {
  const times = row.count > 1 ? ` ×${row.count}` : '';
  return `| ${formatDate(row.date)} | ${row.action}${times} | [${formatLabel(row)}](https://github.com/${row.repo}) |`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
