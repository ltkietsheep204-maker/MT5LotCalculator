import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "warning" | "destructive" }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        variant === "default" && "bg-card",
        variant === "warning" && "border-accent/40 bg-accent/10 text-foreground",
        variant === "destructive" && "border-destructive/40 bg-destructive/10 text-foreground",
        className
      )}
      {...props}
    />
  );
}
