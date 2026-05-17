import React from "react";

interface RawCorpusViewerProps {
  text: string;
}

export default function RawCorpusViewer({ text }: RawCorpusViewerProps) {
  const formattedLines: string[] = [];
  const structuralTagRegex = /(<\/?[hp]>)/gi;
  const tokens = text.replace(/\r/g, "").split(structuralTagRegex).filter(Boolean);
  let buffer = "";

  const flushBuffer = () => {
    const trimmedBuffer = buffer.trim();
    if (!trimmedBuffer) return;
    formattedLines.push(`\t${trimmedBuffer}`);
    buffer = "";
  };

  for (const token of tokens) {
    if (/^<\/?[hp]>$/i.test(token)) {
      flushBuffer();
      formattedLines.push(token);
    } else {
      buffer += token;
    }
  }

  flushBuffer();

  return (
    <div className="font-mono text-[13px] leading-6 overflow-auto py-4" style={{ tabSize: 4 }}>
      {formattedLines.map((line, i) => {
        let highlightedLine: React.ReactNode = line;
        const tagRegex = /(<\/?[hp]>|@@\d+|@\d+\/|@qwx\d+)/gi;
        if (tagRegex.test(line)) {
          const lineParts = line.split(tagRegex);
          highlightedLine = lineParts.map((part, index) => {
            if (/^<\/?[hp]>$/i.test(part)) {
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
          <div key={i} className="flex items-start hover:bg-slate-500/5 px-4 py-0.5 rounded transition-colors">
            <span className="w-8 select-none text-slate-500 text-right pr-3 border-r border-slate-500/20 mr-3">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap wrap-break-word">
              {highlightedLine}
            </span>
          </div>
        );
      })}
    </div>
  );
}
