import { ThanksCard } from "@/lib/mockData";

const tagColors: Record<string, string> = {
  助け合い: "bg-blue-100 text-blue-700",
  頑張り: "bg-yellow-100 text-yellow-700",
  アイデア: "bg-purple-100 text-purple-700",
  感謝: "bg-pink-100 text-pink-700",
};

export default function ThanksHistory({ thanks }: { thanks: ThanksCard[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          サンクスカード
        </h3>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {thanks.length}件
        </span>
      </div>
      <div className="space-y-3">
        {thanks.map((card, i) => (
          <div
            key={i}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                  {card.from.slice(0, 1)}
                </div>
                <span className="text-sm font-semibold text-gray-700">{card.from}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tagColors[card.tag] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {card.tag}
                </span>
                <span className="text-xs text-gray-400">{card.date}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">"{card.message}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
