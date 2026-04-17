/**
 * Simple request logger — logs method, path, status, and duration.
 * Lightweight replacement for morgan for this project.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const ms     = Date.now() - start;
    const status = res.statusCode;
    const color  =
      status >= 500 ? '\x1b[31m' :   // red
      status >= 400 ? '\x1b[33m' :   // yellow
      status >= 300 ? '\x1b[36m' :   // cyan
                      '\x1b[32m';    // green
    const reset = '\x1b[0m';
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${color}${status}${reset} ${method} ${originalUrl} — ${ms}ms`);
    }
  });

  next();
}

module.exports = requestLogger;
