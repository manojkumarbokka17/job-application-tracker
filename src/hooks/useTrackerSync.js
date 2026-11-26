import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { importApplications } from '../store/applicationsSlice';
import { readTrackerBuffer } from '../utils/excel';

// Dev: live file served by the Vite plugin. Production (GitHub Pages): copy in public/data.
const TRACKER_URL = import.meta.env.DEV
  ? '/api/tracker'
  : `${import.meta.env.BASE_URL}data/tracker.xlsx`;
const POLL_MS = 10000;

/*
 * Keeps the board in sync with the Excel file (served by the dev server, or the
 * static copy in public/data when deployed).
 * 1. Loads the sheet when the app starts.
 * 2. Reloads instantly when the server sends "tracker:changed" (file saved).
 * 3. Backup: every 10s asks for the file's Last-Modified time and reloads if it changed.
 */
export function useTrackerSync() {
  const dispatch = useDispatch();
  const lastModified = useRef(null);
  const loading = useRef(false);
  const [sync, setSync] = useState({ status: 'connecting', lastSync: null, error: '' });

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await fetch(TRACKER_URL, { cache: 'no-store' });
      if (res.status === 404) {
        setSync({ status: 'off', lastSync: null, error: '' });
        return false;
      }
      if (!res.ok) throw new Error(`Server answered ${res.status}`);

      lastModified.current = res.headers.get('Last-Modified');
      const { apps, headers } = await readTrackerBuffer(await res.arrayBuffer());
      dispatch(importApplications({ apps, headers, fileName: 'Excel tracker', live: true }));
      setSync({ status: 'live', lastSync: new Date(), error: '' });
      return true;
    } catch (err) {
      // Usually Excel is mid-save: keep the current board and retry on the next check.
      setSync((s) => ({ ...s, status: s.lastSync ? 'live' : 'error', error: err.message }));
      return true;
    } finally {
      loading.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    let timer;
    let cancelled = false;

    load().then((available) => {
      if (!available || cancelled) return;

      timer = setInterval(async () => {
        try {
          const res = await fetch(TRACKER_URL, { method: 'HEAD', cache: 'no-store' });
          const modified = res.headers.get('Last-Modified');
          if (res.ok && modified && modified !== lastModified.current) load();
        } catch {
          /* dev server stopped: ignore */
        }
      }, POLL_MS);
    });

    // Instant update pushed by the Vite plugin
    const onChange = () => load();
    import.meta.hot?.on('tracker:changed', onChange);

    return () => {
      cancelled = true;
      clearInterval(timer);
      import.meta.hot?.off?.('tracker:changed', onChange);
    };
  }, [load]);

  return { ...sync, reload: load };
}
