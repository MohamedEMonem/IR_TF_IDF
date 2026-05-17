import { useState } from "react";
import type { RankResponseWithPagination } from "../types/api";

interface VectorDiagnosticsProps {
  results: RankResponseWithPagination | null;
  query: string;
}

export default function VectorDiagnostics({ results, query }: VectorDiagnosticsProps) {
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);
  const [insightsTab, setInsightsTab] = useState<"overview" | "vector" | "details">("overview");

  if (!results) return null;

  return (
    <div className="w-full">
      {/* Global Corpus Statistics Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-[#70757a] bg-linear-to-br from-gray-50/90 via-white to-gray-50/50 backdrop-blur-md rounded-2xl px-6 py-3.5 border border-gray-200/50 w-full shadow-xs animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-2xs">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Corpus Size (N)</span>
            <span className="font-bold text-[#202124] text-base mt-1">
              {results.corpus.total_documents.toLocaleString()} <span className="text-xs text-gray-400 font-light font-sans ml-0.5">indexed docs</span>
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200/80 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100 shadow-2xs">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Vocabulary Size</span>
            <span className="font-bold text-[#202124] text-base mt-1">
              {results.corpus.unique_terms.toLocaleString()} <span className="text-xs text-gray-400 font-light font-sans ml-0.5">unique terms</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 antialiased">
          <div className="text-sm font-light text-[#70757a]">
            About{" "}
            <span className="font-semibold text-[#202124]">
              {results.pagination?.total_matches
                ? results.pagination.total_matches.toLocaleString()
                : results.results?.length
                  ? results.results.length.toLocaleString()
                  : "-"}
            </span>{" "}
            matching results found
          </div>
          <span className="text-[#d0d0d0]">|</span>
          <div className="text-sm text-[#9aa0a6] font-light">
            <span className="font-semibold text-[#4285f4]">
              {results.rank_time_ms
                ? (results.rank_time_ms / 1000).toFixed(4)
                : "0.4200"}
            </span>{" "}
            seconds
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border border-gray-200 bg-gray-50/80 text-[#70757a] hover:bg-gray-100 hover:text-[#202124] transition-all duration-300 active:scale-95 shadow-2xs"
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
              className={`size-3.5 transition-transform duration-300 ${showDiagnostics ? "rotate-180" : ""}`}
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            {showDiagnostics ? "Hide Query Insights" : "Show Query Insights"}
          </button>
          <div className="hidden sm:block text-sm text-[#70757a] font-light">
            Searching for:{" "}
            <span className="font-semibold text-[#202124] italic">"{query}"</span>
          </div>
        </div>
      </div>

      {/* Query & Corpus summary (from RankResponse) with Rich Aesthetics */}
      {showDiagnostics && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-gray-100 shadow-xl shadow-blue-500/5 transition-all duration-500 animate-slide-up">
          {/* Insights Panel Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 px-6 py-4 bg-linear-to-r from-gray-50/50 via-white to-gray-50/50 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#202124] text-sm md:text-base">
                  Vector Space Model Diagnostics
                </h3>
                <p className="text-xs text-[#70757a] font-light">
                  Real-time TF-IDF calculation values and query-specific diagnostics
                </p>
              </div>
            </div>

            {/* Tabs selector */}
            <div className="flex rounded-lg bg-gray-100/80 p-0.5 self-start md:self-center">
              <button
                onClick={() => setInsightsTab("overview")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  insightsTab === "overview"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setInsightsTab("vector")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  insightsTab === "vector"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Query Vector
              </button>
              <button
                onClick={() => setInsightsTab("details")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  insightsTab === "details"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Term Details
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="p-6">
            {/* TAB 1: OVERVIEW */}
            {insightsTab === "overview" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Query Norm */}
                  <div className="group relative rounded-xl border border-gray-100 bg-linear-to-br from-yellow-500/5 to-amber-50/10 p-4 transition-all duration-300 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-2 text-xs text-[#70757a] font-medium">
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
                        className="text-[#fbbc04]"
                      >
                        <line x1="4" y1="9" x2="20" y2="9" />
                        <line x1="4" y1="15" x2="20" y2="15" />
                        <line x1="10" y1="3" x2="8" y2="21" />
                        <line x1="16" y1="3" x2="14" y2="21" />
                      </svg>
                      Query Vector Norm
                    </div>
                    <div className="text-xl font-mono font-bold text-[#202124]">
                      {results.query.norm.toFixed(6)}
                    </div>
                    <div className="text-[11px] text-[#70757a] mt-1 font-light">
                      Vector length: <span className="font-mono text-xs">||q||₂</span>
                    </div>
                  </div>

                  {/* Query Tokens Count */}
                  <div className="group relative rounded-xl border border-gray-100 bg-linear-to-br from-blue-500/5 to-indigo-50/10 p-4 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-2 text-xs text-[#70757a] font-medium">
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
                        className="text-blue-500"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Query Tokens
                    </div>
                    <div className="text-xl font-bold text-[#202124]">
                      {results.query.tokens ? Object.keys(results.query.tokens).length : 0}
                    </div>
                    <div className="text-[11px] text-[#70757a] mt-1 font-light">
                      Unique parsed search terms
                    </div>
                  </div>

                  {/* Rank Depth (Top K) */}
                  <div className="group relative rounded-xl border border-gray-100 bg-linear-to-br from-purple-500/5 to-fuchsia-50/10 p-4 transition-all duration-300 hover:shadow-md hover:shadow-purple-500/5 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-2 text-xs text-[#70757a] font-medium">
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
                        className="text-purple-500"
                      >
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                      Rank Depth (k)
                    </div>
                    <div className="text-xl font-bold text-[#202124]">
                      {results.corpus.top_k || 10}
                    </div>
                    <div className="text-[11px] text-[#70757a] mt-1 font-light">
                      Max ranking retrieval depth
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#70757a] tracking-wider">
                      Active Query Summary
                    </div>
                    <div className="text-sm font-semibold text-[#202124]">
                      "{results.query.query}"
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {results.query.tokens.map((token, idx) => (
                      <span
                        key={`${token}-${idx}`}
                        className="px-2.5 py-1 bg-white border border-gray-200/80 rounded-lg text-xs font-mono text-[#202124] shadow-xs hover:border-blue-400 hover:text-blue-600 transition-colors cursor-default"
                      >
                        t[{idx}]: {token}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUERY VECTOR */}
            {insightsTab === "vector" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[#70757a] tracking-wider">
                      Query Coordinate Space
                    </h4>
                    <p className="text-xs text-[#70757a] font-light mt-0.5">
                      Visualizing non-zero dimensions in the term coordinate space
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-gray-100 rounded-md text-[#202124]">
                    Dimension count: {Object.keys(results.query.vector || {}).length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Visual Coordinates (Enhanced) */}
                  <div className="space-y-5 p-6 rounded-2xl bg-white border border-gray-100 shadow-xs transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-4 text-xs font-bold text-[#202124] uppercase tracking-wider">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-500"
                      >
                        <line x1="12" y1="20" x2="12" y2="10" />
                        <line x1="18" y1="20" x2="18" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="16" />
                      </svg>
                      Vector Coordinate Weights
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {Object.entries(results.query.vector || {}).map(([term, val]) => {
                        const maxVal = Math.max(...Object.values(results.query.vector || {}), 0.001);
                        const percentage = Math.round((val / maxVal) * 100);
                        return (
                          <div key={term} className="group space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-md transition-colors group-hover:bg-blue-100">{term}</span>
                              <span className="font-mono font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">{val.toFixed(5)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                              <div
                                style={{ width: `${percentage}%` }}
                                className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                              />
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(results.query.vector || {}).length === 0 && (
                        <div className="text-sm text-gray-500 italic py-4">No non-zero coordinate dimensions found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TERM DETAILS */}
            {insightsTab === "details" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[#70757a] tracking-wider">
                      Term Frequency details & calculation walkthrough
                    </h4>
                    <p className="text-xs text-[#70757a] font-light mt-0.5">
                      Understand step-by-step how the TF-IDF weight is resolved for each token
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 self-start sm:self-center">
                    Formula: <span className="font-mono text-blue-600 font-semibold">TF-IDF = TF × log(N / DF)</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-linear-to-r from-gray-50 to-blue-50/20 text-[#202124] border-b border-gray-100">
                        <th className="px-4 py-3 font-semibold">Term</th>
                        <th className="px-4 py-3 font-semibold text-center">Count</th>
                        <th className="px-4 py-3 font-semibold text-right">TF (Term Freq)</th>
                        <th className="px-4 py-3 font-semibold text-right">DF (Doc Freq)</th>
                        <th className="px-4 py-3 font-semibold text-right">IDF (Inv Doc Freq)</th>
                        <th className="px-4 py-3 font-semibold text-right bg-blue-50/30 text-blue-700">TF-IDF Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.query.details && results.query.details.length > 0 ? (
                        results.query.details.map((d) => (
                          <tr
                            key={d.term}
                            className="border-b border-gray-100 hover:bg-blue-50/25 transition-all duration-150"
                          >
                            <td className="px-4 py-3 font-semibold text-[#4285f4] font-mono">
                              {d.term}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">
                              <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full font-semibold text-[11px]">
                                {d.count}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-gray-600">
                              {d.tf.toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-gray-600">
                              {d.df.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-amber-600 font-semibold">
                              {d.idf.toFixed(5)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/15">
                              {d.tfidf.toFixed(5)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-400 italic">
                            No term metrics details parsed from RankResponse
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
