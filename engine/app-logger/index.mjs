import util from 'util'; // For formatting log messages like console.log
import path from 'path';
import fs from 'fs';

// Logger function that returns a logging object for a specific file path
const createLogger = (appInfo) => {
    const logDir = appInfo.path;
    const logFilePath = path.join(logDir, `${appInfo.id}-${appInfo.version}.log`)
  
    // Ensure the log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  
    return {
        log: (...args) => {
            const logMessage = `[${new Date().toISOString()}] ${util.format(...args)}\n`;
            fs.appendFileSync(logFilePath, logMessage);
        },
        error: (...args) => {
            const logMessage = `[${new Date().toISOString()}] ERROR: ${util.format(...args)}\n`;
            fs.appendFileSync(logFilePath, logMessage);
        },
        warn: (...args) => {
            const logMessage = `[${new Date().toISOString()}] WARN: ${util.format(...args)}\n`;
            fs.appendFileSync(logFilePath, logMessage);
        },
    };
  };

  export default createLogger;