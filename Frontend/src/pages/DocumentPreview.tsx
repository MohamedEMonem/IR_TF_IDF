import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useGetDocumentQuery } from "../redux/api/searchApi";
import type { DocumentResponse } from "../types/api";

export default function DocumentPreview() {
  const { docId } = useParams<{ docId: string }>();

  const id = Number(docId || 0);
  const { data, isLoading, isFetching, isError, error } = useGetDocumentQuery(
    id,
    {
      skip: !id,
    },
  );

  const pdfUrl = useMemo(() => {
    if (data instanceof Blob) return URL.createObjectURL(data);
    return null;
  }, [data]);

  //   useEffect(() => {
  //     return () => {
  //       if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  //     };
  //   }, [pdfUrl]);

  // If API returned JSON metadata but the document path is a PDF, fetch the PDF as a blob fallback
  const [fallbackPdfUrl, setFallbackPdfUrl] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    async function fetchFallback() {
      const docMeta =
        data && !(data instanceof Blob) ? (data as DocumentResponse) : null;
      if (!docMeta) return;
      const p = docMeta.path || "";
      if (!p.toLowerCase().endsWith(".pdf")) return;
      try {
        const res = await fetch(`/api/document/${id}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const b = await res.blob();
        if (!mounted) return;
        const url = URL.createObjectURL(b);
        setFallbackPdfUrl(url);
      } catch (err) {
        // keep silent; error shown via isError
        // log for diagnostics
        console.debug("fallback pdf fetch failed", err);
      }
    }
    fetchFallback();
    return () => {
      mounted = false;
      if (fallbackPdfUrl) {
        URL.revokeObjectURL(fallbackPdfUrl);
        setFallbackPdfUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, id]);

  function getErrorMessage(err: unknown): string {
    if (!err) return "Failed to load document";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
      const e = err as Record<string, unknown>;
      if (e.data && typeof e.data === "object") {
        const d = e.data as Record<string, unknown>;
        if (typeof d.message === "string") return d.message;
      }
      if (e.error && typeof e.error === "string") return e.error;
      if (e.error && typeof e.error === "object") {
        const er = e.error as Record<string, unknown>;
        if (typeof er.message === "string") return er.message;
      }
      if (typeof e.message === "string") return e.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  const doc = useMemo(() => {
    return data && !(data instanceof Blob) ? (data as DocumentResponse) : null;
  }, [data]);

  const location = useLocation();
  const navigate = useNavigate();
  const prevQuery =
    (location.state as { query?: string } | null)?.query ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#202124]">
          Document Preview
        </h2>
        <div className="text-sm">
          {prevQuery ? (
            <Link
              to="/search"
              state={{ query: prevQuery }}
              className="text-[#4285f4] hover:underline"
            >
              ← Back to results
            </Link>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="text-[#4285f4] hover:underline"
            >
              ← Back to results
            </button>
          )}
        </div>
      </div>

      {(isLoading || isFetching) && (
        <div className="text-sm text-[#70757a]">Loading…</div>
      )}

      {isError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {getErrorMessage(error)}
        </div>
      )}

      {(pdfUrl || fallbackPdfUrl) && (
        <div className="w-full h-[80vh] border rounded overflow-hidden">
          <object
            data={fallbackPdfUrl || pdfUrl || undefined}
            type="application/pdf"
            className="w-full h-full"
          >
            <embed
              src={fallbackPdfUrl || pdfUrl || undefined}
              type="application/pdf"
              className="w-full h-full"
            />
          </object>

          <div className="mt-2 text-right">
            <a
              href={fallbackPdfUrl || pdfUrl || `/api/document/${id}`}
              className="text-sm text-[#4285f4] hover:underline"
              target="_blank"
              rel="noreferrer"
              download
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      {doc && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-[#70757a]">{doc.name}</div>
            <div className="text-xs font-mono text-[#202124] bg-gray-50 px-3 py-2 rounded mt-2">
              {doc.path}
            </div>
          </div>

          <div className="prose max-w-none bg-white p-6 rounded shadow-sm border">
            <pre className="whitespace-pre-wrap text-sm text-[#3c3c3c]">
              {doc.text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
