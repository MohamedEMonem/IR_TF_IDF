import { useState } from "react";
import SearchBar from "../Components/SearchBar";
import Hero from "../Components/Hero";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [query, setQuery] = useState("information retrieval");
  const navigate = useNavigate();

  const handleSearch = (q: string) => {
    const term = q || query;
    setQuery(term);
    navigate("/search", { state: { query: term } });
  };

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
