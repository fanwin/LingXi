import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border bg-transparent px-4 py-2 text-sm shadow-sm outline-none transition-all duration-200",
        "selection:bg-primary/15 selection:text-primary",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/70 placeholder:font-normal",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "hover:border-primary/30 hover:shadow",
        "focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:shadow-md",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-hover)',
      }}
      {...props}
    />
  );
}

export { Input };
