import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardPredictions, getNationalStats } from "../lib/api/client";
import { computeISTForecastWindow } from "../lib/forecastWindow";
import { STATES as mockStates, DISTRICTS as mockDistricts, NATIONAL_STATS as mockNationalStats } from "../data/regions";

export function useRegionsData() {
  const statesQuery = useQuery({
    queryKey: ["regionsData", "states"],
    queryFn: () => getDashboardPredictions("state"),
    refetchInterval: 120000, // Refetch every 2 minutes matching background simulation loop
    staleTime: 60000,
    retry: 1,
  });

  const districtsQuery = useQuery({
    queryKey: ["regionsData", "districts"],
    queryFn: () => getDashboardPredictions("district"),
    refetchInterval: 120000,
    staleTime: 60000,
    retry: 1,
  });

  const nationalStatsQuery = useQuery({
    queryKey: ["regionsData", "nationalStats"],
    queryFn: getNationalStats,
    refetchInterval: 120000,
    staleTime: 60000,
    retry: 1,
  });

  const isLoading = statesQuery.isLoading || districtsQuery.isLoading || nationalStatsQuery.isLoading;
  const isError = statesQuery.isError || districtsQuery.isError || nationalStatsQuery.isError;

  // Gracefully fallback to mock data if backend server is offline or queries fail
  // Merge backend data with mock states/districts to ensure all states (like Sikkim) are present even if not in DB!
  const states = useMemo(() => {
    if (!statesQuery.data) return mockStates;
    const backendStates = statesQuery.data;
    const merged = [...backendStates];
    mockStates.forEach((ms) => {
      if (!backendStates.some((bs) => bs.id.toLowerCase() === ms.id.toLowerCase())) {
        merged.push(ms);
      }
    });
    return merged;
  }, [statesQuery.data]);

  const districts = useMemo(() => {
    if (!districtsQuery.data) return mockDistricts;
    const backendDists = districtsQuery.data;
    
    // Deduplicate backend districts by id to avoid duplicate React keys
    const uniqueBackendDists: Region[] = [];
    const seenIds = new Set<string>();
    backendDists.forEach((bd) => {
      const lowerId = bd.id.toLowerCase();
      if (!seenIds.has(lowerId)) {
        seenIds.add(lowerId);
        uniqueBackendDists.push(bd);
      }
    });

    const merged = [...uniqueBackendDists];
    mockDistricts.forEach((md) => {
      if (!seenIds.has(md.id.toLowerCase())) {
        seenIds.add(md.id.toLowerCase());
        merged.push(md);
      }
    });
    return merged;
  }, [districtsQuery.data]);
  
  const defaultNationalTrend = mockStates[0]?.trend?.map(t => ({ t: t.t, score: mockNationalStats.avgScore })) || [];
  const fallbackForecastWindow = computeISTForecastWindow();

  const nationalStats = nationalStatsQuery.data || {
    avgScore: mockNationalStats.avgScore,
    critical: mockNationalStats.critical,
    high: mockNationalStats.high,
    elevated: mockNationalStats.elevated,
    stable: mockNationalStats.stable,
    population: mockNationalStats.population,
    hospitals: mockNationalStats.hospitals,
    trend: defaultNationalTrend,
    forecastIssuedAt: fallbackForecastWindow.issuedAt.toISOString(),
    forecastValidUntil: fallbackForecastWindow.validUntil.toISOString(),
  };

  return {
    states,
    districts,
    nationalStats,
    isLoading,
    isError,
    refetch: () => {
      statesQuery.refetch();
      districtsQuery.refetch();
      nationalStatsQuery.refetch();
    }
  };
}
