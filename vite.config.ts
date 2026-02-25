// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from 'path';

const localhost = "http://localhost";
export default defineConfig({
    server: {
        proxy: {
            "/api": {
                // target: "",
                target: `${localhost}:3000`,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, "")
            },
            "/apiMedia": {
                target: `${localhost}:8000`,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/apiMedia/, `${localhost}:8000`,)
            },
            "/login": {
                target: `${localhost}:3000`,
                changeOrigin: true,
            },
            "/register": {
                target: `${localhost}:3000`,
                changeOrigin: true,
            },
            "/reset": {
                target: `${localhost}:3000`,
                changeOrigin: true,
            },
            "/logout": {
                target: `${localhost}:3000`,
                changeOrigin: true,
            },
        }
    },
    build: {
        sourcemap: process.env.GENERATE_SOURCEMAP === "true",
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                crumbs: resolve(__dirname, 'pages/crumbs.html'),
                addEditCrumb: resolve(__dirname, 'pages/addEditCrumb.html'),
                compact: resolve(__dirname, 'pages/compact.html'),
                crumb: resolve(__dirname, 'pages/crumb.html'),
                finTech: resolve(__dirname, 'pages/apps/fintech.html'),
                appHayDay: resolve(__dirname, 'pages/apps/hayDay.html'),
            }
        }
    }
});
