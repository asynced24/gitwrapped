import * as Sentry from "@sentry/nextjs";

const sentryEnabled =
  process.env.NODE_ENV === "production" &&
  process.env.SENTRY_ENABLED === "true";

export async function register() {
  if (!sentryEnabled) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = (...args: Parameters<typeof Sentry.captureRequestError>) => {
  if (!sentryEnabled) return;
  return Sentry.captureRequestError(...args);
};
