import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "./bindings/generated.ts",
  contracts: [],
  plugins: [
    foundry({
      include: ["SafeStorage.sol/**.json", "Safe.sol/**.json"],
    }),
  ],
});
