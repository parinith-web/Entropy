import { bandFor, RISK_LABELS, type RiskBand } from "@/data/regions";

const STYLES: Record<RiskBand, string> = {
  stable: "bg-[color:var(--color-risk-stable)]/15 text-[color:var(--color-risk-stable)] ring-[color:var(--color-risk-stable)]/30",
  elevated: "bg-[color:var(--color-risk-elevated)]/15 text-[color:oklch(0.5_0.13_80)] ring-[color:var(--color-risk-elevated)]/40",
  high: "bg-[color:var(--color-risk-high)]/15 text-[color:var(--color-risk-high)] ring-[color:var(--color-risk-high)]/40",
  critical: "bg-destructive/12 text-destructive ring-destructive/40",
};

export function RiskBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const band = bandFor(score);
  const sizes = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${STYLES[band]} ${sizes[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {RISK_LABELS[band]} · {score}
    </span>
  );
}