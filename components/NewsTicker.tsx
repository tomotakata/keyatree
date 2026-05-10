"use client";

export const newsItems = [
  "社内通知：下半期総会に関するお知らせ",
  "社内通知：10月より新オフィスへ移転予定",
  "社内通知：来月の全体会議は11月15日（金）13:00〜",
  "社内通知：鈴木一郎さんが今月の社内MVPを受賞しました！",
  "社内通知：年末調整の書類提出期限は12月1日です",
];

export default function NewsTicker({ items = newsItems }: { items?: string[] }) {
  const repeated = [...items, ...items]; // シームレスループ用に2倍

  return (
    <div className="bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 flex items-stretch">
        {/* NEWSラベル */}
        <div className="flex-shrink-0 bg-emerald-500 text-white text-xs font-black px-3 flex items-center tracking-widest">
          NEWS
        </div>

        {/* スクロールエリア */}
        <div className="flex-1 overflow-hidden relative py-2">
          <div className="flex whitespace-nowrap animate-ticker">
            {repeated.map((item, i) => (
              <span key={i} className="text-xs text-gray-600 font-medium px-8">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
