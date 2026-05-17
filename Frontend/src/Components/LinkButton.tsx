import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function LinkButton({
  href,
  children,
  className,
}: LinkButtonProps) {
  return (
    <Link
      to={href}
      className={
        "relative bg-[#f8f9fa] text-sm font-medium px-8 py-3.5 rounded-lg hover:shadow-xl hover:bg-white border border-transparent hover:border-[#dadce0] hover:scale-105 active:scale-95 overflow-hidden transition-all duration-300 group/btn cursor-pointer" +
        (className || "")
      }
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <div className="lucky-overlay absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
    </Link>
  );
}
