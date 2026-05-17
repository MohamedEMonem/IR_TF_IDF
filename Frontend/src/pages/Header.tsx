import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGetStatusQuery } from "../redux/api/searchApi";
import Hero from "../Components/Hero";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const { data: statusData } = useGetStatusQuery(undefined, {
    pollingInterval: 2000,
  });

  const isIndexing = statusData?.data.is_indexing;
  const backendStatus = statusData?.data.status;
  const statusText = statusData
    ? isIndexing
      ? "Indexing"
      : (backendStatus ?? "Indexed")
    : "Idle";

  useEffect(() => {
    const queryFromUrl = new URLSearchParams(location.search).get("q")?.trim();
    const queryFromState = (location.state as { query?: string } | null)?.query;
    const nextQuery = queryFromUrl || queryFromState;
    if (typeof nextQuery === "string") {
      setQuery(nextQuery);
    }
  }, [location.search, location.state]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };
  return (
    <header className="sticky top-0 z-50 animate-slide-down">
      <div className="relative bg-white/95 border-b border-gray-200/60 shadow-sm backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#4285f4] via-[#ea4335] to-[#34a853] animate-gradient-x" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-6 py-3">
            <Link
              className="group relative cursor-pointer animate-fade-in-left select-none"
              to="/"
              data-discover="true"
              title="Home"
              aria-label="Home"
            >
              {/* Subtle background glow on hover */}
              <div className="absolute -inset-2 rounded-xl bg-linear-to-r from-purple-400/10 via-pink-400/10 to-purple-400/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
              
              <Hero size="sm" />
            </Link>

            <form
              onSubmit={handleSubmit}
              className="flex-1 max-w-2xl animate-fade-in"
            >
              <div className="relative group">
                <div className="relative flex items-center rounded-full border border-[#dfe1e5] bg-white transition-shadow duration-200 hover:shadow-lg focus-within:shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 ml-4 text-[#9aa0a6] transition-colors duration-200 group-focus-within:text-[#4285f4]"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>

                  <input
                    type="text"
                    placeholder="Search"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm antialiased outline-none"
                    autoComplete="off"
                    spellCheck={false}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    title="Clear search"
                    className="mr-1 rounded-full p-2 transition-all duration-200 hover:bg-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4 text-[#70757a]"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>

                  <button
                    type="submit"
                    aria-label="Submit search"
                    title="Submit search"
                    className="mr-1 rounded-full p-2 transition-all duration-200 hover:bg-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4 text-[#4285f4]"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center gap-3 animate-fade-in-right">
              <Link
                className="group rounded-full p-2 transition-all duration-200 hover:scale-110 hover:bg-linear-to-br hover:from-blue-50 hover:to-purple-50"
                to="/upload"
                data-discover="true"
                title="Upload document"
                aria-label="Upload document"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 text-[#70757a] transition-colors duration-200 group-hover:text-[#4285f4]"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </Link>

              <div className="flex items-center gap-3">
                <div
                  title={backendStatus ?? ""}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full animate-fade-in border ${
                    isIndexing
                      ? "bg-yellow-50 border-yellow-100"
                      : statusData
                        ? "bg-gradient-to-r from-white to-green-50 border-green-100"
                        : "bg-gray-50 border-gray-100"
                  }`}
                >
                  {isIndexing ? (
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`lucide lucide-circle-check size-4 ${
                        statusData ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  )}
                  <span
                    className={`text-xs font-medium ${isIndexing ? "text-yellow-700" : statusData ? "text-green-700" : "text-gray-500"}`}
                  >
                    {statusText}
                  </span>
                </div>
                <div className="relative">
                  <div className="size-8 rounded-full bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:scale-110 transition-transform duration-200 shadow-md ring-2 ring-white hover:ring-blue-200">
                    U
                  </div>
                  <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
