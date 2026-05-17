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

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">
            {name}
          </h3>
          {path && (
            <div className="text-xs font-mono p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 mt-2 break-all max-w-full">
              {path}
            </div>
          )}
        </div>

        {/* Dynamic Corpus IDs Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {parsedMetadata.docId && (
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/10 shadow-3xs">
              Doc ID: #{parsedMetadata.docId}
            </span>
          )}
          {parsedMetadata.sourceId && (
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/10 shadow-3xs">
              Ref ID: #{parsedMetadata.sourceId}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
