import moment from "moment";
import { AxiosError } from "axios";

export interface LogContext {
    timestamp: string;
    message: string;
    level: string;
    context?: any;
    id: string;
}

export interface Handler {
    (payload: LogContext): void;
}

export interface Formatter {
    (payload: LogContext): string;
}

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

const isAxiosError = (err: any): err is AxiosError => Boolean(err.isAxiosError);

function emit(event: string, payload: LogContext) {
    (_handlers[event] || []).forEach((handler) => handler(payload));
}

const _handlers: Record<string, Handler[]> = {};

export type Logger = ReturnType<typeof createLogger>;
export function createLogger({
    debug = true,
    id = "",
    formatter,
    colours = true,
}: {
    debug?: boolean;
    id?: string;
    formatter?: Formatter;
    colours?: boolean;
} = {}) {
    function defaultFormatter({ timestamp, message, level, id }: LogContext) {
        let _timestamp = moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
        return `${_timestamp} ${id} ${level.padEnd(
            colours ? 16 : 7
        )} | ${message}`;
    }

    function log(level: string, message: string, context?: any) {
        let payload = {
            id,
            timestamp: moment().toISOString(),
            context,
            message,
            level,
        };

        console.log(formatter?.(payload) ?? defaultFormatter(payload));

        return payload;
    }

    return {
        id(_id: string) {
            return createLogger({
                debug,
                id: _id,
                formatter,
            });
        },

        formatter(_formatter: Formatter) {
            return createLogger({
                debug,
                id,
                formatter: _formatter,
            });
        },

        on(event: "debug" | "info" | "warning" | "error", handler: Handler) {
            if (!_handlers[event]) {
                _handlers[event] = [];
            }

            if (_handlers[event].includes(handler)) {
                return;
            }

            _handlers[event].push(handler);
        },

        inspect(context?: any) {
            if (!context) {
                return;
            }

            let type = `type: ${typeof context}`;
            console.log(colours ? red(type) : type);

            if (typeof context === "object" || Array.isArray(context)) {
                Object.entries(context).forEach(([key, value]) => {
                    console.log(`${colours ? cyan(key) : key}: `, value);
                });
            } else {
                console.log(context.toString());
            }
        },

        debug(message: string, context?: any): void {
            if (debug) {
                let level = "DEBUG";

                let logContext = log(
                    colours ? cyan(level) : level,
                    message,
                    context
                );

                emit("debug", logContext);

                this.inspect(context);
            }
        },

        info(message: string, context?: any) {
            let level = "INFO";
            let logContext = log(
                colours ? green(level) : level,
                message,
                context
            );

            emit("info", logContext);
        },

        warning(message: string, context?: any) {
            let level = "WARNING";
            let logContext = log(
                colours ? orange(level) : level,
                message,
                context
            );

            emit("warning", logContext);
        },

        error(err: Error | AxiosError) {
            let level = "ERROR";
            let context = isAxiosError(err)
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
                  };

            let logContext = log(
                colours ? red(level) : level,
                err.message,
                context
            );

            emit("error", logContext);
        },
    };
}

export default createLogger();
