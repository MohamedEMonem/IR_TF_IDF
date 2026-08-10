import { Link } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  useGetStatusQuery,
  useUploadDocumentsMutation,
} from "../redux/api/searchApi";
import type { UploadedFileInfo } from "../types/api/upload";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const allowedExt = [".pdf", ".txt"];

const Upload = () => {
  return (
    <>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <Link
          className="inline-flex items-center gap-2 text-[#70757a] hover:text-[#202124] transition-colors duration-200 mb-8 group"
          to="/"
          data-discover="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left size-4 group-hover:-translate-x-1 transition-transform duration-200"
          >
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          <span className="text-sm font-medium">Back to search</span>
        </Link>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-wide antialiased mb-4">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-pink-500 to-orange-500">
              Upload Document
            </span>
          </h1>
          <p className="text-lg text-[#70757a]">
            Upload your PDF or TXT files to make them searchable
          </p>
        </div>

        <UploadArea />
      </div>
    </>
  );
};

export default Upload;

type ProcessingState =
  | "uploading"
  | "uploaded"
  | "indexing"
  | "indexed"
  | "error";

function UploadArea() {
  const [selected, setSelected] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successFiles, setSuccessFiles] = useState<UploadedFileInfo[] | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [indexingPhase, setIndexingPhase] = useState<
    "idle" | "uploaded" | "indexing" | "indexed"
  >("idle");

  const [uploadDocuments, { isLoading }] = useUploadDocumentsMutation();

  const handleReset = useCallback(() => {
    setSelected([]);
    setSuccessFiles(null);
    setError(null);
    setIndexingPhase("idle");
    setShowInput(true);
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        /* ignore */
      }
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const validateFiles = useCallback((files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) {
      setError("No files provided.");
      return null;
    }

    const arr: File[] = Array.from(files);
    for (const f of arr) {
      const name = f.name.toLowerCase();
      const isAllowedExt = allowedExt.some((ext) => name.endsWith(ext));
      const isImage = f.type.startsWith("image/");
      if (!isAllowedExt && !isImage) {
        setError(
          "Unsupported file type. Only .pdf, .txt or image files allowed.",
        );
        return null;
      }
      if (f.size > MAX_BYTES) {
        setError("File too large. Max 10MB per file.");
        return null;
      }
    }

    return arr;
  }, []);

  const doUpload = useCallback(
    async (files: File[]) => {
      setError(null);
      setSuccessFiles(null);

      try {
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        const resp = await uploadDocuments(form).unwrap();
        setSuccessFiles(resp?.saved_files ?? null);

        if (previewUrl) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch {
            /* ignore */
          }
          setPreviewUrl(null);
        }

        setShowInput(false);
        setIndexingPhase("uploaded");
      } catch (err: unknown) {
        const e1 = err as { data?: { message?: string }; message?: string };
        const msg = e1?.data?.message ?? e1?.message ?? "Upload failed.";
        setError(msg);
        if (previewUrl) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch {
            /* ignore */
          }
          setPreviewUrl(null);
        }
        setShowInput(false);
      }
    },
    [uploadDocuments, previewUrl],
  );

  const { data: statusData } = useGetStatusQuery(undefined, {
    pollingInterval: 2000,
  });

  useEffect(() => {
    if (!statusData || indexingPhase === "idle") return;
    const isIndexing =
      (statusData as { response?: { data?: { is_indexing?: boolean } } })
        ?.response?.data?.is_indexing ??
      (statusData as { data?: { is_indexing?: boolean } })?.data?.is_indexing;

    if (isIndexing) {
      setIndexingPhase("indexing");
    } else if (
      !isIndexing &&
      (indexingPhase === "indexing" || indexingPhase === "uploaded")
    ) {
      setIndexingPhase("indexed");
    }
  }, [statusData, indexingPhase]);

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = validateFiles(e.target.files);
      if (!files) {
        setShowInput(false);
        return;
      }
      setSelected(files);

      const img = files.find((f) => f.type.startsWith("image/"));
      if (img) {
        try {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        } catch {
          /* ignore */
        }
        setPreviewUrl(URL.createObjectURL(img));
      }
      setShowInput(false);
      void doUpload(files);
    },
    [validateFiles, doUpload, previewUrl],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = validateFiles(e.dataTransfer.files);
      if (!files) {
        setShowInput(false);
        return;
      }
      setSelected(files);

      const img = files.find((f) => f.type.startsWith("image/"));
      if (img) {
        try {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        } catch {
          /* ignore */
        }
        setPreviewUrl(URL.createObjectURL(img));
      }
      setShowInput(false);
      void doUpload(files);
    },
    [validateFiles, doUpload, previewUrl],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
          /* ignore */
        }
        setPreviewUrl(null);
      }
    };
  }, [previewUrl]);

  // Determine current processing state
  let currentState: ProcessingState | null = null;
  if (error) {
    currentState = "error";
  } else if (isLoading) {
    currentState = "uploading";
  } else if (indexingPhase === "indexed") {
    currentState = "indexed";
  } else if (indexingPhase === "indexing") {
    currentState = "indexing";
  } else if (
    indexingPhase === "uploaded" ||
    (successFiles && successFiles.length > 0)
  ) {
    currentState = "uploaded";
  }

  // Active file details
  const activeFileName =
    selected.length > 0
      ? selected[0].name
      : successFiles && successFiles.length > 0
        ? successFiles[0].name
        : "Document";

  const activeFileSize =
    selected.length > 0
      ? `${(selected[0].size / 1024).toFixed(2)} KB`
      : successFiles && successFiles.length > 0
        ? `${(successFiles[0].size / 1024).toFixed(2)} KB`
        : "";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div
        className="relative group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {showInput && !currentState && (
          <>
            <input
              type="file"
              accept=".pdf,.txt,image/*"
              className="hidden"
              id="file-upload"
              onChange={handleInput}
            />
            <label htmlFor="file-upload" className="block cursor-pointer">
              <div className="relative border-2 border-dashed border-[#dadce0] rounded-3xl p-16 bg-white hover:bg-linear-to-br hover:from-blue-50/30 hover:to-purple-50/30 hover:border-[#4285f4]/40 transition-all duration-300 group-hover:shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-linear-to-br from-purple-50 via-pink-50 to-orange-50 rounded-full group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-upload size-16 text-[#4285f4]"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" x2="12" y1="3" y2="15"></line>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-[#202124] mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-base text-[#70757a]">
                      PDF, TXT or image files (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </>
        )}

        {/* Single Unified Processing Card */}
        {currentState && (
          <div>
            <div
              className={`rounded-2xl border py-7 px-6 shadow-sm transition-all duration-300 ${
                currentState === "uploading"
                  ? "bg-blue-50 border-blue-200"
                  : currentState === "uploaded"
                    ? "bg-amber-50 border-amber-200"
                    : currentState === "indexing"
                      ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                      : currentState === "indexed"
                        ? "bg-emerald-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {/* Card Header Row */}
              <div className="flex items-center justify-between gap-4">
                {/* File Metadata (Icon + Name + Size) */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex-none size-11 rounded-xl flex items-center justify-center ${
                      currentState === "uploading"
                        ? "bg-blue-100/80 text-blue-600"
                        : currentState === "uploaded"
                          ? "bg-amber-100/80 text-amber-600"
                          : currentState === "indexing"
                            ? "bg-yellow-100/80 text-yellow-700"
                            : currentState === "indexed"
                              ? "bg-emerald-100/80 text-green-600"
                              : "bg-red-100/80 text-red-600"
                    }`}
                  >
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold truncate text-gray-900">
                      {activeFileName}
                    </h4>
                    {activeFileSize && (
                      <p className="text-xs text-gray-500 font-medium">
                        {activeFileSize}
                      </p>
                    )}
                  </div>
                </div>

                {/* Inline Status Text & Close/Remove Button */}
                <div className="flex items-center gap-3 flex-none">
                  {/* Clean Inline Header Status Text (No pill badge wrapper) */}
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      currentState === "uploading"
                        ? "text-blue-600"
                        : currentState === "uploaded"
                          ? "text-amber-700"
                          : currentState === "indexing"
                            ? "text-yellow-700"
                            : currentState === "indexed"
                              ? "text-green-700"
                              : "text-red-700"
                    }`}
                  >
                    {currentState === "uploading" && (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    )}

                    {currentState === "uploaded" && (
                      <>
                        <svg
                          className="w-4 h-4 text-amber-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Uploaded</span>
                      </>
                    )}

                    {currentState === "indexing" && (
                      <>
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        <span>Indexing</span>
                      </>
                    )}

                    {currentState === "indexed" && (
                      <>
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 6L9 17l-5-5"
                          />
                        </svg>
                        <span>Indexed</span>
                      </>
                    )}

                    {currentState === "error" && (
                      <>
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Upload Failed</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors cursor-pointer"
                    aria-label="Remove document"
                    title="Remove document"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Optional Preview image if image file uploaded */}
              {previewUrl && (
                <div className="mt-4 text-center">
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="mx-auto rounded-lg shadow max-h-48 object-contain"
                  />
                </div>
              )}
            </div>

            {/* External Action Buttons (Outside Card, Centered directly underneath) */}
            {currentState === "indexed" && (
              <div className="mt-6 text-center animate-fade-in">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-linear-to-r from-purple-600 to-pink-500 text-white font-medium shadow-lg hover:opacity-95 transition-opacity"
                >
                  <span>Start Searching</span>
                  <span className="text-lg">→</span>
                </Link>
              </div>
            )}

            {currentState === "error" && (
              <div className="mt-6 text-center animate-fade-in">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-800 hover:bg-gray-900 text-white font-medium shadow-md transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

