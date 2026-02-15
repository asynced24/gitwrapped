// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b8a242c0fb3881ccef6ccd7a5cc10fbe@o4510890878894080.ingest.us.sentry.io/4510890905567232",

  // Sample 10% of traces to stay within free tier
  tracesSampleRate: 0.1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Do NOT send user PII (IP addresses, cookies, etc.)
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
