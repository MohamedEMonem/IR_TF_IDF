import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetStatusQuery } from "../redux/api/searchApi";

const Header = () => {
  const navigate = useNavigate();
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate("/search", { state: { query: trimmed } });
  };
  return (
    <header className="sticky top-0 z-50 animate-slide-down">
      <div className="relative bg-white/95 border-b border-gray-200/60 shadow-sm backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#4285f4] via-[#ea4335] to-[#34a853] animate-gradient-x" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-6 py-3">
            <Link
              className="group relative cursor-pointer animate-fade-in-left"
              to="/"
              data-discover="true"
              title="Home"
              aria-label="Home"
            >
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex items-center gap-2 rounded-2xl border border-blue-100/50 bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-2.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
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
                  className="size-6 animate-pulse-slow text-[#4285f4]"
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                  <path d="M20 3v4" />
                  <path d="M22 5h-4" />
                  <path d="M4 17v2" />
                  <path d="M5 18H3" />
                </svg>

                <div className="flex items-center gap-0.5">
                  <div className="dot-delay-1 size-2 rounded-full bg-[#4285f4] animate-pulse" />
                  <div className="dot-delay-2 size-2 rounded-full bg-[#ea4335] animate-pulse" />
                  <div className="dot-delay-3 size-2 rounded-full bg-[#fbbc04] animate-pulse" />
                  <div className="dot-delay-4 size-2 rounded-full bg-[#34a853] animate-pulse" />
                </div>
              </div>
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
