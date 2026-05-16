import { Link } from "react-router-dom";
import { useGetStatusQuery } from "../redux/api/searchApi";

const UploadHeader = () => {
  // poll status endpoint to show global indexing state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: statusData } = useGetStatusQuery(undefined, {
    pollingInterval: 100000,
  });

  const isIndexing = statusData?.data.is_indexing;
  const backendStatus = statusData?.data.status;
  const statusText = statusData
    ? isIndexing
      ? "Indexing"
      : (backendStatus ?? "Indexed")
    : "Idle";

  // console.log("statusText :", statusText);
  // console.log("statusData :", statusData);
  // console.log("isIndexing :", isIndexing);
  // console.log("backendStatus :", backendStatus);

  return (
    <>
      <header className="sticky top-0 z-50 animate-fade-in">
        <div className="relative bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 via-orange-500 via-amber-500 to-lime-500 animate-gradient-x"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between py-3">
              <Link
                className="relative group cursor-pointer"
                to="/"
                data-discover="true"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-blue-100/50">
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
                    className="lucide lucide-sparkles size-6 text-[#4285f4] animate-pulse-slow"
                  >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                    <path d="M20 3v4"></path>
                    <path d="M22 5h-4"></path>
                    <path d="M4 17v2"></path>
                    <path d="M5 18H3"></path>
                  </svg>
                  <div className="flex items-center gap-0.5">
                    <div
                      className="size-2 rounded-full bg-[#4285f4] animate-pulse"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="size-2 rounded-full bg-[#ea4335] animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="size-2 rounded-full bg-[#fbbc04] animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                    <div
                      className="size-2 rounded-full bg-[#34a853] animate-pulse"
                      style={{ animationDelay: "0.6s" }}
                    ></div>
                  </div>
                </div>
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
      </header>
    </>
  );
};
export default UploadHeader;
