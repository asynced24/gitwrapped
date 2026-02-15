// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryEnabled =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" &&
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.05,
    enableLogs: false,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
