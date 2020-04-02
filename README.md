
# Logger

```ts
import {createLogger} from "@bahatron/logger"

let myLogger = createLogger({
    debug: false,
    id: "my logger id",
});

myLogger.on("error", context => {
    // webhook to slack
    // webhook to sentry/bugsnag
    // do your thing
});

myLogger.warning("warning", {foo: "bar"});
```