// app/dashboard/changelog/page.tsx
import Link from "next/link";
import { ChevronLeft, Sparkles, Check, Clock } from "lucide-react";

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs font-medium transition hover:opacity-100"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tighter" style={{ color: 'var(--text-primary)' }}>
        Build roadmap
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        What&apos;s live, what&apos;s next, and what&apos;s on the horizon.
      </p>

      <div
        className="mt-8 rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--app-elevated)',
          border: '1px solid var(--app-border)',
        }}
      >
        <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
          <RoadmapColumn
            done
            label="Live now"
            items={[
              "Multi-tenant auth",
              "Per-account dashboard",
              "Manual trade entry + CSV import",
              "KPIs + equity curve + drawdown",
              "Analytics (12 charts)",
              "Calendar heatmap",
              "Playbook system",
              "Notebook / session planner",
              "Progress tracker",
              "AI insights (Gemini)",
              "Mentor mode",
              "MT5 EA auto-sync",
            ]}
          />
          <RoadmapColumn
            label="Coming next"
            items={[
              "Broker API sync (direct cTrader/Oanda)",
              "Interactive charts with trade execution plots",
              "Risk & position sizing calculator",
              "Custom mistakes & emotional triggers report",
              "Mobile PWA app",
              "Trade replay / bar-by-bar simulator",
              "Dashboard customizer",
            ]}
          />
          <RoadmapColumn
            label="After that"
            items={[
              "Auto account locking (Shield) on drawdown",
              "Prop firm challenge rules tracking",
              "Community features & leaderboards",
              "Shareable trade cards",
              "White-label / team & school portals",
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function RoadmapColumn({
  done,
  label,
  items,
}: {
  done?: boolean;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
        {done ? (
          <>
            <Check className="h-3 w-3" style={{ color: 'var(--accent-profit)' }} />
            <span style={{ color: 'var(--accent-profit)' }}>{label}</span>
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          </>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li
            key={it}
            style={{ color: done ? 'var(--text-secondary)' : 'var(--text-muted)' }}
          >
            · {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
