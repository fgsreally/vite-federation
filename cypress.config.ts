import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },

    specPattern: "test/e2e/**/*.{cy,spec,test}.{js,jsx,ts,tsx}",
  },
});
