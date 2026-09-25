/**
 * Admin vs public entry-point detection.
 *
 * WHY THIS IS MORE THAN `location.hash`:
 * Arena (and similar preview hosts) serve a wrapper page at "/" and load the
 * app in an <iframe src="/?embed=true"> with a FIXED src. When a visitor opens
 * https://site/#/admin/login the "#/admin/login" belongs to the OUTER page;
 * the iframe's own hash is always empty. So the admin route must be read from
 * the parent (same-origin) window as well, and kept in sync both ways.
 *
 * The first decision is made by the inline <script> at the top of index.html
 * (window.__HHS_ENTRY__), which runs before this bundle is parsed.
 */

/** Matches #/admin…, #admin…, #!/admin… — but NOT #about, #/adminfoo, etc. */
const ADMIN_HASH = /^#!?\/?admin(?:[/?]|$)/i;

export type Entry = "admin" | "public";

export function isAdminHash(hash: string = window.location.hash): boolean {
  return ADMIN_HASH.test(hash);
}

/** "#admin/x" | "#!/admin/x" → "#/admin/x" */
function canonical(hash: string): string {
  return "#" + hash.replace(/^#!?\/?/, "/");
}

/** Same-origin parent window when running inside a wrapper iframe, else null. */
export function parentWindow(): Window | null {
  try {
    if (window.top && window.top !== window) {
      void window.top.location.hash; // throws if cross-origin
      return window.top;
    }
  } catch {
    /* cross-origin parent — cannot read or sync */
  }
  return null;
}

/** The admin hash the visitor asked for: own hash first, then the parent's. */
export function requestedAdminHash(): string | null {
  if (isAdminHash(window.location.hash)) return canonical(window.location.hash);
  const parent = parentWindow();
  if (parent && isAdminHash(parent.location.hash)) return canonical(parent.location.hash);
  return null;
}

/** Rewrite own URL to the canonical admin hash without reloading the page. */
export function normaliseAdminHash(): void {
  const target = requestedAdminHash();
  if (target && window.location.hash !== target) {
    history.replaceState(
      history.state,
      "",
      window.location.pathname + window.location.search + target,
    );
  }
}

/**
 * Point the iframe's own hash at `target` with a real (same-document) fragment
 * navigation, so an already-mounted HashRouter receives the change.
 */
export function goToOwnHash(target: string): void {
  if (window.location.hash !== target) {
    window.location.replace(window.location.pathname + window.location.search + target);
  }
}

/**
 * Keep the visible address bar in step with the admin route when framed,
 * so refreshing the wrapper page returns to the same admin screen.
 * Uses replaceState (no navigation, no history entry, allowed in sandbox).
 */
export function mirrorToParent(hash: string): void {
  const parent = parentWindow();
  if (!parent) return;
  try {
    if (parent.location.hash !== hash) {
      parent.history.replaceState(
        parent.history.state,
        "",
        parent.location.pathname + parent.location.search + hash,
      );
    }
  } catch {
    /* parent refused — address bar just won't mirror */
  }
}

/** Entry chosen at startup — computed before React renders anything. */
export function initialEntry(): Entry {
  const early = (window as unknown as { __HHS_ENTRY__?: Entry }).__HHS_ENTRY__;
  if (early === "admin" || requestedAdminHash()) {
    normaliseAdminHash();
    return "admin";
  }
  return "public";
}
