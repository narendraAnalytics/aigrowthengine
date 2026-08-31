import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, Serwist } from "serwist";

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /**
     * SECURITY: never let the service worker cache tenant / authenticated data.
     * Anything under /api, /admin, /dashboard, /investor-room, the Clerk auth
     * routes, the authenticated assessment route, or that carries an
     * Authorization header must always hit the network.
     */
    {
      matcher: ({ url, request }) =>
        url.pathname.startsWith("/api") ||
        url.pathname.startsWith("/admin") ||
        url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/investor-room") ||
        url.pathname.startsWith("/business-assessment") ||
        url.pathname.startsWith("/__clerk") ||
        url.pathname.startsWith("/sign-in") ||
        url.pathname.startsWith("/sign-up") ||
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
