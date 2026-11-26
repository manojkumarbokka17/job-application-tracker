import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  importApplications,
  selectApplications,
  selectHeaders,
  selectSource,
} from '../store/applicationsSlice';
import { exportTrackerFile, readTrackerFile } from '../utils/excel';

export default function ExcelControls({ sync }) {
  const dispatch = useDispatch();
  const apps = useSelector(selectApplications);
  const headers = useSelector(selectHeaders);
  const source = useSelector(selectSource);
  const inputRef = useRef(null);
  const [state, setState] = useState({ loading: false, message: '', error: '' });

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again later
    if (!file) return;

    if (apps.length > 0 && !window.confirm(`Replace the ${apps.length} applications on the board with "${file.name}"?`)) {
      return;
    }

    setState({ loading: true, message: '', error: '' });
    try {
      const result = await readTrackerFile(file);
      dispatch(importApplications({ apps: result.apps, headers: result.headers, fileName: file.name }));
      setState({
        loading: false,
        error: '',
        message: `Imported ${result.apps.length} applications from "${result.sheetName}".`,
      });
    } catch (err) {
      setState({ loading: false, message: '', error: err.message || 'Could not read this file.' });
    }
  }

  async function handleExport() {
    try {
      await exportTrackerFile(apps, headers ?? undefined);
    } catch (err) {
      setState({ loading: false, message: '', error: err.message || 'Export failed.' });
    }
  }

  return (
    <div className="excel">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        hidden
      />
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => inputRef.current.click()}
        disabled={state.loading}
      >
        {state.loading ? 'Reading…' : '📥 Import from Excel'}
      </button>
      <button type="button" className="btn btn--ghost" onClick={handleExport} disabled={!apps.length}>
        📤 Export to Excel
      </button>

      {sync?.status === 'live' && (
        <span className="live" title="The board reloads automatically when you save the Excel file">
          <span className="live__dot" aria-hidden="true" /> {import.meta.env.DEV ? 'Live from Excel' : 'Loaded from Excel tracker'}
          {sync.lastSync && ` · synced ${sync.lastSync.toLocaleTimeString()}`}
          <button type="button" className="btn btn--link" onClick={sync.reload}>Refresh</button>
        </span>
      )}
      {sync?.status === 'error' && (
        <span className="field__error">Couldn't load the Excel file: {sync.error}</span>
      )}

      <p className="excel__status" role="status">
        {state.error && <span className="field__error">{state.error}</span>}
        {!state.error && (state.message ||
          (source && !source.live &&
            `Source: ${source.fileName} · imported ${new Date(source.importedAt).toLocaleString()}`))}
      </p>
    </div>
  );
}
