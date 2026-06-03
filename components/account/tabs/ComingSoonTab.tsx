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
    <div
      className="rounded-xl border-dashed p-12 text-center backdrop-blur"
      style={{
        border: '1px dashed var(--app-muted)',
        backgroundColor: 'var(--app-surface)',
      }}
    >
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}
      >
        <Construction className="h-6 w-6" style={{ color: 'var(--warning)' }} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  );
}
