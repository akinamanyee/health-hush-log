const STYLES: Record<string, string> = {
  ok: "bg-[oklch(0.9_0.05_150)] text-[oklch(0.38_0.08_150)]",
  warn: "bg-[oklch(0.93_0.06_85)] text-[oklch(0.48_0.1_70)]",
  bad: "bg-[oklch(0.92_0.05_40)] text-[oklch(0.45_0.15_30)]",
  urgent: "bg-destructive text-destructive-foreground",
  neutral: "bg-muted text-muted-foreground",
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
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-base font-semibold ${STYLES[tone]}`}
    >
      {label}
    </span>
  );
}
