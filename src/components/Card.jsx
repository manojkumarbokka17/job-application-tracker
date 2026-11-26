import { memo } from 'react';
import { Link } from 'react-router-dom';
import { STATUSES } from '../utils/constants';
import { relativeDays } from '../utils/date';

function scoreClass(score) {
  if (score >= 80) return 'score--high';
  if (score >= 60) return 'score--mid';
  return 'score--low';
}

function Card({ app, onMove }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', app.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('card--dragging');
  }

  const location = [app.city, app.country].filter(Boolean).join(', ');

  return (
    <article
      className="card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={(e) => e.currentTarget.classList.remove('card--dragging')}
    >
      <div className="card__top">
        <Link to={`/app/${app.id}`} className="card__title">
          {app.company}
        </Link>
        {app.matchScore != null && (
          <span className={`score ${scoreClass(app.matchScore)}`} title="Match score">
            {app.matchScore}
          </span>
        )}
      </div>
      <p className="card__role">{app.role}</p>
      <div className="card__meta">
        {location && <span>📍 {location}</span>}
        {app.workMode && <span className="tag">{app.workMode}</span>}
      </div>
      {app.appliedOn && <p className="card__date">Applied {relativeDays(app.appliedOn)}</p>}

      {/* Keyboard / touch alternative to drag-and-drop */}
      <select
        className="card__move"
        value={app.status}
        onChange={(e) => onMove(app.id, e.target.value)}
        aria-label={`Move ${app.company} to another column`}
      >
        {STATUSES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </article>
  );
}

// memo: a card re-renders only when its own application object changes
export default memo(Card);
