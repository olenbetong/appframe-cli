import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { addAppframeBuildConfig } from "@olenbetong/appframe-vite";

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  let config = {
    plugins: [react()],
    build: { target: ["chrome90", "safari14"] },
    resolve: {
      alias: [{ find: "@/", replacement: "/src/" }],
    },
  };

  if (command === "build") {
    await addAppframeBuildConfig(config);
  }

  return config;
});
