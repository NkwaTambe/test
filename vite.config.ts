import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ReportHub",
        short_name: "EventRecorder",
        start_url: "/test/",
        scope: "/test/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#007bff",
        icons: [
          {
            src: "/test/download1.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/test/download2.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
