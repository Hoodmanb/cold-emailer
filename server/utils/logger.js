const { logLevel } = require('../config/env');

const levels = {
  low: 0,
  medium: 1,
  high: 2,
};

const currentLevel = levels[logLevel] !== undefined ? levels[logLevel] : levels.medium;

function log(level, message, meta) {
  const levelMap = {
    error: 0,
    warn: 1,
    info: 1, // Treat info as medium+
    debug: 2,
  };

  if (levelMap[level] > currentLevel) return;

  const out = level === 'error' ? console.error 
            : level === 'warn' ? console.warn 
            : level === 'info' ? console.info 
            : console.log;
            
  if (meta !== undefined) {
    out(`[${level.toUpperCase()}] ${message}`, meta);
  } else {
    out(`[${level.toUpperCase()}] ${message}`);
  }
}

const logger = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};

module.exports = logger;
