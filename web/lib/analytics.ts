type EventName =
  | "lead_buy_submit"
  | "lead_dealer_submit"
  | "lead_callback_submit"
  | "contact_submit"
  | "review_submit";

declare global {
  interface Window {
    ym?: (id: number, method: string, target: string) => void;
  }
}

export function trackEvent(event: EventName) {
  if (typeof window !== "undefined" && window.ym) {
    const ymId = process.env.NEXT_PUBLIC_YM_ID;
    if (ymId) {
      window.ym(Number(ymId), "reachGoal", event);
    }
  }
}
