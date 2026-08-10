import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useRankDocumentsMutation } from "../redux/api/searchApi";
import type { RankResponseWithPagination } from "../types/api";
import VectorDiagnostics from "../Components/VectorDiagnostics";

const FALLBACK_QUERY = "information retrieval";

function highlightText(text: string, queryStr: string | null): string {
  if (!text || !queryStr) return text;

  const stopwords = new Set([
    "the", "a", "an", "and", "or", "in", "on", "of", "to", "for", "with",
    "by", "at", "is", "was", "were", "are", "be", "been", "this", "that",
    "it", "from", "as", "he", "she", "they", "we", "i", "you", "but"
  ]);

  const terms = queryStr
    .toLowerCase()
    .split(/[\s,.\-_/]+/)
    .filter((t) => t.length > 1 && !stopwords.has(t));

  if (terms.length === 0) return text;

  // Escape terms for Regex safety
  const escaped = terms.map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  return text.replace(regex, `<strong class="font-bold text-blue-800">$1</strong>`);
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || FALLBACK_QUERY;
  const [results, setResults] = useState<RankResponseWithPagination | null>(
    null,
  );
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [rankDocuments] = useRankDocumentsMutation();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setPage(1);
  }, [query]);

  // fetch when page changes
  useEffect(() => {
    if (!query) return;
    void rankDocuments({ query, top_k: pageSize, page, page_size: pageSize })
      .unwrap()
      .then((response) => setResults(response))
      .catch(() => setResults(null));
  }, [page, pageSize, query, rankDocuments]);

  console.log("q: ", query);
  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 transition-[padding] duration-500 ease-out py-8">
      <div className="max-w-4xl animate-fade-in pb-20">
        <VectorDiagnostics results={results} query={query} />

        <div className="space-y-14">
          {results ? (
            // Render each ranked document using the provided article layout
            results.results.map((r, idx) => {
              const rankIndex = (page - 1) * pageSize + idx + 1;
              return (
                <article
                  key={r.doc_id}
                  className="group animate-slide-up will-change-transform"
                >
                  <div className="py-2 px-3 -mx-2 rounded-2xl hover:bg-linear-to-r hover:from-blue-50/40 hover:to-purple-50/40 transition-all duration-300 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-7 rounded-lg bg-linear-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-xs font-semibold text-blue-600 shadow-2xs border border-blue-200/40 font-mono">
                          #{rankIndex}
                        </div>
                        <div className="text-sm text-[#202124]/60 group-hover:text-[#4285f4] font-normal antialiased tracking-wide transition-colors duration-200">
                          {r.path}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-xs text-[#70757a] font-light px-3 py-1 bg-gray-50 rounded-full">
                          Doc {r.doc_id}
                        </div>
                        <button
                          className="p-1.5 hover:bg-blue-50/40 rounded-full transition-colors duration-200 cursor-pointer"
                          title={
                            expandedIds.has(r.doc_id) ? "collapse" : "expand"
                          }
                          aria-label={
                            expandedIds.has(r.doc_id) ? "collapse" : "expand"
                          }
                          onClick={() => toggleExpanded(r.doc_id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`lucide lucide-chevron-up size-4 text-[#4285f4] transform transition-transform duration-200 ${expandedIds.has(r.doc_id) ? "-rotate-180" : ""}`}
                          >
                            <path d="m18 15-6-6-6 6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {r.path?.toLowerCase().endsWith(".pdf") ? (
                      <a
                        href={`/api/document/${r.doc_id}?raw=true`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-wrap items-center gap-2 group/title mb-3"
                        title="Open in Microsoft Edge PDF Viewer"
                      >
                        <h3 className="text-2xl sm:text-3xl text-[#1a0dab] group-hover/title:text-[#1a73e8] leading-snug font-normal tracking-tight antialiased transition-colors duration-200 hover:underline">
                          {r.name}
                        </h3>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase text-red-600 bg-red-50 border border-red-200/80 rounded-md shadow-2xs select-none">
                          PDF
                        </span>
                      </a>
                    ) : (
                      <Link
                        to={`/document/${r.doc_id}`}
                        state={{ query }}
                        className="inline-flex flex-wrap items-center gap-2 group/title mb-3"
                      >
                        <h3 className="text-2xl sm:text-3xl text-[#1a0dab] group-hover/title:text-[#1a73e8] leading-snug font-normal tracking-tight antialiased transition-colors duration-200 hover:underline">
                          {r.name}
                        </h3>
                      </Link>
                    )}

                    <div className="mb-2 pl-4 border-l-2 border-blue-200/40 transition-colors duration-300">
                      <p
                        className="text-sm text-[#4285f4] font-normal italic antialiased"
                        dangerouslySetInnerHTML={{ __html: highlightText(r.snippet, query) }}
                      />
                    </div>
                  </div>

                {expandedIds.has(r.doc_id) && (
                  <div className="mt-4 px-4 py-6 bg-linear-to-br from-blue-50/60 to-purple-50/60 rounded-2xl border border-blue-100/50 animate-fade-in shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#202124] uppercase tracking-wide">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-file-text size-4 text-[#4285f4]"
                          >
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                            <path d="M10 9H8" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                          </svg>
                          Document Information
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#70757a]">
                              Doc ID:
                            </span>
                            <span className="text-sm font-medium text-[#202124]">
                              {r.doc_id}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#70757a]">
                              Path:
                            </span>
                            <span className="text-xs font-mono text-[#202124] bg-white px-2 py-1 rounded">
                              {r.path}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#70757a]">
                              Length:
                            </span>
                            <span className="text-sm font-medium text-[#202124]">
                              {r.doc_length.toLocaleString()} terms
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#70757a]">
                              Doc Norm:
                            </span>
                            <span className="text-sm font-mono text-[#202124]">
                              {r.doc_norm}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#202124] uppercase tracking-wide">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-target size-4 text-[#34a853]"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                          Relevance Score
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#70757a]">
                              Score:
                            </span>
                            <span className="text-sm font-bold text-[#34a853]">
                              {(r.score * 100).toFixed(4)}%
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              {(() => {
                                const pct = Math.min(
                                  100,
                                  Math.round(r.score * 100),
                                );
                                const wClass =
                                  pct >= 100
                                    ? "w-full"
                                    : pct >= 75
                                      ? "w-3/4"
                                      : pct >= 50
                                        ? "w-1/2"
                                        : pct >= 25
                                          ? "w-1/4"
                                          : "w-1/12";
                                return (
                                  <div
                                    className={`h-full bg-linear-to-r from-[#34a853] to-[#4285f4] rounded-full transition-all duration-500 ${wClass}`}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs text-[#70757a]">
                              Matched Terms:
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {r.matched_terms.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-1 bg-linear-to-r from-blue-100 to-purple-100 text-[#4285f4] text-xs font-medium rounded-full border border-blue-200/50"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-[#202124] uppercase tracking-wide">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chart-column size-4 text-[#fbbc04]"
                        >
                          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                          <path d="M18 17V9" />
                          <path d="M13 17V5" />
                          <path d="M8 17v-3" />
                        </svg>
                        Term Statistics (TF-IDF)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-linear-to-r from-gray-100 to-blue-50">
                              <th className="text-left px-3 py-2 font-semibold text-[#202124]">
                                Term
                              </th>
                              <th className="text-right px-3 py-2 font-semibold text-[#202124]">
                                Doc TF
                              </th>
                              <th className="text-right px-3 py-2 font-semibold text-[#202124]">
                                Doc IDF
                              </th>
                              <th className="text-right px-3 py-2 font-semibold text-[#202124]">
                                Doc TF-IDF
                              </th>
                              <th className="text-right px-3 py-2 font-semibold text-[#202124]">
                                Query TF-IDF
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.matched_details.map((d) => (
                              <tr
                                key={d.term}
                                className="border-t border-gray-200 hover:bg-white/50 transition-colors duration-200"
                              >
                                <td className="px-3 py-2 font-medium text-[#4285f4]">
                                  {d.term}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-[#70757a]">
                                  {d.doc_tf}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-[#70757a]">
                                  {d.doc_idf}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-[#34a853] font-semibold">
                                  {d.doc_tfidf}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-[#ea4335] font-semibold">
                                  {d.query_tfidf}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 h-px bg-linear-to-r from-transparent via-blue-200/50 to-transparent opacity-50 group-hover:opacity-100 group-hover:via-blue-300/60 transition-opacity duration-300" />
              </article>
            )})
          ) : (
            <div className="text-sm text-[#70757a]">No results yet</div>
          )}
        </div>

        <div className="mt-16 text-center">
          {results?.pagination ? (
            (() => {
              const p = results.pagination!;
              const start = (p.page - 1) * p.page_size + 1;
              const end = Math.min(p.page * p.page_size, p.total_matches);
              return (
                <div className="flex items-center justify-center gap-4">
                  <div className="text-sm text-[#70757a]">
                    Showing {start}–{end} of {p.total_matches.toLocaleString()}{" "}
                    results
                  </div>

                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={!p.has_prev}
                      className={`px-3 py-1 rounded ${p.has_prev ? "bg-white border cursor-pointer hover:bg-gray-50 transition-all duration-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"} text-sm`}
                    >
                      Prev
                    </button>
                    <div className="text-sm text-[#70757a] px-2">
                      Page {p.page} of {p.total_pages}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(p.total_pages, page + 1))}
                      disabled={!p.has_next}
                      className={`px-3 py-1 rounded ${p.has_next ? "bg-white border cursor-pointer hover:bg-gray-50 transition-all duration-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"} text-sm`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="inline-flex items-center gap-2 text-sm text-[#70757a] font-light px-6 py-3 bg-linear-to-r from-gray-50 to-blue-50/30 rounded-full border border-gray-200/50">
              <div className="size-1.5 rounded-full bg-[#4285f4] animate-pulse"></div>
              <span>
                Showing {results ? results.results.length : 0} of{" "}
                {results?.corpus?.total_documents
                  ? results.corpus.total_documents.toLocaleString()
                  : "-"}{" "}
                results
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
