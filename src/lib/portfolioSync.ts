/**
 * Cross-tab / cross-tree "portfolio changed" signal.
 *
 * The admin panel calls notifyPortfolioChanged() after a successful save.
 * Every open public page (same tab or other tabs of the same browser)
 * receives it and re-fetches the latest rows from Supabase.
 */

const CHANNEL = "hhs-portfolio";
const EVENT = "hhs:portfolio-changed";

export function notifyPortfolioChanged(): void {
  window.dispatchEvent(new Event(EVENT));
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage({ type: "changed", at: Date.now() });
    bc.close();
  } catch {
    /* BroadcastChannel unsupported — other tabs refresh on focus instead */
  }
}

export function onPortfolioChanged(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => cb();
  } catch {
    bc = null;
  }
  return () => {
    window.removeEventListener(EVENT, cb);
    bc?.close();
  };
}
