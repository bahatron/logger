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

export type EventType = "debug" | "info" | "warning" | "error";

export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[96m${text}\x1b[0m`;
export const orange = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

const ERROR_LEVEL = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
} as const;

// enum ERROR_LEVEL_ENUM {
//     DEBUG = "DEBUG",
//     INFO = "INFO",
//     WARNING = "WARNING",
//     ERROR = "ERROR",
// }

function stringify(payload: any): any {
    if (
        ["object", "function"].includes(typeof payload) ||
        Array.isArray(payload)
    ) {
        return JSON.stringify(payload, null, 4);
    }

    return payload;
}

const isAxiosError = (err: any): err is AxiosError =>
    Boolean(err?.isAxiosError);

const HANDLERS: Record<string, Handler[]> = {};

async function emit(event: string, payload: LogEntry) {
    await Promise.all(
        (HANDLERS[event] || []).map((handler) => handler(payload))
    );
}

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
    function defaultFormatter({
        timestamp,
        message,
        level,
        id,
        context,
    }: LogEntry) {
        let _timestamp = moment(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
        return `${_timestamp} ${level.padEnd(
            colours ? 16 : 7
        )} ${id} | ${message}${context ? `\n${stringify(context)}` : ""}`;
    }

    function log(level: string, message: string, context?: any): LogEntry {
        let payload = {
            timestamp: moment().toISOString(),
            id,
            message,
            context,
            level,
        };

        console.log(formatter?.(payload) ?? defaultFormatter(payload));

        return payload;
    }

    return {
        id(_id: string) {
            return createLogger({
                id: _id,
                debug,
                colours,
                formatter,
            });
        },

        on(event: EventType, handler: Handler) {
            if (!HANDLERS[event]) {
                HANDLERS[event] = [];
            }

            if (HANDLERS[event].includes(handler)) {
                return;
            }

            HANDLERS[event].push(handler);
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

        async debug(message: string, context?: any): Promise<void> {
            if (!debug) {
                return;
            }

            let level = ERROR_LEVEL.DEBUG;

            let entry = log(
                colours ? cyan(level) : level,
                message,
                buildErrorContext(context)
            );

            return emit("debug", entry);
        },

        async info(message: string, context?: any): Promise<void> {
            let level = ERROR_LEVEL.INFO;

            let entry = log(colours ? green(level) : level, message, context);

            return emit("info", entry);
        },

        async warning(message: string, context?: any): Promise<void> {
            let level = ERROR_LEVEL.WARNING;

            let entry = log(colours ? orange(level) : level, message, context);

            return emit("warning", entry);
        },

        async error(err: any, message?: string): Promise<void> {
            let level = ERROR_LEVEL.ERROR;

            let entry = log(
                colours ? red(level) : level,
                message ?? err.message ?? "",
                buildErrorContext(err)
            );

            return emit("error", entry);
        },
    };
}

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
            stack: new Error().stack,
        };
    } else if (err instanceof Error) {
        return {
            ...err,
            stack: new Error().stack,
        };
    }

    return err;
}

export default createLogger();
