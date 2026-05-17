import { useState, useMemo } from "react";

interface DocumentRendererProps {
  text: string;
  query?: string | null;
}

interface ProcessedSection {
  type: "heading" | "paragraph" | "text";
  text: string;
}

interface ParsedCorpus {
  metadata: {
    docId?: string;
    sourceId?: string;
    rawHeader?: string;
  };
  sections: ProcessedSection[];
}

/**
 * Normalizes punctuation and spacing typical in text corpus datasets.
 */
function cleanCorpusNoise(str: string): string {
  if (!str) return "";
  return str
    // Fix spaces around punctuation (e.g. "word , word" -> "word, word")
    .replace(/\s+([.,!?;:])(?:\s|$)/g, "$1 ")
    // Fix spaces around apostrophes (e.g. "don ' t" -> "don't")
    .replace(/\s+'\s*([tsmd]|re|ve|ll)\b/gi, "'$1")
    // Fix parenthesis spacing (e.g. "( hello )" -> "(hello)")
    .replace(/\(\s+([^)]+?)\s+\)/g, "($1)")
    // Clean up multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses corpus text, extracting metadata IDs and splitting tags <h> and <p>.
 */
function parseCorpusText(text: string): ParsedCorpus {
  const result: ProcessedSection[] = [];
  const metadata: ParsedCorpus["metadata"] = {};

  if (!text) return { metadata, sections: [] };

  let remainingText = text.trim();

  // 1. Extract leading corpus ID header (e.g. @@34810979 @3810979/ or @@12345)
  const headerRegex = /^@@(\d+)(?:\s+@(\d+)\/)?/;
  const headerMatch = remainingText.match(headerRegex);
  if (headerMatch) {
    metadata.rawHeader = headerMatch[0];
    metadata.docId = headerMatch[1];
    if (headerMatch[2]) {
      metadata.sourceId = headerMatch[2];
    }
    remainingText = remainingText.substring(headerMatch[0].length).trim();
  }

  // 2. Extract leading metadata noise (e.g., "159586 @qwx359586")
  const noiseRegex = /^(\d+)\s+@qwx(\d+)\s*/i;
  const noiseMatch = remainingText.match(noiseRegex);
  if (noiseMatch) {
    remainingText = remainingText.substring(noiseMatch[0].length).trim();
  }

  // 3. Scan and split by <h>, </h>, <p>, </p> tags
  const tagRegex = /<(h|p)(?:\s+[^>]*)*>|<\/(h|p)>/gi;
  let lastIndex = 0;
  let currentType: "heading" | "paragraph" | "text" = "text";
  let match;

  while ((match = tagRegex.exec(remainingText)) !== null) {
    const matchIndex = match.index;
    const matchedTag = match[0];
    const isCloseTag = matchedTag.startsWith("</");
    const tagName = (match[1] || match[2] || "").toLowerCase();

    // Grab segment before this tag
    const segment = remainingText.substring(lastIndex, matchIndex).trim();
    if (segment) {
      const cleaned = cleanCorpusNoise(segment);
      if (cleaned) {
        result.push({
          type: currentType === "text" ? "text" : currentType,
          text: cleaned,
        });
      }
    }

    if (isCloseTag) {
      currentType = "text";
    } else {
      currentType = tagName === "h" ? "heading" : "paragraph";
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Grab trailing segment
  const trailing = remainingText.substring(lastIndex).trim();
  if (trailing) {
    const cleaned = cleanCorpusNoise(trailing);
    if (cleaned) {
      result.push({
        type: currentType === "text" ? "text" : currentType,
        text: cleaned,
      });
    }
  }

  // Fallback: If no tags were found at all, treat the whole text as paragraph blocks (split by double newline)
  if (result.length === 0) {
    const paragraphs = remainingText.split(/\n\s*\n/);
    for (const p of paragraphs) {
      const cleaned = cleanCorpusNoise(p);
      if (cleaned) {
        result.push({
          type: "paragraph",
          text: cleaned,
        });
      }
    }
  }

  return { metadata, sections: result };
}

export default function DocumentRenderer({
  text,
  query = null,
}: DocumentRendererProps) {
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  // Parse text into structured sections
  const parsedData = useMemo(() => parseCorpusText(text), [text]);

  // Extract query keywords for case-insensitive highlighting
  const queryRegex = useMemo(() => {
    if (!query) return null;

    // Filter out common stopwords to avoid highlighting every letter/preposition
    const stopwords = new Set([
      "the", "a", "an", "and", "or", "in", "on", "of", "to", "for", "with",
      "by", "at", "is", "was", "were", "are", "be", "been", "this", "that",
      "it", "from", "as", "he", "she", "they", "we", "i", "you", "but"
    ]);

    const terms = query
      .toLowerCase()
      .split(/[\s,.\-_/]+/)
      .filter((t) => t.length > 1 && !stopwords.has(t));

    if (terms.length === 0) return null;

    // Escape terms for Regex safety
    const escaped = terms.map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
    return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  }, [query]);

  /**
   * Helper that renders text with keywords highlighted AND placeholder @ redactions cleanly badge-styled
   */
  const renderTextContent = (rawBlockText: string) => {
    // 1. Replace 3+ consecutive @ characters (redacted content) with unique placeholder
    const tokenized = rawBlockText.replace(/(?:@\s*){3,}/gi, " __REDACTION__ ");

    // 2. If no search query, render only redaction replacements
    if (!queryRegex) {
      return renderRedactionsOnly(tokenized);
    }

    // 3. Otherwise, split by search terms to highlight matches
    const parts = tokenized.split(queryRegex);
    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // This is a matched query term!
            return (
              <mark
                key={index}
                className={`px-1 py-0.5 rounded-sm font-semibold select-all transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-amber-500/30 text-amber-200 border-b border-amber-400/80"
                    : "bg-amber-100 text-amber-950 border-b border-amber-300 shadow-2xs"
                }`}
              >
                {part}
              </mark>
            );
          }
          // Normal segment, might contain a redaction placeholder
          return renderRedactionsOnly(part);
        })}
      </>
    );
  };

  const renderRedactionsOnly = (textSegment: string) => {
    if (!textSegment.includes("__REDACTION__")) {
      return textSegment;
    }

    const subParts = textSegment.split(/(__REDACTION__)/g);
    return subParts.map((sub, index) => {
      if (sub === "__REDACTION__") {
        return (
          <span
            key={index}
            className={`mx-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono inline-flex items-center gap-1 select-none cursor-help font-semibold border transition-colors ${
              theme === "dark"
                ? "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-300"
                : theme === "sepia"
                ? "bg-[#eadcb9]/80 border-[#d8c397] text-[#806440] hover:text-[#5e492d]"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200/60"
            }`}
            title="Corpus Text Omitted (Anti-piracy Redaction)"
          >
            [Omitted Context]
          </span>
        );
      }
      return sub;
    });
  };

  // Text color and styling based on reading theme
  const containerThemeStyles = {
    light: "bg-slate-50 border-slate-200 text-slate-800",
    sepia: "bg-[#fbf7ee] border-[#eadcb9] text-[#4a3c31]",
    dark: "bg-[#0b0f19] border-slate-800/80 text-slate-200",
  }[theme];

  const pageThemeStyles = {
    light: "bg-white border-slate-200 text-slate-800 shadow-sm",
    sepia: "bg-[#f3ead3] border-[#e2d0aa] text-[#423427] shadow-sm",
    dark: "bg-[#141b2b] border-slate-800 text-slate-100 shadow-sm",
  }[theme];

  const fontSizes = {
    small: "text-sm leading-relaxed",
    medium: "text-base sm:text-lg leading-relaxed",
    large: "text-lg sm:text-xl leading-relaxed",
  }[fontSize];

  const headingSizes = {
    small: "text-base font-semibold",
    medium: "text-xl sm:text-2xl font-bold tracking-tight",
    large: "text-2xl sm:text-3xl font-bold tracking-tight",
  }[fontSize];

  // Logic to highlight tags in the RAW view mode
  const renderRawWithSyntaxHighlighting = () => {
    const lines = text.split("\n");
    return (
      <div className="font-mono text-xs overflow-x-auto p-4 space-y-1">
        {lines.map((line, i) => {
          // Syntax highlight corpus structural tags in raw view
          let highlightedLine: React.ReactNode = line;

          const tagRegex = /(<\/?[h|p]>|@@\d+|@\d+\/|@qwx\d+)/gi;
          if (tagRegex.test(line)) {
            const lineParts = line.split(tagRegex);
            highlightedLine = lineParts.map((part, index) => {
              if (/^<\/?[h|p]>$/i.test(part)) {
                return (
                  <span key={index} className="text-purple-400 font-bold">
                    {part}
                  </span>
                );
              } else if (/^@@\d+$/i.test(part)) {
                return (
                  <span key={index} className="text-blue-400 font-semibold">
                    {part}
                  </span>
                );
              } else if (/^@\d+\/$/i.test(part)) {
                return (
                  <span key={index} className="text-teal-400 font-medium">
                    {part}
                  </span>
                );
              } else if (/^@qwx\d+$/i.test(part)) {
                return (
                  <span key={index} className="text-amber-400 italic">
                    {part}
                  </span>
                );
              }
              return part;
            });
          }

          return (
            <div key={i} className="flex hover:bg-slate-500/5 px-1 py-0.5 rounded transition-colors">
              <span className="w-8 select-none text-slate-500 text-right pr-3 border-r border-slate-500/20 mr-3">
                {i + 1}
              </span>
              <span className="whitespace-pre">{highlightedLine}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border transition-all duration-300 shadow-xs ${containerThemeStyles}`}>
      {/* Settings Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-inherit gap-3">
        {/* Toggle between Clean view and Raw view */}
        <div className="flex items-center bg-slate-500/10 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode("formatted")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "formatted"
                ? "bg-white shadow-xs text-blue-600 scale-[1.02]"
                : "text-slate-500 hover:text-slate-700"
            }`}
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
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <path d="M6 14h10" />
            </svg>
            Clean Article
          </button>
          <button
            onClick={() => setViewMode("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "raw"
                ? "bg-white shadow-xs text-blue-600 scale-[1.02]"
                : "text-slate-500 hover:text-slate-700"
            }`}
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
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Raw Corpus Text
          </button>
        </div>

        {/* Customizer settings bar (Formatted Mode Only) */}
        {viewMode === "formatted" && (
          <div className="flex items-center flex-wrap gap-4">
            {/* Font sizing adjusters */}
            <div className="flex items-center border border-slate-500/20 rounded-xl overflow-hidden text-xs bg-slate-500/5">
              <button
                onClick={() => setFontSize("small")}
                className={`px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  fontSize === "small" ? "bg-slate-500/20 font-bold text-blue-500" : ""
                }`}
                title="Font: Small"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("medium")}
                className={`px-3 py-1.5 font-medium border-x border-slate-500/20 transition-colors cursor-pointer ${
                  fontSize === "medium" ? "bg-slate-500/20 font-bold text-blue-500" : ""
                }`}
                title="Font: Medium"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  fontSize === "large" ? "bg-slate-500/20 font-bold text-blue-500" : ""
                }`}
                title="Font: Large"
              >
                A+
              </button>
            </div>

            {/* Aesthetic Reading Themes switcher */}
            <div className="flex items-center gap-1.5 border border-slate-500/20 p-0.5 rounded-xl bg-slate-500/5">
              <button
                onClick={() => setTheme("light")}
                className={`size-6 rounded-lg bg-white border flex items-center justify-center transition-all cursor-pointer ${
                  theme === "light" ? "ring-2 ring-blue-500 scale-[1.05]" : "opacity-70 hover:opacity-100"
                }`}
                title="Light Theme"
                aria-label="Light Theme"
              >
                <div className="size-3.5 rounded-full bg-slate-800 border border-slate-200" />
              </button>
              <button
                onClick={() => setTheme("sepia")}
                className={`size-6 rounded-lg bg-[#fcf8f2] border border-[#e3d7c5] flex items-center justify-center transition-all cursor-pointer ${
                  theme === "sepia" ? "ring-2 ring-amber-600 scale-[1.05]" : "opacity-70 hover:opacity-100"
                }`}
                title="Sepia Reading Theme"
                aria-label="Sepia Reading Theme"
              >
                <div className="size-3.5 rounded-full bg-[#523d29]" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`size-6 rounded-lg bg-[#0f141c] border border-slate-800 flex items-center justify-center transition-all cursor-pointer ${
                  theme === "dark" ? "ring-2 ring-blue-400 scale-[1.05]" : "opacity-70 hover:opacity-100"
                }`}
                title="Night Mode"
                aria-label="Night Mode"
              >
                <div className="size-3.5 rounded-full bg-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Text Body Card */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className={`p-6 md:p-10 rounded-2xl border transition-all duration-300 ${pageThemeStyles}`}>
          {viewMode === "formatted" ? (
            <article className={`space-y-6 ${fontSizes} select-text`}>
              {parsedData.sections.map((section, idx) => {
                if (section.type === "heading") {
                  return (
                    <h2
                      key={idx}
                      className={`text-slate-900 dark:text-white font-extrabold leading-tight mt-8 mb-4 border-l-4 border-blue-500 pl-3 ${headingSizes}`}
                    >
                      {renderTextContent(section.text)}
                    </h2>
                  );
                } else {
                  return (
                    <p
                      key={idx}
                      className="text-justify whitespace-pre-wrap font-normal leading-relaxed break-words"
                    >
                      {renderTextContent(section.text)}
                    </p>
                  );
                }
              })}
            </article>
          ) : (
            // Syntax Highlighted Raw View
            <div className="relative rounded-xl overflow-hidden border border-inherit bg-slate-950 text-slate-300">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                <span>Raw Text Viewer</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(text);
                  }}
                  className="hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Raw
                </button>
              </div>
              {renderRawWithSyntaxHighlighting()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
