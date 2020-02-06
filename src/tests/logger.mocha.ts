import { loggerFactory } from "..";

describe("logger", () => {
    const _logger = loggerFactory();

    it("emits and prints debug", async () => {
        return new Promise(resolve => {
            _logger.on("debug", () => {
                resolve();
            });
            _logger.debug("debug");
        });
    });

    it("emits and prints info", async () => {
        return new Promise(resolve => {
            _logger.on("info", () => {
                resolve();
            });
            _logger.info("info");
        });
    });

    it("emits and prints warning", async () => {
        return new Promise(resolve => {
            _logger.on("warning", () => {
                resolve();
            });
            _logger.warning("warning");
        });
    });

    it("emits and prints error", async () => {
        return new Promise(resolve => {
            _logger.on("error", () => {
                resolve();
            });
            _logger.error(new Error("error"));
        });
    });

    it("can alter log message", () => {
        const logger = loggerFactory({
            debug: true,
            formatter: params => {
                console.log(params);
                console.log(`Look mom, I'm on TV!`);
            },
        });

        logger.info("what's going on?");
    });
});
