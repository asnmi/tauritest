// src/texteditor/plugins/ChangePlugin/testLogger.ts
type LogEntry = {
  type: 'log' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: number;
};

class TestLogger {
  private logs: LogEntry[] = [];
  private static instance: TestLogger;

  private constructor() {}

  public static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  public log(message: string, data?: any): void {
    this.addLog('log', message, data);
    //console.log(message, data);
  }

  public warn(message: string, data?: any): void {
    this.addLog('warn', message, data);
  }

  public error(message: string, data?: any): void {
    this.addLog('error', message, data);
    //console.log(message, data);
  }

  public clear(): void {
    this.logs = [];
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getFilteredLogs(type?: 'log' | 'warn' | 'error'): LogEntry[] {
    if (!type) return this.getLogs();
    return this.logs.filter(entry => entry.type === type);
  }

  private addLog(type: 'log' | 'warn' | 'error', message: string, data?: any): void {
    this.logs.push({
      type,
      message,
      data,
      timestamp: Date.now()
    });
  }
}

export const logger = TestLogger.getInstance();