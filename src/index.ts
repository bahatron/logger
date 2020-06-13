import moment from "moment";
import { AxiosError } from "axios";

export interface LogEntry {
    timestamp: string;
    message: string;
    level: string;
    context?: any;
    id: string;
}

export interface Handler {
    (payload: LogEntry): void;
}

export interface Formatter {
    (payload: LogEntry): string;
}

export type Logger = ReturnType<typeof createLogger>;

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

const isAxiosError = (err: any): err is AxiosError =>
    Boolean(err?.isAxiosError);

function buildErrorContext(err: any) {
    if (isAxiosError(err)) {
        return {
            req_config: {
                url: err.config?.url,
                method: err.config?.method,
                headers: err.config?.headers,
                data: err.config?.data,
            },
            res_status: err.response?.status,
            res_data: err.response?.data,
        };
    } else if (err instanceof Error) {
        return {
            ...err,
            stack: err.stack,
        };
    }

    return err;
}

async function emit(event: string, payload: LogEntry) {
    await Promise.all(
        (_handlers[event] || []).map((handler) => handler(payload))
    );
}

const _handlers: Record<string, Handler[]> = {};

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
    function defaultFormatter({ timestamp, message, level, id }: LogEntry) {
        let _timestamp = moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
        return `${_timestamp} ${level.padEnd(
            colours ? 16 : 7
        )} ${id} | ${message}`;
    }

    function log(level: string, message: string, context?: any): LogEntry {
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

        on(event: "debug" | "info" | "warning" | "error", handler: Handler) {
            if (!_handlers[event]) {
                _handlers[event] = [];
            }

            if (_handlers[event].includes(handler)) {
                return;
            }

            _handlers[event].push(handler);
        },

        inspect(payload?: any) {
            let type = `type: ${typeof payload}`;
            console.log(colours ? red(type) : type);

            if (!payload) {
                return;
            }

            if (typeof payload === "object" || Array.isArray(payload)) {
                Object.entries(payload).forEach(([key, value]) => {
                    console.log(`${colours ? cyan(key) : key}: `, value);
                });
            } else {
                console.log(payload);
            }
        },

        debug(message: string, context?: any) {
            if (!debug) {
                return;
            }

            let level = "DEBUG";

            let entry = log(colours ? cyan(level) : level, message, context);

            return emit("debug", entry);
        },

        info(message: string, context?: any): Promise<void> {
            let level = "INFO";
            let entry = log(colours ? green(level) : level, message, context);

            return emit("info", entry);
        },

        warning(message: string, context?: any): Promise<void> {
            let level = "WARNING";
            let entry = log(colours ? orange(level) : level, message, context);

            return emit("warning", entry);
        },

        error(message: string, err?: any): Promise<void> {
            let level = "ERROR";

            let entry = log(
                colours ? red(level) : level,
                message,
                buildErrorContext(err)
            );

            return emit("error", entry);
        },
    };
}

export default createLogger();
