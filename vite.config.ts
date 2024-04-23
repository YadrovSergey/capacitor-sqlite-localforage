import { defineConfig } from "vite";

export default defineConfig({
    root: "./src",
    build: {
        outDir: "../dist",
        minify: false,
        emptyOutDir: true,
        rollupOptions: {
            preserveEntrySignatures: "exports-only",
            output: {
                preserveModules: true,
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },
        },
    },
});
