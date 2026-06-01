// components/trades/CsvImport.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseTradesCsv, guessAssetClass, type ParseResult } from "@/lib/csv-parser";
import { fmtSignedUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step = "drop" | "preview" | "importing" | "done";

export default function CsvImport({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("drop");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File) {
    setParsing(true);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseTradesCsv(text);
      setResult(parsed);
      setStep("preview");
      setParsing(false);
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
      setParsing(false);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  async function handleImport() {
    if (!result) return;
    setStep("importing");
    setImportError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setImportError("Session expired. Please sign in again.");
      setStep("preview");
      return;
    }

    const validRows = result.rows.filter((r) => r._errors.length === 0);
    const records = validRows.map((r) => ({
      user_id: user.id,
      account_id: accountId,
      external_trade_id: r.external_trade_id,
      symbol: r.symbol!,
      asset_class: guessAssetClass(r.symbol!),
      direction: r.direction!,
      volume: r.volume!,
      entry_price: r.entry_price!,
      exit_price: r.exit_price,
      open_time: r.open_time!,
      close_time: r.close_time,
      pnl: r.pnl,
      commission: r.commission,
      swap: r.swap,
      stop_loss: r.stop_loss,
      take_profit: r.take_profit,
    }));

    // Insert in batches of 100 to avoid request size limits.
    // `onConflict: external_trade_id,account_id` means existing trades are silently
    // ignored — making re-imports safe (dedup via UNIQUE constraint).
    let successCount = 0;
    let conflictCount = 0;
    const BATCH = 100;

    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const { data, error } = await supabase
        .from("trades")
        .upsert(batch, {
          onConflict: "account_id,external_trade_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        setImportError(`Batch ${i / BATCH + 1} failed: ${error.message}`);
        setStep("preview");
        return;
      }

      const inserted = data?.length ?? 0;
      successCount += inserted;
      conflictCount += batch.length - inserted;
    }

    setImported(successCount);
    setSkipped(conflictCount + result.errorCount);
    setStep("done");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[color:var(--bg-panel)] p-5 md:max-w-3xl md:rounded-2xl md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl tracking-tight">Import trades from CSV</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "drop" && (
          <DropStep
            isDragging={isDragging}
            parsing={parsing}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onFileSelected={(file) => handleFile(file)}
            inputRef={fileInputRef}
          />
        )}

        {step === "preview" && result && (
          <PreviewStep
            result={result}
            onImport={handleImport}
            onCancel={() => {
              setResult(null);
              setStep("drop");
            }}
            importError={importError}
          />
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center py-10 text-center">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-400" />
            <p className="text-sm text-slate-300">Importing trades…</p>
            <p className="mt-1 text-xs text-slate-500">
              Inserting in batches of 100. Don&apos;t close this window.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-10 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-400" />
            <h3 className="font-serif text-2xl">Import complete</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="text-2xl font-bold tabular-nums text-emerald-300">
                  {imported}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400">
                  Imported
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold tabular-nums text-slate-300">
                  {skipped}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Skipped
                </div>
              </div>
            </div>
            <p className="mt-3 max-w-md text-xs text-slate-500">
              Duplicate trades (same ticket already imported) are skipped
              automatically — safe to re-import the same file.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================
// Step 1: drag-and-drop zone
// ===========================================================
function DropStep({
  isDragging,
  parsing,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onFileSelected,
  inputRef,
}: {
  isDragging: boolean;
  parsing: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onFileSelected: (file: File) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <>
      <p className="mb-4 text-sm text-slate-400">
        Drop a CSV file exported from MetaTrader, cTrader, Tradovate, or any
        broker that exports trade history with a header row. Columns are
        auto-detected.
      </p>

      <div
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition",
          isDragging
            ? "border-blue-400 bg-blue-500/10"
            : "border-white/15 bg-white/[0.02] hover:border-blue-500/40 hover:bg-blue-500/5"
        )}
      >
        {parsing ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-400" />
            <p className="text-sm text-slate-300">Parsing CSV…</p>
          </>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-slate-500" />
            <p className="text-sm font-medium text-slate-200">
              Click to choose a CSV file, or drag one here
            </p>
            <p className="mt-1 text-xs text-slate-500">
              We'll auto-detect Symbol, Direction, Volume, Entry/Exit, Time,
              P&L, and more
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelected(f);
          }}
          className="hidden"
        />
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
        <strong className="font-semibold text-amber-200">How to export from MT5:</strong>{" "}
        Right-click in the History tab → "Save as Report" → CSV. If your file
        is HTML/XLSX, open it in Excel and "Save As CSV" first.
      </div>
    </>
  );
}

// ===========================================================
// Step 2: preview + confirm
// ===========================================================
function PreviewStep({
  result,
  onImport,
  onCancel,
  importError,
}: {
  result: ParseResult;
  onImport: () => void;
  onCancel: () => void;
  importError: string | null;
}) {
  const valid = result.rows.filter((r) => r._errors.length === 0);
  const invalid = result.rows.filter((r) => r._errors.length > 0);
  const sample = valid.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Trades to import"
          value={result.validCount}
          tone="good"
        />
        <Stat
          label="Skipped (invalid)"
          value={result.errorCount}
          tone={result.errorCount > 0 ? "warn" : "neutral"}
        />
      </div>

      {/* Detected columns */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h4 className="mb-3 text-xs uppercase tracking-wider text-slate-400">
          Detected mapping
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs md:grid-cols-3">
          {Object.entries(result.detectedColumns).map(([field, col]) => (
            <div key={field} className="flex items-center justify-between gap-2">
              <span className="text-slate-400">
                {field.replace(/_/g, " ")}
              </span>
              <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
              <span
                className={cn(
                  "truncate font-mono",
                  col ? "text-emerald-300" : "text-slate-600"
                )}
                title={col ?? "—"}
              >
                {col ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sample rows preview */}
      {sample.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-slate-400">
            Sample (first 5 valid trades)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[600px] text-xs">
              <thead className="bg-white/[0.02] text-[9px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-2 py-2 text-left">Symbol</th>
                  <th className="px-2 py-2 text-left">Dir</th>
                  <th className="px-2 py-2 text-right">Vol</th>
                  <th className="px-2 py-2 text-right">Entry</th>
                  <th className="px-2 py-2 text-right">Exit</th>
                  <th className="px-2 py-2 text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sample.map((r) => (
                  <tr key={r._rowNumber} className="text-slate-200">
                    <td className="px-2 py-1.5 font-medium">{r.symbol}</td>
                    <td className="px-2 py-1.5 capitalize">{r.direction}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.volume?.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.entry_price}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.exit_price}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-1.5 text-right tabular-nums",
                        (r.pnl ?? 0) > 0
                          ? "text-emerald-300"
                          : (r.pnl ?? 0) < 0
                            ? "text-red-300"
                            : "text-slate-400"
                      )}
                    >
                      {r.pnl != null ? fmtSignedUsd(r.pnl) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors (if any) */}
      {invalid.length > 0 && (
        <details className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <summary className="cursor-pointer text-xs text-amber-200">
            <AlertCircle className="mr-1 inline h-3 w-3" />
            {invalid.length} row{invalid.length !== 1 && "s"} will be skipped
            (click to see why)
          </summary>
          <div className="mt-2 space-y-1 text-[11px] text-amber-100/70">
            {invalid.slice(0, 10).map((r) => (
              <div key={r._rowNumber}>
                Row {r._rowNumber}: {r._errors.join(", ")}
              </div>
            ))}
            {invalid.length > 10 && (
              <div className="text-amber-200/50">
                …and {invalid.length - 10} more
              </div>
            )}
          </div>
        </details>
      )}

      {importError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {importError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Choose different file
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={result.validCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          Import {result.validCount} trade{result.validCount !== 1 && "s"}
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "good"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : tone === "warn"
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-white/10 bg-white/[0.02]"
      )}
    >
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}
