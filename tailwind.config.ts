import preset from "@gearbox-protocol/permissionless-ui/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./node_modules/@gearbox-protocol/permissionless-ui/dist/**/*.{js,jsx}",
  ],
};

export default config;
