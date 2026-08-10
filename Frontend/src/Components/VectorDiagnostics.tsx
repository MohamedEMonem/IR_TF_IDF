import { useState } from "react";
import type { RankResponseWithPagination } from "../types/api";

interface VectorDiagnosticsProps {
  results: RankResponseWithPagination | null;
  query: string;
}

export default function VectorDiagnostics({ results, query }: VectorDiagnosticsProps) {
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);

  if (!results) return null;

  const totalMatches =
    results.pagination?.total_matches ?? results.results?.length ?? 0;
  const searchTimeSec = results.rank_time_ms
    ? (results.rank_time_ms / 1000).toFixed(4)
    : "0.0000";

  const maxTfidf = Math.max(
    ...(results.query.details?.map((d) => d.tfidf) ?? [1]),
    0.0001
  );

  return (
    <div className="w-full mb-8 font-sans">
      {/* Search Meta & Statistics Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 mb-4 border-b border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            About <strong className="font-semibold text-slate-900">{totalMatches.toLocaleString()}</strong> results
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-500">{searchTimeSec}s</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">
            N = <strong className="font-mono text-slate-800 font-semibold">{results.corpus.total_documents.toLocaleString()}</strong> docs
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">
            |V| = <strong className="font-mono text-slate-800 font-semibold">{results.corpus.unique_terms.toLocaleString()}</strong> terms
          </span>
        </div>

        <button
          onClick={() => setShowDiagnostics((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors cursor-pointer select-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${showDiagnostics ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {showDiagnostics ? "Hide Diagnostics" : "Vector Diagnostics"}
        </button>
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4 animate-slide-up">
          {/* Header & Formula Notation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Vector Space Model Diagnostics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Query: <span className="font-semibold text-slate-900">"{query}"</span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              <span>
                ||q||₂ = <strong className="text-blue-700 font-semibold">{results.query.norm.toFixed(6)}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Formula: <span className="text-slate-800 font-semibold">TF × log(N / DF)</span>
              </span>
            </div>
          </div>

          {/* Parsed Tokens Row */}
          {results.query.tokens && results.query.tokens.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 font-medium mr-1">Parsed Tokens:</span>
              {results.query.tokens.map((token, idx) => (
                <span
                  key={`${token}-${idx}`}
                  className="px-2 py-0.5 bg-white font-mono text-slate-800 rounded border border-slate-200 shadow-2xs"
                >
                  t[{idx}]: {token}
                </span>
              ))}
            </div>
          )}

          {/* Diagnostics Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">Term</th>
                  <th className="px-3.5 py-2.5 text-center">Count</th>
                  <th className="px-3.5 py-2.5 text-right">TF</th>
                  <th className="px-3.5 py-2.5 text-right">DF</th>
                  <th className="px-3.5 py-2.5 text-right">IDF</th>
                  <th className="px-3.5 py-2.5 text-right">Vector Weight (w_q)</th>
                  <th className="px-3.5 py-2.5 w-36">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {results.query.details && results.query.details.length > 0 ? (
                  results.query.details.map((d) => {
                    const weightPct = Math.min(100, Math.round((d.tfidf / maxTfidf) * 100));
                    const vectorWeight = results.query.vector?.[d.term] ?? d.tfidf;
                    return (
                      <tr key={d.term} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2 font-sans font-semibold text-blue-700">
                          {d.term}
                        </td>
                        <td className="px-3.5 py-2 text-center font-sans">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                            {d.count}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-right">{d.tf.toFixed(4)}</td>
                        <td className="px-3.5 py-2 text-right">{d.df.toLocaleString()}</td>
                        <td className="px-3.5 py-2 text-right text-amber-700">{d.idf.toFixed(5)}</td>
                        <td className="px-3.5 py-2 text-right font-bold text-slate-900">{vectorWeight.toFixed(5)}</td>
                        <td className="px-3.5 py-2">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${weightPct}%` }}
                              className="bg-blue-600 h-full rounded-full"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3.5 py-4 text-center text-slate-400 font-sans italic">
                      No query term details available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
