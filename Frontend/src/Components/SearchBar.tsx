import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./Button";
import LinkButton from "./LinkButton";

export default function SearchBar({
  onSearch,
}: {
  onSearch?: (q: string) => void;
}) {
  const [searchValue, setSearchValue] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    onSearch?.(searchValue);
  };

  return (
    <form className="mb-12" onSubmit={submit}>
      <div className="relative max-w-2xl mx-auto">
        <div className="relative group">
          <div className="relative flex items-center bg-white rounded-full border border-[#dfe1e5] shadow-sm hover:shadow-xl focus-within:shadow-xl transition-shadow duration-300">
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
              className="size-5 text-[#9aa0a6] ml-6 shrink-0 group-focus-within:text-[#4285f4] transition-colors duration-300"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              type="text"
              placeholder="Search or type a URL"
              className="flex-1 bg-transparent outline-none px-5 py-5 text-base sm:text-lg placeholder:text-[#9aa0a6] antialiased"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-12 animate-fade-in">
          <Button
            variant="lucky"
            type="submit"
            className={!searchValue ? "cursor-not-allowed opacity-50" : "cursor-pointer transition-all duration-200 hover:bg-gray-50"}
            disabled={!searchValue}
            aria-label="Search"
          >
            Search
          </Button>
          <LinkButton href="/upload">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-upload size-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Upload Document
          </LinkButton>
        </div>
      </div>
    </form>
  );
}
