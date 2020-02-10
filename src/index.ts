import moment from "moment";
import { AxiosError } from "axios";

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

interface LogParams {
    id: string;
    timestamp?: string;
    message: string;
    level: string;
    context?: any;
}

interface Handler {
    (...args: any[]): void;
}

export function inspect(context: any = {}) {
    Object.entries(context || {}).forEach(([key, value]) => {
        console.log(`${cyan(key)}: `, value);
    });
}

function _formatter({
    timestamp = moment().format("YYYY-MM-DD HH:mm:ss:SSS"),
    message,
    level,
    id,
}: LogParams) {
    return `${timestamp} ${id} ${level} | ${message}`;
}

export class Logger {
    private _handlers: Record<string, Handler[]> = {};

    constructor(
        public readonly _debug: boolean,
        public readonly _id: string,
        private _formatter: (params: LogParams) => string
    ) {
        this._handlers;
    }

    public emit(event: string) {
        (this._handlers[event] || []).forEach(handler => handler());
    }

    public on(event: string, handler: () => void) {
        if (!this._handlers[event]) {
            this._handlers[event] = [];
        }

        if (this._handlers[event].includes(handler)) {
            return;
        }

        this._handlers[event].push(handler);
    }

    public log(params: LogParams) {
        console.log(this._formatter(params));
    }

    public inspect(context: any = {}) {
        Object.entries(context || {}).forEach(([key, value]) => {
            console.log(`${cyan(key)}: `, value);
        });
    }

    public debug(message: string, context?: any): void {
        if (this._debug) {
            this.log({
                message,
                context,
                id: this._id,
                level: cyan("DEBUG".padEnd(7)),
            });

            this.inspect(context);

            this.emit("debug");
        }
    }

    public info(message: string) {
        this.log({
            message,
            id: this._id,
            level: green("INFO".padEnd(7)),
        });

        this.emit("info");
    }

    public warning(message: string, context?: any) {
        this.log({
            message,
            context,
            id: this._id,
            level: orange("WARNING".padEnd(7)),
        });

        this.inspect(context);

        this.emit("warning");
    }

    public error(error: Error) {
        this.log({
            message: error.message,
            id: this._id,
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
                : {
                      ...err,
                      stack: err.stack,
                  }
        );

        this.emit("error");
    }
}

export default loggerFactory();

interface Factory {
    debug?: boolean;
    id?: string;
    formatter?: (params: LogParams) => string;
}
export function loggerFactory({
    debug = true,
    id = `[${process.pid.toString()}]`.padStart(7),
    formatter = _formatter,
}: Factory = {}) {
    return new Logger(debug, id, formatter);
}
