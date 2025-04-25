
import * as React from "react"

interface BadgeProps {
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps & React.HTMLAttributes<HTMLDivElement>) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
    destructive: "bg-destructive text-destructive-foreground",
  }

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
}
