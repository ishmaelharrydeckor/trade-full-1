// components/account/tabs/ComingSoonTab.tsx
import { Construction } from "lucide-react";

export default function ComingSoonTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
        <Construction className="h-6 w-6 text-amber-400" />
      </div>
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  );
}
