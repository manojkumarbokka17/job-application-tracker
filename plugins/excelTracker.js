/*
 * Vite plugin: serves your Excel tracker to the app and pushes a live update
 * to the browser whenever the file is saved.
 *
 *   GET  /api/tracker        -> the .xlsx file (with Last-Modified header)
 *   HEAD /api/tracker        -> just the Last-Modified header (cheap polling)
 *   HMR event "tracker:changed" is sent when the file changes on disk.
 *
 * The file path is set in vite.config.js (or TRACKER_PATH in .env.local)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROUTE = '/api/tracker';

export default function excelTracker(filePath) {
  const resolved = filePath ? path.resolve(filePath) : null;
  const same = (p) => resolved && path.resolve(p).toLowerCase() === resolved.toLowerCase();

  return {
    name: 'excel-tracker',
    apply: 'serve', // dev server only

    configureServer(server) {
      if (!resolved) {
        server.config.logger.warn('[excel-tracker] no tracker path configured — live sync is off.');
        return;
      }
      if (!fs.existsSync(resolved)) {
        server.config.logger.warn(`[excel-tracker] file not found: ${resolved} — check the path in vite.config.js`);
      } else {
        server.config.logger.info(`[excel-tracker] watching ${resolved}`);
      }

      // Serve the workbook
      server.middlewares.use(ROUTE, (req, res) => {
        fs.stat(resolved, (statErr, stat) => {
          if (statErr) {
            res.statusCode = 404;
            return res.end('Tracker file not found');
          }
          res.setHeader('Last-Modified', stat.mtime.toUTCString());
          res.setHeader('Cache-Control', 'no-store');
          if (req.method === 'HEAD') return res.end();

          fs.readFile(resolved, (readErr, data) => {
            if (readErr) {
              res.statusCode = 503; // e.g. Excel is mid-save; the client retries
              return res.end('Tracker file is busy');
            }
            res.setHeader(
              'Content-Type',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.end(data);
          });
        });
      });

      // Watch the file and notify the browser (debounced: Excel saves in several steps)
      let timer;
      const notify = (changed) => {
        if (!same(changed)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          server.config.logger.info('[excel-tracker] file changed, updating browser');
          server.ws.send({ type: 'custom', event: 'tracker:changed' });
        }, 800);
      };
      server.watcher.add(resolved);
      server.watcher.on('change', notify);
      server.watcher.on('add', notify);
    },
  };
}
