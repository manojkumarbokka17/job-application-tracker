import { useEffect, useRef, useState } from 'react';
import { STATUSES, WORK_MODES } from '../utils/constants';

const EMPTY = {
  company: '',
  role: '',
  city: '',
  country: '',
  workMode: 'Hybrid',
  status: 'wishlist',
  appliedOn: '',
  link: '',
  matchScore: '',
  notes: '',
};

function validate(values) {
  const errors = {};
  if (!values.company.trim()) errors.company = 'Company is required';
  if (!values.role.trim()) errors.role = 'Internship title is required';
  if (values.link && !/^https?:\/\/\S+$/.test(values.link)) {
    errors.link = 'Link must start with http:// or https://';
  }
  const score = values.matchScore;
  if (score !== '' && score != null && (isNaN(score) || score < 0 || score > 100)) {
    errors.matchScore = 'Match score must be between 0 and 100';
  }
  return errors;
}

export default function ApplicationForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [values, setValues] = useState(() => {
    const merged = { ...EMPTY, ...initialValues };
    return { ...merged, matchScore: merged.matchScore ?? '' };
  });
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      onSubmit({
        ...values,
        company: values.company.trim(),
        role: values.role.trim(),
        matchScore: values.matchScore === '' ? null : Number(values.matchScore),
      });
    }
  }

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <p id={`${name}-error`} className="field__error" role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form__grid">
        {field('company', 'Company *', { ref: firstInputRef, placeholder: 'e.g. Criteo' })}
        {field('role', 'Internship title *', { placeholder: 'e.g. Frontend Developer Intern' })}
        {field('city', 'City', { placeholder: 'e.g. Paris' })}
        {field('country', 'Country', { placeholder: 'e.g. France' })}

        <div className="field">
          <label htmlFor="workMode">Work mode</label>
          <select id="workMode" name="workMode" value={values.workMode} onChange={handleChange}>
            {!WORK_MODES.includes(values.workMode) && values.workMode && (
              <option>{values.workMode}</option>
            )}
            {WORK_MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={values.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {field('appliedOn', 'Application date', { type: 'date' })}
        {field('matchScore', 'Match score (0-100)', { type: 'number', min: 0, max: 100 })}
      </div>

      {field('link', 'Job URL', { type: 'url', placeholder: 'https://…' })}

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows="3" value={values.notes} onChange={handleChange} />
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
      </div>
    </form>
  );
}
