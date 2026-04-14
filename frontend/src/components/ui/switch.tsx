"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      style={{
        display: "inline-flex",
        height: "22px",
        width: "40px",
        alignItems: "center",
        borderRadius: "9999px",
        border: "none",
        backgroundColor: "var(--color-border)",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
      }}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:!bg-[var(--color-primary)] data-[state=checked]:!shadow-[inset_0_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(13,148,136,0.3)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        style={{
          display: "block",
          width: "18px",
          height: "18px",
          borderRadius: "9999px",
          backgroundColor: "white",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0,0,0,0.1)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: "translateX(2px)",
        }}
        className="data-[state=checked]:!translate-x-[20px] data-[state=checked]:!scale-105"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
