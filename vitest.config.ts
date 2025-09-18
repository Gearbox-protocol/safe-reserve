import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import type { TestSequencerConstructor } from "vitest/node";
import CustomSequencer from "./test/setup/sequencer";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ["test/**/*.test.ts"],
    setupFiles: [],
    globalSetup: ["./test/setup/anvil.ts"],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      concurrent: false,
      // @note: keep oracle tests first to avoid troubles with update txs and timestamps
      sequencer: CustomSequencer as unknown as TestSequencerConstructor,
    },
  },
});
