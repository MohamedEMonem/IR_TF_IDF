import { Link } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
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
