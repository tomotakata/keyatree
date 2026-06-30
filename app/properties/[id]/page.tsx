import Link from "next/link";
import { getFloorplan, getProperty } from "@/lib/floorplanStore";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) return null;
  const floorplan = getFloorplan(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/properties" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">物件一覧</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">{property.name}</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{property.name}</h1>
              <p className="text-sm text-gray-500 mt-2">{property.address}</p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{property.type}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{property.rent}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{property.station}</span>
              </div>
            </div>
            <Link href={`/properties/${property.id}/floorplan`} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition">
              間取りを作成・編集する
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">保存済み間取り</h2>
              <p className="text-sm text-gray-500 mt-1">最新の下書き保存内容を確認できます。</p>
            </div>
            <Link href={`/properties/${property.id}/floorplan`} className="text-sm text-emerald-600 font-bold hover:underline">
              編集を開く
            </Link>
          </div>
          {!floorplan ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              まだ間取りは保存されていません
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-[320px_1fr]">
              {floorplan.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={floorplan.thumbnail} alt={`${property.name} 間取り`} className="h-56 w-full rounded-xl border object-cover bg-gray-50" />
              ) : (
                <div className="h-56 rounded-xl border bg-gray-50" />
              )}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">部屋 {floorplan.rooms.length}室</span>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">建具・記号 {floorplan.symbols.length}件</span>
                </div>
                <p className="text-sm text-gray-500">最終更新: {new Date(floorplan.updatedAt).toLocaleString("ja-JP")}</p>
                <p className="text-sm text-gray-600">次の段階で、複製・一覧履歴・比較表示も追加していきます。</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}