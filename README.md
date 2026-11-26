# Job Application Tracker

A Kanban-style dashboard for tracking job and internship applications, built with **React, Redux Toolkit, React Router, JavaScript (ES6+), HTML5 and CSS3**.

**Live demo:** https://manojkumarbokka17.github.io/job-application-tracker/

## Features
- **Live sync with Excel**: the board loads your tracker workbook and updates automatically when you save it in Excel (custom Vite plugin + HMR event, with polling as a backup)
- Import any tracker .xlsx by hand, and export the board back to .xlsx with all 32 original columns
- Kanban board: **Wishlist → Applied → Interview → Offer → Rejected**
- Drag-and-drop between columns (native HTML5 Drag & Drop API), plus a dropdown on each card for keyboard/touch users
- Add / edit / delete applications with a validated, accessible form in a native `<dialog>` modal
- Debounced search (custom `useDebounce` hook), filter by job type, sort by date or company
- Details page per application (`/app/:id`) and a Stats page (`/stats`) with response rate and applications per week
- Data saved in `localStorage`, so it survives page reloads
- Light/dark theme with CSS variables (custom `useLocalStorage` hook)
- Responsive: columns stack on mobile

## Getting started
1. By default the app reads `../Job Application/Application Tracker/European_Frontend_Internship_Tracker_2027.xlsx` (the folder next to this project). To use another file, create `.env.local` (see `.env.example`) with `TRACKER_PATH=...`.
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173. The board shows your sheet. Add a row in Excel, press **Ctrl+S**, and the new card appears within a second or two.

### How the Excel data maps to the board
| Sheet "Status" | Board column |
|---|---|
| Not Started, Preparing Documents, Awaiting My Approval | To Apply |
| Applied, Under Review | Applied |
| Interview Scheduled, Interviewing | Interview |
| Offer Received, Accepted | Offer |
| Rejected, Withdrawn, Closed / Expired | Closed |

Excel is the source of truth. A card you drag on the board keeps its new column until that row's status changes in the sheet. Edits to other fields should be made in Excel (or exported with **Export to Excel**).

### How live sync works
`plugins/excelTracker.js` is a small Vite dev-server plugin. It serves the workbook at `/api/tracker`, watches the file, and sends a `tracker:changed` event over Vite's WebSocket when it's saved. `src/hooks/useTrackerSync.js` listens for that event (and checks `Last-Modified` every 10 s as a backup), re-reads the file with SheetJS and merges it into the Redux store.

## Deployment
Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes it to GitHub Pages.
The online version can't read files on your computer, so it loads `public/data/tracker.xlsx`. To update the live site, replace that file with your latest tracker and commit it.

## Project structure
```
src/
  components/   Header, Board, Column, Card, ApplicationForm, FilterBar, Modal
  pages/        BoardPage, DetailsPage, StatsPage, NotFound
  store/        Redux store + applications slice
  hooks/        useDebounce, useLocalStorage, useTrackerSync
  utils/        constants, date helpers, excel (import/export + status mapping)
plugins/        excelTracker.js (Vite plugin: serves + watches the .xlsx)
```

## Concepts used (interview talking points)
| Area | Where |
|---|---|
| Semantic HTML & accessibility | `<dialog>`, `<dl>`, labels, `aria-invalid`, keyboard alternative to drag-and-drop |
| CSS Grid / Flexbox / variables | Board grid, card flex layout, theme tokens in `index.css` |
| Array methods | `filter`, `map`, `reduce`, `sort` in `BoardPage` and `StatsPage` |
| Debouncing | `hooks/useDebounce.js` |
| Redux Toolkit | `store/applicationsSlice.js` (`createSlice`, `prepare` callback, selectors) |
| Performance | `useMemo` for grouping/filtering, `React.memo` on `Card`, `useCallback` for `onMove` |
| Routing | `react-router-dom` with URL params and a 404 route |
| File handling | SheetJS parsing in the browser, header-row detection, Excel date serials |
| Real-time updates | Vite plugin + WebSocket event, polling fallback, merge strategy for local changes |

## Roadmap
- [ ] Follow-up reminders for applications with no reply after 7 days
- [ ] Tests with Vitest + React Testing Library
- [ ] Migrate to TypeScript
- [ ] Deploy to Vercel / Netlify
