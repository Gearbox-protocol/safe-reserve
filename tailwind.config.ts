import { preset } from "@gearbox-protocol/permissionless-ui/preset";
import type { Config } from "tailwindcss";

const config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./node_modules/@gearbox-protocol/permissionless-ui/dist/**/*.js",
  ],
} satisfies Config;

export default config;
