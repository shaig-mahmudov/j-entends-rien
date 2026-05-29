import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

export function Button({ className = "", variant = "primary", icon, children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-cyanGlow text-ink shadow-glow hover:bg-cyan-200",
    secondary: "border border-white/12 bg-white/8 text-white hover:bg-white/12",
    ghost: "text-white/75 hover:bg-white/10"
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
