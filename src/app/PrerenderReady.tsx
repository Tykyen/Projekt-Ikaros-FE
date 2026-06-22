import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";

// 15B.1 — signál pro prerender sidecar, že SPA dořešila data a je možné
// pořídit snímek HOTOVÉHO HTML (ne skeletonu / spinneru).
//
// No-op pro lidi: flag nikdo v běžném provozu nečte, jen ho po renderu
// odečte headless Chromium v prerenderu (viz prerender/index.js).
//
// Logika: jakmile počet běžících dotazů klesne na 0, naplánujeme flag s krátkou
// prodlevou. Pokud mezitím začne další dotaz (vodopád / závislé queries),
// cleanup timeout zruší a čeká dál → flag padne až po DOBĚHNUTÍ všech.
// Statická stránka bez dotazů: fetching je 0 hned → flag po prodlevě.
declare global {
  interface Window {
    __PRERENDER_READY__?: boolean;
  }
}

export function PrerenderReady() {
  const fetching = useIsFetching();

  useEffect(() => {
    if (fetching !== 0) return;
    const id = window.setTimeout(() => {
      window.__PRERENDER_READY__ = true;
    }, 300);
    return () => window.clearTimeout(id);
  }, [fetching]);

  return null;
}
