import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "brand"
  | "brand-outline";

type ButtonSize = "sm" | "default" | "lg" | "xl" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-gray-900 text-white hover:bg-gray-700 focus-visible:outline-gray-900",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-gray-300",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:outline-gray-100",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-100",
  link: "text-blue-600 underline-offset-4 hover:underline focus-visible:outline-blue-600",
  brand:
    "bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-600",
  "brand-outline":
    "border border-green-600 text-green-600 hover:bg-green-50 focus-visible:outline-green-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  default: "h-10 px-4 py-2 text-sm rounded-lg",
  lg: "h-11 px-6 text-base rounded-lg",
  xl: "h-12 px-8 text-base rounded-xl",
  icon: "h-10 w-10 rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";