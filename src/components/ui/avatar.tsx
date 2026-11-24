const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-500",
  "bg-sky-600",
  "bg-violet-500",
];

function colorFor(name: string): string {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${colorFor(name)}`}
    >
      {initialsOf(name)}
    </span>
  );
}
