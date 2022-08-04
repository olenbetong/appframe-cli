import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import appframe from "@olenbetong/appframe-vite";

// https://vitejs.dev/config/
export default defineConfig(() => ({
    plugins: [react(), appframe()],
    appType: "custom",  
    optimizeDeps: {
        esbuildOptions: { target: ["es2020"] },
    },
    build: { target: ["chrome90", "safari14"] },
}));
