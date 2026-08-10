import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useGetDocumentQuery } from "../redux/api/searchApi";
import DocumentRenderer from "../Components/DocumentRenderer";
import DocumentMetadata from "../Components/DocumentMetadata";


export default function DocumentPreview() {
  const { docId } = useParams<{ docId: string }>();

  const id = Number(docId || 0);
  const { data: doc, isLoading, isFetching, isError, error } = useGetDocumentQuery(
    id,
    {
      skip: !id,
    },
  );

  function getErrorMessage(err: unknown): string {
    if (!err) return "Failed to load document";
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      if (e.data && typeof e.data === "object" && e.data !== null) {
        const d = e.data as Record<string, unknown>;
        if (typeof d.message === "string") return d.message;
        if (d.error && typeof d.error === "object" && d.error !== null) {
          const de = d.error as Record<string, unknown>;
          if (typeof de.message === "string") return de.message;
        }
      }
      if (typeof e.error === "string") return e.error;
      if (e.error && typeof e.error === "object" && e.error !== null) {
        const er = e.error as Record<string, unknown>;
        if (typeof er.message === "string") return er.message;
      }
      if (typeof e.message === "string") return e.message;
    }
    return "Failed to load document";
  }

  const location = useLocation();
  const navigate = useNavigate();
  const prevQuery =
    (location.state as { query?: string } | null)?.query ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#202124]">
          Document Preview
        </h2>
        <div className="flex items-center gap-4 text-sm">
          {prevQuery ? (
            <Link
              to="/search"
              state={{ query: prevQuery }}
              className="text-[#4285f4] hover:underline font-medium"
            >
              ← Back to results
            </Link>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="text-[#4285f4] hover:underline font-medium cursor-pointer"
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

      {doc && (
        <div className="space-y-6 animate-slide-up">
          {/* Metadata Reusable Box (Top Box) */}
          <DocumentMetadata name={doc.name} path={doc.path} text={doc.text} />

          {/* Body Content Document Renderer */}
          <DocumentRenderer text={doc.text} query={prevQuery} />
        </div>
      )}
    </div>
  );
}
