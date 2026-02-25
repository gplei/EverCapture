const LogLevel = {
    TRACE: 0,
    INFO: 1,
    DEBUG: 2,
    WARNING: 3,
    ERROR: 4,
    ALWAYS: 5
};

class Logger {
    constructor(level = LogLevel.ERROR) {
        this.logs = [];
        this.currentLevel = level;
    }

    shouldLog(level) {
        return level >= this.currentLevel;
    }

    log(level, message) {
        if (this.shouldLog(level)) {
            const logEntry = this.formatLog(level, message);
            this.outputLog(level, logEntry);
            this.logs.push(logEntry);
        }
    }

    logAlways(message)    {this.log(LogLevel.ALWAYS, message); }
    logTrace(message) { this.log(LogLevel.TRACE, message); }
    logDebug(message) { this.log(LogLevel.DEBUG, message); }
    logInfo(message) { this.log(LogLevel.INFO, message); }
    logWarning(message) { this.log(LogLevel.WARNING, message); }
    logError(message) { this.log(LogLevel.ERROR, message); }

    formatLog(level, message) {
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
        //   return `[${timestamp}] [${levelName}] ${message}`;
        return level === LogLevel.ALWAYS ? message : `[${levelName}] ${message}`;
    }

    outputLog(level, logEntry) {
        switch (level) {
            case LogLevel.TRACE:
            case LogLevel.DEBUG:
                console.debug(logEntry);
                break;
            case LogLevel.INFO:
                console.info(logEntry);
                break;
            case LogLevel.WARNING:
                console.warn(logEntry);
                break;
            case LogLevel.ERROR:
                console.error(logEntry);
                break;
            default:
                console.log(logEntry);
        }
    }

    getLogs() { return this.logs; }
    clearLogs() { this.logs = []; }
}

export const logger = new Logger(LogLevel.DEBUG);
