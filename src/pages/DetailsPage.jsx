import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ApplicationForm from '../components/ApplicationForm';
import {
  deleteApplication,
  selectApplicationById,
  updateApplication,
} from '../store/applicationsSlice';
import { STATUSES } from '../utils/constants';
import { formatDate, relativeDays } from '../utils/date';

// [label, field, kind]
const SECTIONS = [
  ['Job', [
    ['Location', (a) => [a.city, a.country].filter(Boolean).join(', ')],
    ['Work mode', 'workMode'],
    ['Language', 'language'],
    ['Start date', 'startDate', 'date'],
    ['Deadline', 'deadline', 'date'],
    ['Vacancy', 'vacancyStatus'],
    ['Job URL', 'link', 'link'],
  ]],
  ['Fit', [
    ['Match score', (a) => (a.matchScore != null ? `${a.matchScore} / 100 ${a.matchCategory ? `(${a.matchCategory})` : ''}` : '')],
    ['Required skills', 'requiredSkills'],
    ['Matching skills', 'matchingSkills'],
    ['Skill gaps', 'skillGaps'],
  ]],
  ['Application', [
    ['Applied on', 'appliedOn', 'date'],
    ['Sheet status', 'applicationStatus'],
    ['Resume', 'resume'],
    ['Cover letter', 'coverLetter'],
    ['Follow-up', 'followUp', 'date'],
    ['Contact', 'contact'],
  ]],
  ['Eligibility', [
    ['Visa', 'visa'],
    ['Sponsorship', 'sponsorship'],
    ['Relocation help', 'relocation'],
  ]],
];

function renderValue(app, field, kind) {
  const value = typeof field === 'function' ? field(app) : app[field];
  if (!value && value !== 0) return '—';
  if (kind === 'date') {
    return (
      <>
        {formatDate(value)} <span className="muted">({relativeDays(value)})</span>
      </>
    );
  }
  if (kind === 'link') {
    return <a href={value} target="_blank" rel="noreferrer">Open job posting ↗</a>;
  }
  return value;
}

export default function DetailsPage() {
  const { id } = useParams();
  const app = useSelector(selectApplicationById(id));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  if (!app) {
    return (
      <div className="empty">
        <p>This application doesn't exist (it may have been deleted or re-imported).</p>
        <Link to="/" className="btn btn--primary">Back to board</Link>
      </div>
    );
  }

  const statusLabel = STATUSES.find((s) => s.id === app.status)?.label;

  function handleSave(values) {
    dispatch(updateApplication({ ...values, id }));
    setIsEditing(false);
  }

  function handleDelete() {
    if (window.confirm(`Delete the ${app.company} application?`)) {
      dispatch(deleteApplication(id));
      navigate('/');
    }
  }

  return (
    <article className="details">
      <Link to="/" className="back">← Back to board</Link>

      {isEditing ? (
        <>
          <h1>Edit application</h1>
          <ApplicationForm
            initialValues={app}
            onSubmit={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </>
      ) : (
        <>
          <div className="page-head">
            <div>
              <h1>{app.company}</h1>
              <p className="muted">{app.role}</p>
            </div>
            <span className={`badge badge--${app.status}`}>{statusLabel}</span>
          </div>

          {SECTIONS.map(([title, rows]) => (
            <section key={title} className="details__section">
              <h2>{title}</h2>
              <dl className="details__list">
                {rows.map(([label, field, kind]) => (
                  <div key={label} className="details__row">
                    <dt>{label}</dt>
                    <dd>{renderValue(app, field, kind)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="details__section">
            <h2>Notes</h2>
            <p className="details__notes">{app.notes || '—'}</p>
          </section>

          <div className="form__actions">
            <button type="button" className="btn btn--danger" onClick={handleDelete}>Delete</button>
            <button type="button" className="btn btn--primary" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </div>
        </>
      )}
    </article>
  );
}
