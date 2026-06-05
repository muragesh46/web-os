const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m',
};

class Logger {
  constructor() {
    this.currentLevel = levels[process.env.LOG_LEVEL || 'INFO'];
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  log(level, message, meta = {}) {
    if (levels[level] > this.currentLevel) return;

    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };

    const formattedLog = `[${timestamp}] [${level}] ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`;

    // Console output with colors
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${colors[level]}${formattedLog}${colors.RESET}`);
    }

    // File output
    // const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    // fs.appendFileSync(logFile, formattedLog + '\n');

    // Combined log
    // const combinedFile = path.join(logsDir, 'combined.log');
    // fs.appendFileSync(combinedFile, formattedLog + '\n');
  }

  error(message, meta) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta) {
    this.log('WARN', message, meta);
  }

  info(message, meta) {
    this.log('INFO', message, meta);
  }

  debug(message, meta) {
    this.log('DEBUG', message, meta);
  }
}

module.exports = new Logger();
