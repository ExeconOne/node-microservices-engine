import util from 'util'; // For formatting log messages like console.log
import path from 'path';
import fs from 'fs';

// Logger function that returns a logging object for a specific file path
const createLogger = (appInfo, requestId) => {
    const logDir = appInfo.path;
    const logFilePath = path.join(logDir, `${appInfo.id}-${appInfo.version}.log`)
  
    // Ensure the log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  
    return {
        log: (...args) => {
            const logMessage = `[${new Date().toISOString()}] [${requestId||""}] LOG: ${util.format(...args)}\n`;
            fs.appendFileSync(logFilePath, logMessage);
        },
        error: (...args) => {
            const logMessage = `[${new Date().toISOString()}] [${requestId||""}] ERROR: ${util.format(...args)}\n`;
            fs.appendFileSync(logFilePath, logMessage);
        },
        warn: (...args) => {
            const logMessage = `[${new Date().toISOString()}] [${requestId||""}] WARN: ${util.format(...args)}\n`;
            fs.appendFileSync(logFilePath, logMessage);
        },
    };
  };


export class Logger{        
    constructor(appInfo){
        this.appInfo = appInfo;
        const logDir = appInfo.path;
        this.logFilePath = path.join(logDir, `${appInfo.id}-${appInfo.version}.log`)
        this.id = Math.random().toString(36).substring(2, 10)

    
        // Ensure the log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    log(...args){
        const logMessage = `[${new Date().toISOString()}] [${this.id||""}] LOG: ${util.format(...args)}\n`;
        fs.appendFileSync(this.logFilePath, logMessage);
    }
    error(...args){
        const logMessage = `[${new Date().toISOString()}] [${this.id||""}] ERROR: ${util.format(...args)}\n`;
        fs.appendFileSync(this.logFilePath, logMessage);
    }
    warn(...args){
        const logMessage = `[${new Date().toISOString()}] [${this.id||""}] WARN: ${util.format(...args)}\n`;
        fs.appendFileSync(this.logFilePath, logMessage);
    }
}
  
export class LoggerFactory{
    static getInstance(appInfo){
        const appLogger = new Logger(appInfo)
    }
}

  export default createLogger;