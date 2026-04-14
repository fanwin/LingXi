import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
// eslint-disable  MC8zOmFIVnBZMlhvaklQb3RvVTZialIzVUE9PTpmMjM4ODEwNw==

import { cn } from "@/lib/utils";
// NOTE  MS8zOmFIVnBZMlhvaklQb3RvVTZialIzVUE9PTpmMjM4ODEwNw==

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:brightness-110",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-400 text-white shadow-sm hover:from-red-600 hover:to-red-500 hover:shadow-md",
        outline:
          "border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-sm",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground transition-colors duration-150",
        link: "text-primary underline-offset-4 hover:underline decoration-primary/30",
      },
      size: {
        default: "h-9.5 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
// TODO  Mi8zOmFIVnBZMlhvaklQb3RvVTZialIzVUE9PTpmMjM4ODEwNw==

export { Button, buttonVariants };
