import { useMemo } from "react";

interface DocumentMetadataProps {
  name: string;
  path?: string;
  text?: string;
}

export default function DocumentMetadata({ name, path, text }: DocumentMetadataProps) {
  const parsedMetadata = useMemo(() => {
    if (!text) return { docId: null, sourceId: null };
    const headerMatch = text.trim().match(/^@@(\d+)(?:\s+@(\d+)\/?)?/);
    return {
      docId: headerMatch ? headerMatch[1] : null,
      sourceId: headerMatch ? headerMatch[2] : null,
    };
  }, [text]);

  const hasMetadata = Boolean(parsedMetadata.docId || parsedMetadata.sourceId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm animate-slide-up overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-linear-to-r from-blue-50/70 via-white to-teal-50/60">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500" />
          <h2 className="text-xs uppercase tracking-[0.14em] font-bold text-slate-500">
            Document Metadata
          </h2>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
        <div className="min-w-0 space-y-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Name
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug wrap-break-word">
                {name}
              </h3>
              {path?.toLowerCase().endsWith(".pdf") && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase text-red-600 bg-red-50 border border-red-200/80 rounded-md shadow-2xs select-none">
                  PDF
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Source Path
            </div>
            <div className="text-xs sm:text-[13px] font-mono text-slate-700 break-all leading-relaxed">
              {path || "Path unavailable"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap lg:flex-col lg:items-end items-center gap-2">
          {parsedMetadata.docId && (
            <span className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-blue-500/10 text-blue-700 border border-blue-500/20">
              DOC ID #{parsedMetadata.docId}
            </span>
          )}
          {parsedMetadata.sourceId && (
            <span className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-teal-500/10 text-teal-700 border border-teal-500/20">
              REF ID #{parsedMetadata.sourceId}
            </span>
          )}
          {!hasMetadata && (
            <span className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
              No header IDs found
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
