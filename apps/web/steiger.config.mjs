import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // shadcn/ui components are imported per file (`@/shared/ui/button`),
    // so the Shared layer does not expose a single barrel index.
    files: ["./src/shared/**"],
    rules: {
      "fsd/public-api": "off",
    },
  },
  {
    // Entities mirror the backend data contract (one slice per domain concept),
    // so they exist even while a single page consumes them.
    files: ["./src/entities/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
