import { Link } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  useUploadDocumentsMutation,
  useGetStatusQuery,
} from "../redux/api/searchApi";
import { useUploadDocumentsMutation } from "../redux/api/searchApi";
import type { UploadedFileInfo } from "../types/api/upload";

const Upload = () => {
  return (
    <>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20">
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
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
  const [pollStatus, setPollStatus] = useState(false);
  const [uploadDocuments, { isLoading }] = useUploadDocumentsMutation();

  const MAX_BYTES = 10 * 1024 * 1024; // 10MB
  const allowedExt = [".pdf", ".txt"];

  const validateFiles = useCallback(
    (files: FileList | null) => {
      setError(null);
      if (!files || files.length === 0) {
        setError("No files provided.");
        return null;
      }

      const arr: File[] = Array.from(files);
      for (const f of arr) {
        const name = f.name.toLowerCase();
        const ok = allowedExt.some((ext) => name.endsWith(ext));
        if (!ok) {
          setError("Unsupported file type. Only .pdf, .txt files allowed.");
          return null;
        }
        if (f.size > MAX_BYTES) {
          setError("File too large. Max 10MB per file.");
          return null;
        }
      }

      return arr;
    },
    [MAX_BYTES, allowedExt],
  );
  const [uploadDocuments, { isLoading, data }] = useUploadDocumentsMutation();
  console.log("data", data);

  const MAX_BYTES = 10 * 1024 * 1024; // 10MB
  const allowedExt = [".pdf", ".txt", ".png", ".jpg", ".jpeg", ".gif"];

  const validateFiles = useCallback((files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) {
      setError("No files provided.");
      return null;
    }

    const arr: File[] = Array.from(files);
    for (const f of arr) {
      const name = f.name.toLowerCase();
      const ok = allowedExt.some((ext) => name.endsWith(ext));
      if (!ok) {
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
        setSuccessFiles(resp.saved_files ?? null);
        setSelected([]);
        // after successful upload we can clear preview and restore input
        if (previewUrl) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch (e) {
            /* ignore */
          }
          setPreviewUrl(null);
        }
        // hide the input and show the uploaded file card
        setShowInput(false);
        // mark uploaded and start polling status for indexing
        setIndexingPhase("uploaded");
        setPollStatus(true);
      } catch (err: unknown) {
        const msg =
          (err as any)?.data?.message ||
          (err as any)?.message ||
          "Upload failed.";
        setError(msg);
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setShowInput(true);
      } catch (err: any) {
        setError(err?.data?.message || err?.message || "Upload failed.");
      }
    },
    [uploadDocuments, previewUrl],
  );

  // poll /api/status while pollStatus is true
  const { data: statusData } = useGetStatusQuery(undefined, {
    pollingInterval: 2000,
  });
  // statusData is transformed to: { is_indexing, status }
  useEffect(() => {
    if (!statusData) return;
    const is_indexing = statusData?.data?.is_indexing;
    console.log("isIndexing: ", is_indexing);
    if (is_indexing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndexingPhase("indexing");
    } else if (!is_indexing && pollStatus) {
      // indexing finished
      setIndexingPhase("indexed");
      setPollStatus(false);
    }
  }, [statusData, pollStatus]);

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = validateFiles(e.target.files);
      if (!files) return;
      setSelected(files);
      // create preview for first image file and hide input
      const img = files.find((f) => f.type.startsWith("image/"));
      if (img) {
        try {
          // revoke previous preview if exists
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        } catch (e) {
          /* ignore */
        }
        } catch {}
        setPreviewUrl(URL.createObjectURL(img));
        setShowInput(false);
      }
      void doUpload(files);
    },
    [validateFiles, doUpload, previewUrl],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = validateFiles(e.dataTransfer.files);
      if (!files) return;
      setSelected(files);
      const img = files.find((f) => f.type.startsWith("image/"));
      if (img) {
        try {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        } catch (e) {
          /* ignore */
        }
        } catch {}
        setPreviewUrl(URL.createObjectURL(img));
        setShowInput(false);
      }
      void doUpload(files);
    },
    [validateFiles, doUpload, previewUrl],
  );

  // cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {
          /* ignore */
        }
        } catch {}
      }
    };
  }, [previewUrl]);

  return (
    <div
      className="max-w-2xl mx-auto animate-fade-in"
      style={{ animationDelay: "0.2s" }}
    >
      <div
        className="relative group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {showInput && (
          <>
            <input
              type="file"
              accept=".pdf,.txt,image/*"
              className="hidden"
              id="file-upload"
              onChange={handleInput}
            />
            <label htmlFor="file-upload" className="block cursor-pointer">
              <div className="relative border-2 border-dashed border-[#dadce0] rounded-3xl p-16 bg-white hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/30 hover:border-[#4285f4]/40 transition-all duration-300 group-hover:shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-full group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
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

        {previewUrl && (
          <div className="mt-4 text-center">
            <img
              src={previewUrl}
              alt="preview"
              className="mx-auto rounded-lg shadow max-h-64 object-contain"
            />
            <div className="mt-2">
              <button
                type="button"
                className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
                onClick={() => {
                  try {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                  } catch {
                    /* ignore */
                  }
                  } catch {}
                  setPreviewUrl(null);
                  setShowInput(true);
                }}
              >
                Remove image
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          {isLoading && <div className="text-blue-600">Uploading...</div>}
          {error && <div className="text-red-600">{error}</div>}

          {(selected.length > 0 ||
            (successFiles && successFiles.length > 0)) && (
            <div className="mt-6">
              <div className="relative rounded-2xl border p-6 bg-white shadow-md flex items-center gap-4">
                <div className="flex-none w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-inner">
                  <svg
                    className="w-8 h-8 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800">
                    {selected.length > 0
                      ? selected[0].name
                      : successFiles![0].name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selected.length > 0
                      ? `${(selected[0].size / 1024).toFixed(2)} KB`
                      : `${(successFiles![0].size / 1024).toFixed(2)} KB`}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelected([]);
                    setSuccessFiles(null);
                    if (previewUrl) {
                      try {
                        URL.revokeObjectURL(previewUrl);
                      } catch (e) {
                        /* ignore */
                      }
                      setPreviewUrl(null);
                    }
                    setShowInput(true);
                  }}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
                  aria-label="remove"
                >
                  <svg
                    className="w-6 h-6"
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

              {successFiles && (
                <>
                  {indexingPhase === "uploaded" && (
                    <div className="mt-6 rounded-2xl border p-6 bg-white shadow-sm">
                      <div className="text-gray-800 font-medium">
                        File uploaded successfully.
                      </div>
                      <div className="text-sm text-gray-600">
                        Waiting for indexing to start...
                      </div>
                    </div>
                  )}

                  {indexingPhase === "indexing" && (
                    <div className="mt-6 rounded-2xl border p-6 bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                        <div>
                          <div className="text-gray-800 font-medium">
                            File indexing in progress
                          </div>
                          <div className="text-sm text-gray-600">
                            This may take a few moments.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {indexingPhase === "indexed" && (
                    <>
                      <div className="mt-6 rounded-2xl border p-6 bg-gradient-to-r from-white to-green-50 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex-none w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-green-600"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-green-700 font-semibold">
                              Document indexed successfully!
                            </div>
                            <div className="text-sm text-gray-600">
                              Ready to search your content
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <Link
                          to="/"
                          className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium shadow-lg hover:opacity-95"
                        >
                          Start Searching
                          <span className="ml-2">→</span>
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}
        <div className="mt-4 text-sm">
          {isLoading && <div className="text-blue-600">Uploading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {selected.length > 0 && (
            <div className="mt-2">
              <strong>Selected:</strong>
              <ul className="list-disc list-inside">
                {selected.map((f) => (
                  <li key={f.name}>
                    {f.name} ({Math.round(f.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {successFiles && (
            <div className="mt-4">
              <strong className="text-green-700">Uploaded:</strong>
              <ul className="list-disc list-inside">
                {successFiles.map((f) => (
                  <li key={f.stored_name}>
                    {f.name} ({Math.round(f.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
