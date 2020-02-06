import { loggerFactory } from "../src";
import { resolve } from "dns";

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
});
