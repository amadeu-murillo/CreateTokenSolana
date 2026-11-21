/**
 * Lightweight, privacy-first Web3 funnel analytics helper.
 * Dispatches structured events to GA4 (gtag), optional PostHog, and dataLayer
 * without ever transmitting private keys, seed phrases, or sensitive user PII.
 */

export type AnalyticsEventName =
  | "wallet_connected"
  | "affiliate_ref_captured"
  | "token_creation_started"
  | "token_creation_confirmed"
  | "token_creation_failed"
  | "share_clicked";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;

  const cleanParams: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      cleanParams[key] = value;
    }
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, cleanParams);
    }

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...cleanParams });
    }

    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(eventName, cleanParams);
    }
  } catch {
    // Never let analytics failures impact on-chain UX
  }
}
