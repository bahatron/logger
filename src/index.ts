import moment from "moment";
import { AxiosError } from "axios";

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

interface LogContext {
    timestamp: string;
    message: string;
    level: string;
    context?: any;
    id: string;
}

interface Handler {
    (payload: LogContext): void;
}

function _log({ timestamp, message, level, id }: LogContext) {
    console.log(`${timestamp} ${id} ${level} | ${message}`);
}

export class Logger {
    private _handlers: Record<string, Handler[]> = {};

    constructor(
        public readonly _debug: boolean,
        public readonly _id: string,
        public readonly _log?: (payload: LogContext) => void
    ) {}

    private emit(event: string, payload: LogContext) {
        (this._handlers[event] || []).forEach(handler => handler(payload));
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

    private log(level: string, message: string, context: any = {}) {
        let payload = {
            id: this._id,
            timestamp: moment().format("YYYY-MM-DD HH:mm:ss.SSS"),
            context,
            message,
            level,
        };

        this._log ? this._log(payload) : _log(payload);

        return payload;
    }

    public inspect(context: any = {}) {
        if (typeof context === "object" || Array.isArray(context)) {
            Object.entries(context || {}).forEach(([key, value]) => {
                console.log(`${cyan(key)}: `, value);
            });
        } else {
            console.log(`${cyan(typeof context)}: ${context}`);
        }
    }

    public debug(message: string, context?: any): void {
        if (this._debug) {
            this.emit(
                "debug",
                this.log(cyan("DEBUG".padEnd(7)), message, context)
            );

            this.inspect(context);
        }
    }

    public info(message: string) {
        this.emit("info", this.log(green("INFO".padEnd(7)), message));
    }

    public warning(message: string, context?: any) {
        this.emit(
            "warning",
            this.log(orange("WARNING".padEnd(7)), message, context)
        );

        this.inspect(context);
    }

    public error(error: Error) {
        this.emit("error", this.log(red("ERROR".padEnd(7)), error.message));

        let err: any = error;
        this.inspect(
            (err as AxiosError).isAxiosError
                ? {
                      req_config: err.request.config,
                      res_status: err.response?.status,
                      res_data: err.response?.data,
                  }
                : {
                      ...err,
                      stack: err.stack,
                  }
        );
    }
}

export default loggerFactory();

export function loggerFactory({
    debug = true,
    id = `[${process.pid.toString()}]`.padStart(7),
    formatter,
}: {
    debug?: boolean;
    id?: string;
    formatter?: (payload: LogContext) => void;
} = {}) {
    return new Logger(debug, id, formatter);
}
