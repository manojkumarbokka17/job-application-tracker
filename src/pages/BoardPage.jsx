import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Board from '../components/Board';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import ApplicationForm from '../components/ApplicationForm';
import ExcelControls from '../components/ExcelControls';
import { addApplication, moveApplication, selectApplications } from '../store/applicationsSlice';
import { useDebounce } from '../hooks/useDebounce';

const SEARCH_FIELDS = ['company', 'role', 'city', 'country', 'requiredSkills', 'notes'];

export default function BoardPage({ sync }) {
  const dispatch = useDispatch();
  const applications = useSelector(selectApplications);

  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('all');
  const [country, setCountry] = useState('all');
  const [sort, setSort] = useState('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const countries = useMemo(
    () => [...new Set(applications.map((a) => a.country).filter(Boolean))].sort(),
    [applications]
  );

  const visible = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const filtered = applications.filter((app) => {
      const matchesMode = mode === 'all' || app.workMode?.startsWith(mode);
      const matchesCountry = country === 'all' || app.country === country;
      const matchesQuery =
        !query || SEARCH_FIELDS.some((f) => app[f]?.toLowerCase().includes(query));
      return matchesMode && matchesCountry && matchesQuery;
    });

    const byDate = (a, b) => (a.appliedOn || '9999').localeCompare(b.appliedOn || '9999');
    return [...filtered].sort((a, b) => {
      if (sort === 'company') return a.company.localeCompare(b.company);
      if (sort === 'score') return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      if (sort === 'oldest') return byDate(a, b);
      return byDate(b, a);
    });
  }, [applications, debouncedSearch, mode, country, sort]);

  // Stable reference so memoized Cards don't re-render on every parent render.
  const handleMove = useCallback(
    (id, status) => dispatch(moveApplication({ id, status })),
    [dispatch]
  );

  function handleAdd(values) {
    dispatch(addApplication(values));
    setIsFormOpen(false);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My applications</h1>
          <p className="muted">
            {applications.length} total
            {visible.length !== applications.length && ` · ${visible.length} shown`}
            {' · '}drag cards between columns to update their status
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setIsFormOpen(true)}>
          + Add application
        </button>
      </div>

      <ExcelControls sync={sync} />

      {applications.length === 0 ? (
        <div className="empty">
          <p>
            {sync?.status === 'connecting'
              ? 'Loading your Excel tracker…'
              : <>No applications yet. Import your tracker with <strong>📥 Import from Excel</strong>, or add one by hand.</>}
          </p>
        </div>
      ) : (
        <>
          <FilterBar
            search={search}
            onSearch={setSearch}
            mode={mode}
            onMode={setMode}
            country={country}
            onCountry={setCountry}
            countries={countries}
            sort={sort}
            onSort={setSort}
          />
          <Board apps={visible} onMove={handleMove} />
        </>
      )}

      <Modal open={isFormOpen} title="New application" onClose={() => setIsFormOpen(false)}>
        <ApplicationForm
          onSubmit={handleAdd}
          onCancel={() => setIsFormOpen(false)}
          submitLabel="Add"
        />
      </Modal>
    </>
  );
}
