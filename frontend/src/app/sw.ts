import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /**
     * SECURITY: never let the service worker cache tenant / authenticated data.
     * Anything under /api, /admin, /dashboard, /investor-room or that carries an
     * Authorization header must always hit the network.
     */
    {
      matcher: ({ url, request }) =>
        url.pathname.startsWith("/api") ||
        url.pathname.startsWith("/admin") ||
        url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/investor-room") ||
        request.headers.has("Authorization"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
