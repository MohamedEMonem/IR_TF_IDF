import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRankDocumentsMutation } from "../redux/api/searchApi";
import type { RankResponse } from "../types/api";

type SearchLocationState = {
  query?: string;
};

const FALLBACK_QUERY = "information retrieval";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SearchLocationState | null;
  const [query, setQuery] = useState(state?.query ?? FALLBACK_QUERY);
  const [results, setResults] = useState<RankResponse | null>(null);
  const [rankDocuments, { isLoading, isError }] = useRankDocumentsMutation();

  useEffect(() => {
    const nextQuery = state?.query?.trim();

    if (!nextQuery) {
      navigate("/", { replace: true });
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(nextQuery);

    void rankDocuments({ query: nextQuery, top_k: 5 })
      .unwrap()
      .then((response) => setResults(response))
      .catch(() => setResults(null));
  }, [navigate, rankDocuments, state?.query]);

  console.log("q: ", query);
  return (
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 transition-[padding] duration-500 ease-out py-8">
      <div className="max-w-4xl animate-fade-in pb-20">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3 antialiased">
            <div className="text-sm font-light text-[#70757a]">
              About
              <span className="font-medium text-[#202124]">1,234,567</span>
              results
            </div>
            <span className="text-[#d0d0d0]">|</span>
            <div className="text-sm text-[#9aa0a6] font-light">
              <span className="font-medium text-[#4285f4]">0.42</span> seconds
            </div>
          </div>
          <div className="hidden sm:block text-sm text-[#70757a] font-light">
            Searching for:
            <span className="font-medium text-[#202124]">{query}</span>
          </div>
        </div>

        <div className="space-y-14">
          <article
            className="group cursor-pointer animate-slide-up will-change-transform py-1 px-2 -mx-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30"
            style={{
              animationDelay: "0s",
              transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-7 rounded-lg bg-gradient-to-br from-blue-100/80 to-purple-100/80 backdrop-blur-sm flex items-center justify-center text-xs font-semibold text-[#4285f4] shadow-sm border border-blue-200/30">
                  W
                </div>
                <div
                  className="text-sm text-[#202124]/60 group-hover:text-[#4285f4] font-normal antialiased tracking-wide"
                  style={{ transition: "color 0.2s;" }}
                >
                  webdev.example.com › guide
                </div>
              </div>
              <div className="text-xs text-[#70757a] font-light px-3 py-1 bg-gray-50 rounded-full">
                Jan 15, 2026
              </div>
            </div>
            <h3
              className="text-2xl sm:text-3xl text-[#1a0dab] group-hover:text-[#1a73e8] mb-3 leading-snug font-normal tracking-tight antialiased"
              style={{
                transition: "color 0.2s; text-shadow: transparent 0px 0px 0px;",
              }}
            >
              Getting Started with Modern Web Development
            </h3>
            <div
              className="mb-2 pl-4 border-l-2 border-blue-200/40 group-hover:border-blue-400/60"
              style={{ transition: "border-color 0.3s;" }}
            >
              <p className="text-sm text-[#4285f4] font-normal italic antialiased">
                "React is a JavaScript library for building user interfaces..."
              </p>
            </div>
            <p className="text-base sm:text-lg text-[#4d5156] leading-relaxed font-light antialiased tracking-wide">
              Learn the fundamentals of modern web development including React,
              TypeScript, and Tailwind CSS. This comprehensive guide covers
              everything you need to know about building modern web
              applications.
            </p>
            <div
              className="mt-6 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent opacity-50 group-hover:opacity-100 group-hover:via-blue-300/60"
              style={{ transition: "opacity 0.4s;" }}
            ></div>
          </article>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[#70757a] font-light px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-full border border-gray-200/50">
            <div className="size-1.5 rounded-full bg-[#4285f4] animate-pulse"></div>
            <span>Showing 6 of 1,234,567 results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
