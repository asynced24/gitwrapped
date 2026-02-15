// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryEnabled =
  process.env.NODE_ENV === "production" &&
  process.env.SENTRY_ENABLED === "true" &&
  Boolean(process.env.SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.05,
    enableLogs: false,
    sendDefaultPii: false,
  });
}
