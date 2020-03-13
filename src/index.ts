import moment from "moment";
import { AxiosError } from "axios";

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

export interface LogContext {
    timestamp: string;
    message: string;
    level: string;
    context?: any;
    id: string;
}

interface Handler {
    (payload: LogContext): void;
}

function defaultFormatter({ timestamp, message, level, id }: LogContext) {
    let _timestamp = moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
    return `${_timestamp} ${id} ${level} | ${message}`;
}

const _handlers: Record<string, Handler[]> = {};

export type Logger = LoggerClass;
class LoggerClass {
    constructor(
        public readonly _debug: boolean,
        public readonly _id: string,
        public readonly _formatter: (payload: LogContext) => string
    ) {}

    private emit(event: string, payload: LogContext) {
        (_handlers[event] || []).forEach(handler => handler(payload));
    }

    public on(event: string, handler: Handler) {
        if (!_handlers[event]) {
            _handlers[event] = [];
        }

        if (_handlers[event].includes(handler)) {
            return;
        }

        _handlers[event].push(handler);
    }

    public id(id: string): Logger {
        return Logger({ debug: this._debug, id, formatter: this._formatter });
    }

    public formatter(formatter: LoggerClass["_formatter"]): Logger {
        return Logger({ debug: this._debug, id: this._id, formatter });
    }

    private log(level: string, message: string, context?: any) {
        let payload = {
            id: this._id,
            timestamp: moment().toISOString(),
            context,
            message,
            level,
        };

        console.log(this._formatter(payload));

        return payload;
    }

    public inspect(context?: any) {
        if (context === undefined) {
            return;
        }

        console.log(`${red(typeof context)}`);

        if (typeof context === "object" || Array.isArray(context)) {
            Object.entries(context || {}).forEach(([key, value]) => {
                console.log(`${cyan(key)}: `, value);
            });
        } else {
            console.log((context ?? {}).toString());
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

    public info(message: string, context?: any) {
        this.emit("info", this.log(green("INFO".padEnd(7)), message));
        this.inspect(context);
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
                      req_config: {
                          url: err.config?.url,
                          method: err.config?.method,
                          headers: err.config?.headers,
                          data: err.config?.data,
                      },
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

// backwards compatability
export { Logger as loggerFactory };

export default Logger();
export function Logger({
    debug = true,
    id = `[${process.pid.toString()}]`.padStart(7),
    formatter = defaultFormatter,
}: {
    debug?: boolean;
    id?: string;
    formatter?: (payload: LogContext) => string;
} = {}) {
    return new LoggerClass(debug, id, formatter);
}
