import { useState } from 'react';
import Card from './Card';

export default function Column({ status, apps, onMove }) {
  const [isOver, setIsOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setIsOver(false);
    const id = e.dataTransfer.getData('text/plain');
    if (id) onMove(id, status.id);
  }

  return (
    <section
      className={`column column--${status.id} ${isOver ? 'column--over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault(); // required to allow dropping
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false);
      }}
      onDrop={handleDrop}
      aria-labelledby={`col-${status.id}`}
    >
      <h2 id={`col-${status.id}`} className="column__title">
        {status.label} <span className="column__count">{apps.length}</span>
      </h2>
      <div className="column__list">
        {apps.length === 0 ? (
          <p className="column__empty">Drop cards here</p>
        ) : (
          apps.map((app) => <Card key={app.id} app={app} onMove={onMove} />)
        )}
      </div>
    </section>
  );
}
