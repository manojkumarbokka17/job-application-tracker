/*
 * Excel import / export for the "European Frontend Internship Tracker" workbook.
 *
 * Import: finds the "Application Tracker" sheet, locates the header row (the row that
 * contains "Company Name"), and turns each row into an application object.
 * Every original column is kept in `app.sheet`, so exporting gives back a full workbook.
 */

// Sheet status values (from the "Lists" sheet) -> board column
const SHEET_TO_BOARD = {
  'not started': 'wishlist',
  'preparing documents': 'wishlist',
  'awaiting my approval': 'wishlist',
  applied: 'applied',
  'under review': 'applied',
  shortlisted: 'applied',
  assessment: 'applied',
  interview: 'interview',
  'interview scheduled': 'interview',
  interviewing: 'interview',
  'offer received': 'offer',
  selected: 'offer',
  accepted: 'offer',
  rejected: 'rejected',
  withdrawn: 'rejected',
  'closed / expired': 'rejected',
};

// Board column -> value written back to the sheet's "Status" column
export const BOARD_TO_SHEET = {
  wishlist: 'Not Started',
  applied: 'Applied',
  interview: 'Interview Scheduled',
  offer: 'Offer Received',
  rejected: 'Rejected',
};

// App field -> sheet column header
const FIELD_TO_HEADER = {
  company: 'Company Name',
  role: 'Internship Title',
  country: 'Country',
  city: 'City',
  link: 'Job URL',
  workMode: 'Work Mode',
  appliedOn: 'Application Date',
  sheetStatus: 'Status',
  applicationStatus: 'Application Status',
  matchScore: 'Match Score (0-100)',
  matchCategory: 'Match Category',
  language: 'Language',
  visa: 'Visa Requirements',
  sponsorship: 'Sponsorship',
  relocation: 'Relocation Assistance',
  vacancyStatus: 'Vacancy Status',
  requiredSkills: 'Required Skills',
  matchingSkills: 'Matching Skills',
  skillGaps: 'Skill Gaps',
  resume: 'Resume Filename',
  coverLetter: 'Cover Letter Filename',
  startDate: 'Start Date',
  deadline: 'Application Deadline',
  followUp: 'Follow-up Date',
  contact: 'Contact / Recruiter',
  notes: 'Notes',
};

const DATE_HEADERS = new Set(['Start Date', 'Application Deadline', 'Application Date', 'Follow-up Date']);

// Default column order for export when the data didn't come from a sheet
const DEFAULT_HEADERS = ['#', ...Object.values(FIELD_TO_HEADER)];

/* ---------- helpers (pure, easy to unit test) ---------- */

// Excel stores dates as "days since 1899-12-30"
export function excelSerialToISO(serial) {
  const ms = Date.UTC(1899, 11, 30) + Math.round(serial * 86400000);
  return new Date(ms).toISOString().slice(0, 10);
}

export function toISODate(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return excelSerialToISO(value);
  if (value instanceof Date && !isNaN(value)) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : '';
}

export function toBoardStatus(sheetStatus, applicationStatus) {
  for (const raw of [sheetStatus, applicationStatus]) {
    if (!raw) continue;
    const text = String(raw).trim().toLowerCase();
    if (SHEET_TO_BOARD[text]) return SHEET_TO_BOARD[text];
    // free-text like "Rejected (email 13–14 Nov)" -> match on the first word(s)
    const key = Object.keys(SHEET_TO_BOARD).find((k) => text.startsWith(k));
    if (key) return SHEET_TO_BOARD[key];
  }
  return 'wishlist';
}

const clean = (v) => (v == null ? '' : String(v).trim());

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

// rows = array of arrays (sheet_to_json with header: 1)
export function rowsToApplications(rows) {
  const headerIndex = rows.findIndex((r) => r?.some((c) => clean(c) === 'Company Name'));
  if (headerIndex === -1) {
    throw new Error('Could not find a "Company Name" header row in this sheet.');
  }
  const headers = rows[headerIndex].map(clean);

  const apps = [];
  const seen = {};
  rows.slice(headerIndex + 1).forEach((row) => {
    if (!row) return;
    const sheet = {};
    headers.forEach((h, col) => {
      if (!h) return;
      const value = row[col];
      sheet[h] = DATE_HEADERS.has(h) ? toISODate(value) : value == null ? '' : value;
    });
    if (!clean(sheet['Company Name'])) return; // skip empty rows

    // Stable id from the row's content, so the same job keeps the same id (and URL)
    // across re-imports. A counter handles duplicate rows.
    const base = slug(`${sheet['Company Name']}-${sheet['Internship Title'] || ''}`);
    seen[base] = (seen[base] || 0) + 1;
    const id = seen[base] > 1 ? `${base}-${seen[base]}` : base;

    const app = { id, type: 'Internship', origin: 'excel', sheet };
    for (const [field, header] of Object.entries(FIELD_TO_HEADER)) {
      app[field] = DATE_HEADERS.has(header) ? sheet[header] || '' : clean(sheet[header]);
    }
    app.matchScore = app.matchScore === '' ? null : Number(app.matchScore);
    app.status = toBoardStatus(app.sheetStatus, app.applicationStatus);
    app.originalSheetStatus = `${app.sheetStatus}|${app.applicationStatus}`;
    apps.push(app);
  });
  return { headers: headers.filter(Boolean), apps };
}

export function applicationsToRows(apps, headers = DEFAULT_HEADERS) {
  const headerToField = Object.fromEntries(
    Object.entries(FIELD_TO_HEADER).map(([field, header]) => [header, field])
  );
  const body = apps.map((app, index) =>
    headers.map((h) => {
      if (h === '#') return index + 1;
      const field = headerToField[h];
      let value = field !== undefined ? app[field] : app.sheet?.[h];
      if (value == null) value = '';
      if (DATE_HEADERS.has(h) && value) {
        const [y, m, d] = value.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d));
      }
      return value;
    })
  );
  return [headers, ...body];
}

/* ---------- browser I/O (uses SheetJS, loaded only when needed) ---------- */

export async function readTrackerFile(file) {
  return readTrackerBuffer(await file.arrayBuffer());
}

export async function readTrackerBuffer(buffer) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer);
  const sheetName =
    workbook.SheetNames.find((n) => n.toLowerCase().includes('application tracker')) ??
    workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null,
  });
  return { sheetName, ...rowsToApplications(rows) };
}

export async function exportTrackerFile(apps, headers) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet(applicationsToRows(apps, headers), {
    cellDates: true,
    dateNF: 'yyyy-mm-dd',
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Application Tracker');
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Application_Tracker_Export_${today}.xlsx`);
}
