import Link from "next/link";
import { getProperty, seedFloorplanData } from "@/lib/floorplanStore";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  seedFloorplanData();
  const property = getProperty(id);
  if (!property) return null;

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
      </main>
    </div>
  );
}