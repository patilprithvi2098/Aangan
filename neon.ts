import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    aangan: {
      name: "Aangan voice agent tools",
      source: "src/index.ts",
      env: {
        AGENT_API_KEY: process.env.AGENT_API_KEY!,
      },
    },
  },
});
