import { createLogger } from "..";
import { expect } from "chai";

describe("logger", () => {
    const _logger = createLogger();

    it("emits and prints debug", async () => {
        return new Promise((resolve) => {
            _logger.on("debug", () => {
                resolve();
            });
            _logger.debug("debug");
        });
    });

    it("emits and prints info", async () => {
        return new Promise((resolve) => {
            _logger.on("info", () => {
                resolve();
            });
            _logger.info("info");
        });
    });

    it("emits and prints warning", async () => {
        return new Promise((resolve) => {
            _logger.on("warning", () => {
                resolve();
            });
            _logger.warning("warning");
        });
    });

    it("emits and prints error", async () => {
        return new Promise((resolve) => {
            _logger.on("error", () => {
                resolve();
            });
            _logger.error(new Error("error"));
        });
    });

    it("can set formatter", () => {
        const logger = createLogger({
            debug: true,
            formatter: (params) => {
                return JSON.stringify(params, null, 4);
            },
        });

        logger.info("what's going on?");

        logger
            .formatter((params) => "all of your bases are belong to me")
            .info("changing the formatter!");
    });

    it("can set logger id", () => {
        const logger = createLogger({
            debug: false,
            id: "my_awesome_id",
            formatter: (params) => {
                return `${params.level} id: ${params.id} - message: ${params.message}`;
            },
        });

        logger.info("testing id change");

        let newLogger = logger.id("my_awesome_changed_id");

        newLogger.info("testing id change id changed");
    });
});

describe("immutable loggers", () => {
    const _logger = createLogger({ debug: false, id: "immb21" });

    it("calls all event handlers attached from any event", async () => {
        return new Promise(async (resolve) => {
            const loggerA = _logger.id("loggerA");
            const loggerB = _logger.id("loggerB");
            const loggerC = _logger.id("loggerC");

            Promise.all(
                [loggerA, loggerB, loggerC, _logger].map(
                    (logger) =>
                        new Promise(async (resolve) => {
                            let levels = ["info", "warning", "error"] as const;

                            resolve(
                                await Promise.all(
                                    levels.map(
                                        (level) =>
                                            new Promise(async (_resolve) => {
                                                logger.on(level, (event) => {
                                                    _resolve(event);
                                                });
                                            })
                                    )
                                )
                            );
                        })
                )
            ).then(resolve);

            loggerA.info("info");
            loggerB.warning("warning");
            loggerC.error(<any>{ isAxiosError: true });
        });
    });
});

describe("no colours settings", () => {
    let _logger = createLogger({ colours: false, id: "[no colours]" });

    it("does not display colours", () => {
        _logger.debug("debug no colours");
        _logger.info("info no colours");
        _logger.warning("warning no colours");
        _logger.error(new Error("error no colours"));
    });
});
