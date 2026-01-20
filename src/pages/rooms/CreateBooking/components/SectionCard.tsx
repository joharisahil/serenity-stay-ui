import { cn } from "@/lib/utils";

interface SectionCardProps {
  number: number;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function SectionCard({
  number,
  title,
  disabled = false,
  children,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background shadow-sm",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      {/* Header */}
     <div className="flex items-center gap-3 border-b border-primary/70 bg-primary/15 px-4 py-3">

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          {number}
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}
