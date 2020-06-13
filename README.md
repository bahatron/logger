# Logger

```ts
import { createLogger } from "@bahatron/logger";

let myLogger = createLogger({
    debug: false,
    id: "my logger id",
});

myLogger.on("warning", (context) => {
    // do your thing
});

myLogger.warning("warning", { foo: "bar" });
```
