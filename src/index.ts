import moment from "moment";
import { AxiosError } from "axios";
import { EventEmitter } from "events";
import { request } from "http";

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

interface Log {
    timestamp?: string;
    message: string;
    level: string;
    context?: any;
    id?: string;
}

interface Factory {
    debug?: boolean;
}

interface Handler {
    (...args: any[]): void;
}

type LoggerType = Logger;

export { LoggerType as Logger };

export function log({
    timestamp = moment().format("YYYY-MM-DD HH:mm:ss:SSS"),
    message,
    level,
    context,
    id = process.pid.toString().padStart(5),
}: Log) {
    console.log(`${timestamp} [${id}] ${level} | ${message}`);
}

export function inspect(context: any = {}) {
    Object.entries(context || {}).forEach(([key, value]) => {
        console.log(`${cyan(key)}: `, value);
    });
}

class Logger {
    private _handlers: Record<string, Handler[]> = {};

    constructor(public readonly DEBUG: boolean) {
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

    public once(event: string, handler: Handler) {
        const cb = () =>
            this._handlers[event].splice(
                this._handlers[event].indexOf(handler),
                1
            );

        this.on(event, handler);
        this.on(event, cb);
    }

    public debug(message: string, context?: any): void {
        if (this.DEBUG) {
            log({
                message,
                context,
                level: cyan("DEBUG".padEnd(7)),
            });

            inspect(context);

            this.emit("debug");
        }
    }

    public info(message: string) {
        log({
            message,
            level: green("INFO".padEnd(7)),
        });

        this.emit("info");
    }

    public warning(message: string, context?: any) {
        log({
            message,
            context,
            level: orange("WARNING".padEnd(7)),
        });

        inspect(context);

        this.emit("warning");
    }

    public error(error: Error) {
        log({
            message: error.message,
            context,
            level: red("ERROR".padEnd(7)),
        });

        let err: any = error;
        let responseStatus = () => {
            return err.response ? err.response.status : null;
        };
        let requestConfig = () => {
            return err.request.config;
        };

        inspect(
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
export function loggerFactory({ debug = true }: Factory = {}) {
    return new Logger(debug);
}
