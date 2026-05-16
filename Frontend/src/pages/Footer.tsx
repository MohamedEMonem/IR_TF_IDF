const Footer = () => {
  return (
    <>
      <footer className="relative mt-auto border-t border-gray-200/60 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <div className="size-1.5 rounded-full bg-[#4285f4]"></div>
                  <div className="size-1.5 rounded-full bg-[#ea4335]"></div>
                  <div className="size-1.5 rounded-full bg-[#fbbc04]"></div>
                  <div className="size-1.5 rounded-full bg-[#34a853]"></div>
                </div>
                <span className="font-semibold text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                  Findit
                </span>
              </div>
              <span className="text-xs text-[#70757a]">© 2026</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-xs text-[#70757a] hover:text-[#4285f4] transition-colors duration-200"
              >
                About
              </a>
              <a
                href="#"
                className="text-xs text-[#70757a] hover:text-[#4285f4] transition-colors duration-200"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-xs text-[#70757a] hover:text-[#4285f4] transition-colors duration-200"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-xs text-[#70757a] hover:text-[#4285f4] transition-colors duration-200"
              >
                Help
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 via-pink-500 via-orange-500 to-lime-500 opacity-40"></div>
      </footer>
    </>
  );
};
export default Footer;
