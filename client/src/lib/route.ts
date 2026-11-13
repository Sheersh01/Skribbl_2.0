import { useSyncExternalStore } from 'react';

/** Tiny router: "/" is home, "/r/ABCDE" is a room link. */

const ROUTE_EVENT = 'dg:route';

export function codeFromPath(pathname = window.location.pathname): string | null {
  const m = /^\/r\/([a-z]{5})\/?$/i.exec(pathname);
  return m ? m[1].toUpperCase() : null;
}

export function navigate(path: string, replace = false): void {
  if (window.location.pathname === path) return;
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb);
  window.addEventListener(ROUTE_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(ROUTE_EVENT, cb);
  };
};

/** The room code in the URL, or null on the home page. */
export function useRouteCode(): string | null {
  return useSyncExternalStore(subscribe, () => codeFromPath());
}
