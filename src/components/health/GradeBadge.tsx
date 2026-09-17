const STYLES: Record<string, string> = {
  ok: "border-border bg-secondary text-secondary-foreground",
  warn: "border-accent/40 bg-accent/15 text-foreground",
  bad: "border-destructive/30 bg-destructive/10 text-destructive",
  urgent: "border-destructive bg-destructive text-destructive-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function GradeBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof STYLES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-base font-semibold ${STYLES[tone]}`}
    >
      {label}
    </span>
  );
}
