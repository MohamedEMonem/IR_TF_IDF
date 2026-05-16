import { useState } from "react";
import {
  useGetMetaQuery,
  useRankDocumentsMutation,
} from "../redux/api/searchApi";
import SearchBar from "../Components/SearchBar";
import Hero from "../Components/Hero";

export default function Home() {
  const [query, setQuery] = useState("information retrieval");
  const {
    data: meta,
    isLoading: isMetaLoading,
    isError: isMetaError,
  } = useGetMetaQuery();
  const [rankDocuments, { data, error }] = useRankDocumentsMutation();

  const handleSearch = (q: string) => {
    const term = q || query;
    setQuery(term);
    void rankDocuments({ query: term, top_k: 5 });
  };

  const metaEntries = meta ? Object.entries(meta) : [];

  return (
    <div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(66,133,244,0.02),transparent_50%)] pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 transition-[padding] duration-500 ease-out pt-48">
        <Hero />
        <SearchBar onSearch={handleSearch} />
      </div>
    </div>
  );
}
