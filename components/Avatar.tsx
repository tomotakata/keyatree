// 名前からハッシュで色を決定する
const COLORS = [
  { bg: "bg-emerald-400", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-blue-400", text: "text-white" },
  { bg: "bg-violet-400", text: "text-white" },
  { bg: "bg-pink-400", text: "text-white" },
  { bg: "bg-amber-400", text: "text-white" },
  { bg: "bg-orange-400", text: "text-white" },
  { bg: "bg-rose-400", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-white" },
  { bg: "bg-indigo-400", text: "text-white" },
];

function colorFromName(name: string) {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0].slice(-1) + parts[1].slice(0, 1);
  return name.slice(0, 2);
}

export default function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const color = colorFromName(name);
  const sizeClass = size === "lg" ? "w-24 h-24 text-2xl" : size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sizeClass} ${color.bg} ${color.text} rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm ${className}`}
    >
      {initials(name)}
    </div>
  );
}
