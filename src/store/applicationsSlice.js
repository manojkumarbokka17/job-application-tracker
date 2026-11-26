import { createSlice, nanoid } from '@reduxjs/toolkit';
import { STORAGE_KEY } from '../utils/constants';
import { todayISO } from '../utils/date';
import { BOARD_TO_SHEET } from '../utils/excel';

const EMPTY_STATE = { items: [], headers: null, source: null };

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.items)) return { ...EMPTY_STATE, ...saved };
  } catch {
    /* corrupted data: start empty */
  }
  return EMPTY_STATE;
}

// Keep the sheet's own status text in sync when the board column changes.
function syncSheetStatus(app, newStatus) {
  if (app.status !== newStatus) {
    app.status = newStatus;
    app.sheetStatus = BOARD_TO_SHEET[newStatus];
    app.applicationStatus = BOARD_TO_SHEET[newStatus];
  }
  if (newStatus !== 'wishlist' && !app.appliedOn) app.appliedOn = todayISO();
}

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: loadState(),
  reducers: {
    /*
     * Load rows from Excel. The sheet is the source of truth, with two exceptions:
     *  - a card you moved on the board keeps its column, as long as that row's
     *    status in the sheet hasn't changed since the last import;
     *  - applications you added in the app (not in the sheet) are kept.
     */
    importApplications(state, action) {
      const { apps, headers, fileName, live = false } = action.payload;
      const previous = Object.fromEntries(state.items.map((a) => [a.id, a]));

      const merged = apps.map((app) => {
        const old = previous[app.id];
        const sheetUnchanged = old && old.originalSheetStatus === app.originalSheetStatus;
        if (sheetUnchanged && old.status !== app.status) {
          return {
            ...app,
            status: old.status,
            sheetStatus: old.sheetStatus,
            applicationStatus: old.applicationStatus,
          };
        }
        return app;
      });
      const manual = state.items.filter((a) => a.origin !== 'excel');

      state.items = [...manual, ...merged];
      state.headers = headers;
      state.source = { fileName, importedAt: new Date().toISOString(), live };
    },
    addApplication: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(data) {
        const app = {
          type: 'Internship',
          sheet: {},
          ...data,
          id: nanoid(),
          origin: 'manual',
          status: 'wishlist',
        };
        syncSheetStatus(app, data.status);
        if (data.appliedOn) app.appliedOn = data.appliedOn;
        return { payload: app };
      },
    },
    updateApplication(state, action) {
      const app = state.items.find((a) => a.id === action.payload.id);
      if (!app) return;
      const { status, ...rest } = action.payload;
      Object.assign(app, rest);
      if (status) syncSheetStatus(app, status);
    },
    moveApplication(state, action) {
      const app = state.items.find((a) => a.id === action.payload.id);
      if (app) syncSheetStatus(app, action.payload.status);
    },
    deleteApplication(state, action) {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
  },
});

export const {
  importApplications,
  addApplication,
  updateApplication,
  moveApplication,
  deleteApplication,
} = applicationsSlice.actions;

export const selectApplications = (state) => state.applications.items;
export const selectHeaders = (state) => state.applications.headers;
export const selectSource = (state) => state.applications.source;
export const selectApplicationById = (id) => (state) =>
  state.applications.items.find((a) => a.id === id);

export default applicationsSlice.reducer;
