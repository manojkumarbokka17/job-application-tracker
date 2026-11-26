import { useMemo } from 'react';
import Column from './Column';
import { STATUSES } from '../utils/constants';

export default function Board({ apps, onMove }) {
  // Group once per change of `apps` instead of filtering in every column render.
  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(STATUSES.map((s) => [s.id, []]));
    apps.forEach((app) => groups[app.status]?.push(app));
    return groups;
  }, [apps]);

  return (
    <div className="board">
      {STATUSES.map((status) => (
        <Column key={status.id} status={status} apps={byStatus[status.id]} onMove={onMove} />
      ))}
    </div>
  );
}
