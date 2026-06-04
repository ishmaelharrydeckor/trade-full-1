// components/account/EaDownloadPanel.tsx
"use client";

import { useState } from "react";
import {
  Download,
  Check,
  Copy,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EaDownloadPanel({
  accountId,
  accountName,
  eaToken,
}: {
  accountId: string;
  accountName: string;
  eaToken: string;
}) {
  const [tokenCopied, setTokenCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // The webhook URL the user needs to whitelist in MT5
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";

  async function copy(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.02] to-transparent p-5 backdrop-blur lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-300" />
        <h3 className="font-serif text-lg">Connect MT5 — live sync</h3>
        <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-blue-300">
          New
        </span>
      </div>

      <p className="mb-5 text-sm text-slate-300">
        Drop our expert advisor on any chart in MT5 → every closed trade and
        open position syncs to this dashboard automatically. No manual exports.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={`/api/ea/download?accountId=${accountId}`}
          download
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
        >
          <Download className="h-4 w-4" />
          Download configured EA
        </a>
        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          <ShieldCheck className="h-4 w-4" />
          {showInstructions ? "Hide" : "Show"} setup steps
        </button>
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        File:{" "}
        <span className="font-mono">
          TradeFull1_{accountName.replace(/[^a-zA-Z0-9-_]/g, "_")}.mq5
        </span>{" "}
        — already filled in with your token + the right URL. Just open in MT5.
      </div>

      {showInstructions && (
        <div className="mt-5 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <Step
            n={1}
            title="Drop the .mq5 into your MT5 Experts folder"
          >
            In MT5: <Code>File → Open Data Folder</Code> → navigate to{" "}
            <Code>MQL5 → Experts</Code> → paste the downloaded file there.
          </Step>

          <Step n={2} title="Refresh the Navigator panel">
            Right-click the <Code>Experts</Code> folder in the MT5 Navigator
            panel → <Code>Refresh</Code> (or press F5). You should now see{" "}
            <Code>TradeFull1Sync</Code> in the list.
          </Step>

          <Step n={3} title="Whitelist our URL in MT5">
            <div className="mb-2">
              In MT5: <Code>Tools → Options → Expert Advisors</Code> →
              <ul className="my-2 list-disc space-y-0.5 pl-5">
                <li>✓ Allow algorithmic trading</li>
                <li>✓ Allow WebRequest for listed URL</li>
                <li>Click "Add new URL" and paste:</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-2">
              <code className="flex-1 font-mono text-xs text-blue-200 break-all">
                {webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => copy(webhookUrl, setUrlCopied)}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white"
              >
                {urlCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Then click <Code>OK</Code>. (You only do this once for the
              browser/MT5 combo.)
            </div>
          </Step>

          <Step n={4} title="Drag the EA onto any chart">
            Open any chart (which chart doesn't matter — the EA monitors your
            whole account). Drag <Code>TradeFull1Sync</Code> from Navigator
            onto the chart. In the dialog, check{" "}
            <Code>Allow algorithmic trading</Code>, click <Code>OK</Code>.
          </Step>

          <Step n={5} title="Confirm it's running" last>
            You should see a <strong>smiley face emoji</strong> 🙂 in the top
            right of the chart, and lines in the{" "}
            <Code>Experts</Code> tab at the bottom saying{" "}
            <Code>TradeFull1Sync v1.00 initialized</Code>. Any new trades you
            close will start landing in your journal within ~10 seconds.
          </Step>

          {/* Token display (for manual setup or troubleshooting) */}
          <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs">
            <summary className="cursor-pointer text-slate-400">
              Need your raw token? (For manual setup / troubleshooting)
            </summary>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-2">
              <code className="flex-1 break-all font-mono text-[11px] text-slate-300">
                {eaToken}
              </code>
              <button
                type="button"
                onClick={() => copy(eaToken, setTokenCopied)}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white"
              >
                {tokenCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </details>
        </div>
      )}

      <div
        className="mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs"
        style={{
          borderColor: "rgba(217, 119, 6, 0.25)",
          backgroundColor: "rgba(217, 119, 6, 0.04)",
          color: "var(--text-secondary)",
        }}
      >
        <AlertCircle
          className="mt-0.5 h-3 w-3 shrink-0"
          style={{ color: "var(--accent-warm)" }}
        />
        <span>
          <strong style={{ color: "var(--accent-warm)" }}>
            Keep your account token private.
          </strong>{" "}
          Anyone with the token can push trades into this account. If it leaks,
          delete this account and create a new one — that invalidates the old
          token.
        </span>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
  last,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("relative pl-8", !last && "pb-4")}>
      <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-semibold text-blue-300">
        {n}
      </div>
      <div className="mb-1 text-sm font-medium text-white">{title}</div>
      <div className="text-xs leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-blue-200">
      {children}
    </code>
  );
}
