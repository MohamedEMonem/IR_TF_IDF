import type { ReactNode, ButtonHTMLAttributes } from "react";
import { classNames } from "../utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "lucky" | "none";
  size?: "sm" | "md" | "lg";
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = "font-medium rounded transition-colors";

  const variantStyles = {
    primary: "rounded bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "rounded bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "rounded bg-red-600 text-white hover:bg-red-700",
    lucky:
      "relative bg-[#f8f9fa] text-sm font-medium px-8 py-3.5 rounded-lg hover:shadow-xl hover:bg-white border border-transparent hover:border-[#dadce0] hover:scale-105 active:scale-95 overflow-hidden transition-all duration-300 group/btn text-black",
    none: "",
  };

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={props.type ?? "button"}
      aria-label={
        variant === "lucky"
          ? (props["aria-label"] ?? undefined)
          : props["aria-label"]
      }
      className={classNames(
        variant === "lucky"
          ? classNames(variantStyles.lucky, className)
          : classNames(baseStyles, variantStyles[variant], sizeStyles[size], className),
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
      disabled={disabled}
      {...props}
    >
      {variant === "lucky" ? (
        <>
          <span className="relative z-10">{children}</span>
          <div className="lucky-overlay absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
        </>
      ) : (
        children
      )}
    </button>
  );
};
