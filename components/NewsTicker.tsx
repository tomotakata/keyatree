"use client";

import { useState } from "react";

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  date: string;
  category: string;
};

export const newsItems: NewsItem[] = [
  {
    id: "n1",
    title: "下半期総会に関するお知らせ",
    body: "今年度の下半期総会を11月30日（土）10:00より本社会議室にて開催します。全社員参加必須となりますので、スケジュールの確保をお願いいたします。詳細は後日メールにてご案内します。",
    date: "2025-05-08",
    category: "社内通知",
  },
  {
    id: "n2",
    title: "10月より新オフィスへ移転予定",
    body: "10月1日より本社オフィスを山梨県甲府市〇〇町1-2-3 新ビル5Fへ移転いたします。移転作業は9月28日〜30日を予定しています。詳細は総務部までお問い合わせください。",
    date: "2025-05-07",
    category: "社内通知",
  },
  {
    id: "n3",
    title: "来月の全体会議は11月15日（金）13:00〜",
    body: "11月の全体会議を11月15日（金）13:00〜15:00、本社大会議室にて実施します。各部門の下半期進捗報告と来期計画の共有を予定しています。資料は前日までに提出をお願いします。",
    date: "2025-05-06",
    category: "社内通知",
  },
  {
    id: "n4",
    title: "鈴木一郎さんが今月の社内MVPを受賞しました！",
    body: "鈴木一郎さんが10月度の社内MVPに選出されました。新規顧客獲得件数で社内最多を記録し、チーム全体の成果にも大きく貢献しました。おめでとうございます！",
    date: "2025-05-05",
    category: "表彰",
  },
  {
    id: "n5",
    title: "年末調整の書類提出期限は12月1日です",
    body: "年末調整に必要な書類（扶養控除等申告書・保険料控除申告書など）の提出期限は12月1日（日）です。期限厳守でご提出ください。不明点は総務部・田中までお問い合わせください。",
    date: "2025-05-04",
    category: "社内通知",
  },
];

export default function NewsTicker({ items = newsItems }: { items?: NewsItem[] }) {
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [showList, setShowList] = useState(false);

  const repeated = [...items, ...items];

  return (
    <>
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
                <button
                  key={i}
                  onClick={() => setSelected(item)}
                  className="text-xs text-gray-600 font-medium px-8 hover:text-emerald-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {item.category}：{item.title}
                </button>
              ))}
            </div>
          </div>

          {/* 詳細表示ボタン */}
          <button
            onClick={() => setShowList(true)}
            className="flex-shrink-0 text-xs text-emerald-600 font-semibold px-3 border-l border-gray-100 hover:bg-emerald-50 transition-colors"
          >
            詳細
          </button>
        </div>
      </div>

      {/* 個別詳細モーダル（テキストクリック時） */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-emerald-500 px-5 py-4">
              <span className="text-xs text-emerald-100 font-medium">{selected.category}</span>
              <h3 className="text-white font-bold text-base mt-0.5">{selected.title}</h3>
              <p className="text-xs text-emerald-200 mt-1">{selected.date}</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">{selected.body}</p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setSelected(null)}
                className="w-full text-sm border border-gray-200 rounded-xl py-2.5 text-gray-500 hover:bg-gray-50 font-medium transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一覧モーダル（詳細ボタン時） */}
      {showList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowList(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">社内通知 一覧</h3>
              <button onClick={() => setShowList(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="divide-y max-h-[60vh] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item); setShowList(false); }}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
