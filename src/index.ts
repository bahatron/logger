import moment from "moment";
import { AxiosError } from "axios";

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

interface LogParams {
    timestamp?: string;
    message: string;
    level: string;
    context?: any;
    id?: string;
}

interface Factory {
    debug?: boolean;
    formatter?: (params: LogParams) => void;
}

interface Handler {
    (...args: any[]): void;
}

export function inspect(context: any = {}) {
    Object.entries(context || {}).forEach(([key, value]) => {
        console.log(`${cyan(key)}: `, value);
    });
}

export class Logger {
    private _handlers: Record<string, Handler[]> = {};

    public static _log = ({
        timestamp = moment().format("YYYY-MM-DD HH:mm:ss:SSS"),
        message,
        level,
        id = `[${process.pid.toString()}]`.padStart(7),
    }: LogParams) => {
        console.log(`${timestamp} ${id} ${level} | ${message}`);
    };

    public log: (params: LogParams) => void;

    constructor(public readonly DEBUG: boolean, loggerHandler = Logger._log) {
        this.log = loggerHandler;
        this._handlers;
    }

    public emit(event: string, ...args: any[]) {
        (this._handlers[event] || []).forEach(handler => handler(...args));
    }

    public on(event: string, handler: Handler) {
        if (!this._handlers[event]) {
            this._handlers[event] = [];
        }

        if (this._handlers[event].includes(handler)) {
            return;
        }

        this._handlers[event].push(handler);
    }

    public inspect(context: any = {}) {
        Object.entries(context || {}).forEach(([key, value]) => {
            console.log(`${cyan(key)}: `, value);
        });
    }

    public debug(message: string, context?: any): void {
        if (this.DEBUG) {
            this.log({
                message,
                context,
                level: cyan("DEBUG".padEnd(7)),
            });

            this.inspect(context);

            this.emit("debug");
        }
    }

    public info(message: string) {
        this.log({
            message,
            level: green("INFO".padEnd(7)),
        });

        this.emit("info");
    }

    public warning(message: string, context?: any) {
        this.log({
            message,
            level: orange("WARNING".padEnd(7)),
        });

        this.inspect(context);

        this.emit("warning");
    }

    public error(error: Error) {
        this.log({
            message: error.message,
            level: red("ERROR".padEnd(7)),
        });

        let err: any = error;
        let responseStatus = () => {
            return err.response ? err.response.status : null;
        };
        let requestConfig = () => {
            return err.request.config;
        };

        this.inspect(
            (err as AxiosError).isAxiosError
                ? {
                      req_config: requestConfig(),
                      res_status: responseStatus(),
                      res_data: responseStatus(),
                  }
                : err
        );

        this.emit("error");
    }
}

export default loggerFactory();
export function loggerFactory({ debug = true, formatter }: Factory = {}) {
    return new Logger(debug, formatter);
}
