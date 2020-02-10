import { loggerFactory } from "..";
import { expect } from "chai";

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
                return `Look mom, I'm on TV!`;
            },
        });

        logger.info("what's going on?");
    });

    it("can alter logger id", () => {
        const logger = loggerFactory({
            debug: false,
            id: "my_awesome_id",
            formatter: params => {
                expect(params.id).to.eq("my_awesome_id");
                return params.id as string;
            },
        });

        logger.info("testing id change");
    });
});
