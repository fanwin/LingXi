import { cn } from "@/lib/utils";
// TODO  MC8yOmFIVnBZMlhvaklQb3RvVTZlazVGZVE9PToyYTUzMjQ5Nw==

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
// FIXME  MS8yOmFIVnBZMlhvaklQb3RvVTZlazVGZVE9PToyYTUzMjQ5Nw==
