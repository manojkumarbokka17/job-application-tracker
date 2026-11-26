const DAY = 24 * 60 * 60 * 1000;

// "today", "yesterday", "5 days ago", "in 3 days"
export function relativeDays(isoDate) {
  if (!isoDate) return '';
  const start = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(new Date(isoDate))) / DAY);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff === -1) return 'tomorrow';
  return diff > 0 ? `${diff} days ago` : `in ${-diff} days`;
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Monday of the week the date falls in, as YYYY-MM-DD (used for weekly stats)
export function weekStart(isoDate) {
  const d = new Date(isoDate);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
