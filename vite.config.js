import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import excelTracker from './plugins/excelTracker';

// Default: the tracker in the "Job Application" folder next to this project (both on the Desktop).
// Override by setting TRACKER_PATH in a .env.local file.
const DEFAULT_TRACKER =
  '../Job Application/Application Tracker/European_Frontend_Internship_Tracker_2027.xlsx';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // GitHub Pages serves the site at /<repo-name>/
    base: command === 'build' ? '/job-application-tracker/' : '/',
    plugins: [react(), excelTracker(env.TRACKER_PATH || DEFAULT_TRACKER)],
  };
});
