import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  // Push notification handlers (src/worker/index.ts), bundled into sw.js.
  customWorkerSrc: "src/worker",
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // "Anywhere" check-in/out uploads a selfie (capped at 2MB in the action).
      bodySizeLimit: "3mb",
    },
  },
};

export default withPWA(nextConfig);
