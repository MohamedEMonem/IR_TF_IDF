import { useState } from "react";
import type { FormEvent } from "react";
import {
  useGetMetaQuery,
  useRankDocumentsMutation,
} from "../redux/api/searchApi";

export default function Home() {
  const [query, setQuery] = useState("information retrieval");
  const [topK, setTopK] = useState(5);
  const {
    data: meta,
    isLoading: isMetaLoading,
    isError: isMetaError,
  } = useGetMetaQuery();
  const [rankDocuments, { data, isLoading, error, reset }] =
    useRankDocumentsMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void rankDocuments({ query, top_k: topK });
  };

  const metaEntries = meta ? Object.entries(meta) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-6 flex flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Redux API Search
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Search your corpus with Redux Toolkit Query
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              This page uses Redux to call the backend&apos;s <code>/meta</code>{" "}
              and
              <code> /rank</code> endpoints.
            </p>
          </div>

          <form
            className="grid gap-4 md:grid-cols-[1fr_160px_auto]"
            onSubmit={handleSubmit}
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Query</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Type a search query"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Top K</span>
              <input
                type="number"
                min={1}
                max={50}
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value) || 1)}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Backend Meta
            </h2>
            {isMetaLoading ? (
              <p className="text-slate-400">Loading metadata...</p>
            ) : isMetaError ? (
              <p className="text-rose-300">Could not load backend metadata.</p>
            ) : (
              <dl className="grid gap-3 text-sm text-slate-300">
                {metaEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/5 bg-white/5 p-3"
                  >
                    <dt className="mb-1 font-medium uppercase tracking-wide text-cyan-300">
                      {key}
                    </dt>
                    <dd className="wrap-break-word text-slate-200">
                      {typeof value === "string"
                        ? value
                        : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Rank Results</h2>
              {data ? (
                <span className="text-sm text-slate-400">
                  {data.results.length} result(s) in{" "}
                  {data.rank_time_ms.toFixed(2)} ms
                </span>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
                {"data" in error &&
                error.data &&
                typeof error.data === "object" &&
                "message" in error.data
                  ? String((error.data as { message?: string }).message)
                  : "Request failed"}
              </p>
            ) : data ? (
              <div className="space-y-4">
                {data.results.length === 0 ? (
                  <p className="text-slate-400">
                    No documents matched this query.
                  </p>
                ) : (
                  data.results.map((result) => (
                    <div
                      key={result.doc_id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white">
                            {result.name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Doc ID {result.doc_id}
                          </p>
                        </div>
                        <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-medium text-cyan-200">
                          Score {result.score.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-300">
                        {result.snippet}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-slate-400">
                Run a search to fetch ranked documents from the API.
              </p>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}
