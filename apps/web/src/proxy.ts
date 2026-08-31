import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed `middleware` to `proxy`. Clerk's `clerkMiddleware()`
// returns the handler; export it as the default proxy function.
// No routes are protected here — every landing-page route stays public and
// auth is opt-in via Clerk components. Authorize at the resource for any
// future tenant-scoped route.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API/proxy routes
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
