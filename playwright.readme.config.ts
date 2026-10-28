import path from "node:path";

import { defineConfig } from "@playwright/test";

import { STORAGE_STATE } from "./e2e/support";
import base from "./playwright.config";

// The README's screenshots and its recording, taken from the demo data on
// the end-to-end stack (a production build with the fake AI server and job
// sources; see DEVELOPMENT.md). Not part of `yarn test:e2e`. After `yarn build`:
//
//   docker/bin/yarn playwright test --config playwright.readme.config.ts
//
// The screenshots replace .github/images/*.png; the recording lands in
// test-results/readme/demo.webm, to convert to .github/images/demo.gif.
export default defineConfig({
  ...base,
  outputDir: "test-results/readme",
  reporter: [["list"]],
  retries: 0,
  projects: [
    { name: "setup", testMatch: /setup\.ts$/ },
    {
      name: "readme",
      testMatch: /readme-(images|video)\.ts$/,
      use: { ...base.use, storageState: path.resolve(STORAGE_STATE) },
      dependencies: ["setup"],
    },
  ],
});
