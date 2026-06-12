import { useEffect, useMemo, useState } from "react";
import type { NationalStats } from "@/lib/api/client";
import {
  computeISTForecastWindow,
  formatForecastHeader,
  parseForecastWindow,
} from "@/lib/forecastWindow";

export function useForecastWindow(nationalStats?: Pick<
  NationalStats,
  "forecastIssuedAt" | "forecastValidUntil"
>) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = globalThis.setInterval(() => setNow(Date.now()), 60_000);
    return () => globalThis.clearInterval(id);
  }, []);

  const window = useMemo(() => {
    const fromApi = parseForecastWindow(
      nationalStats?.forecastIssuedAt,
      nationalStats?.forecastValidUntil,
    );
    // Sanity-check: reject API timestamps that are more than 1 day in the future
    // or more than 1 day in the past. This protects against the backend returning
    // a stale DB-seeded timestamp (e.g. data_acquisition seeds future-dated rows).
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const isStale =
      fromApi &&
      (fromApi.issuedAt.getTime() > now + ONE_DAY_MS ||
        fromApi.issuedAt.getTime() < now - ONE_DAY_MS);
    if (fromApi && !isStale) return fromApi;
    return computeISTForecastWindow(new Date(now));
  }, [nationalStats?.forecastIssuedAt, nationalStats?.forecastValidUntil, now]);

  const headerLabel = useMemo(() => formatForecastHeader(window), [window]);

  return { window, headerLabel };
}
