import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectApplications } from '../store/applicationsSlice';
import { STATUSES } from '../utils/constants';
import { weekStart, formatDate } from '../utils/date';

export default function StatsPage() {
  const apps = useSelector(selectApplications);

  const stats = useMemo(() => {
    const byStatus = apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const sent = apps.filter((a) => a.status !== 'wishlist').length;
    const responses = (byStatus.interview || 0) + (byStatus.offer || 0) + (byStatus.rejected || 0);
    const responseRate = sent ? Math.round((responses / sent) * 100) : 0;

    const byWeek = apps
      .filter((a) => a.appliedOn)
      .reduce((acc, a) => {
        const week = weekStart(a.appliedOn);
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {});
    const weeks = Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-8);

    const scores = apps.map((a) => a.matchScore).filter((n) => typeof n === 'number' && !isNaN(n));
    const avgScore = scores.length ? Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length) : 0;

    const byCountry = Object.entries(
      apps.reduce((acc, a) => {
        const key = a.country || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return { byStatus, sent, responseRate, weeks, avgScore, byCountry };
  }, [apps]);

  const maxStatus = Math.max(1, ...Object.values(stats.byStatus));
  const maxWeek = Math.max(1, ...stats.weeks.map(([, n]) => n));
  const maxCountry = Math.max(1, ...stats.byCountry.map(([, n]) => n));

  return (
    <>
      <h1>Stats</h1>

      <section className="tiles" aria-label="Summary">
        <div className="tile"><span className="tile__value">{apps.length}</span>Total tracked</div>
        <div className="tile"><span className="tile__value">{stats.sent}</span>Applications sent</div>
        <div className="tile"><span className="tile__value">{stats.byStatus.interview || 0}</span>Interviews</div>
        <div className="tile"><span className="tile__value">{stats.responseRate}%</span>Response rate</div>
        <div className="tile"><span className="tile__value">{stats.avgScore}</span>Avg. match score</div>
      </section>

      <section className="panel">
        <h2>By status</h2>
        {STATUSES.map((s) => {
          const count = stats.byStatus[s.id] || 0;
          return (
            <div key={s.id} className="bar">
              <span className="bar__label">{s.label}</span>
              <div className="bar__track">
                <div
                  className={`bar__fill bar__fill--${s.id}`}
                  style={{ width: `${(count / maxStatus) * 100}%` }}
                />
              </div>
              <span className="bar__value">{count}</span>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h2>Top countries</h2>
        {stats.byCountry.map(([name, count]) => (
          <div key={name} className="bar">
            <span className="bar__label">{name}</span>
            <div className="bar__track">
              <div className="bar__fill" style={{ width: `${(count / maxCountry) * 100}%` }} />
            </div>
            <span className="bar__value">{count}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Applications per week</h2>
        {stats.weeks.length === 0 ? (
          <p className="muted">No dated applications yet.</p>
        ) : (
          stats.weeks.map(([week, count]) => (
            <div key={week} className="bar">
              <span className="bar__label">{formatDate(week)}</span>
              <div className="bar__track">
                <div className="bar__fill" style={{ width: `${(count / maxWeek) * 100}%` }} />
              </div>
              <span className="bar__value">{count}</span>
            </div>
          ))
        )}
      </section>
    </>
  );
}
