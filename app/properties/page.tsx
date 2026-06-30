"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFloorplan, getProperties, seedFloorplanData, type PropertyRecord } from "@/lib/floorplanStore";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);

  useEffect(() => {
    seedFloorplanData();
    setProperties(getProperties());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">物件一覧</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">物件一覧</h1>
          <p className="text-sm text-gray-500 mt-1">物件詳細から間取り作成・保存・再編集ができます。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => {
            const floorplan = getFloorplan(property.id);
            return (
              <Link key={property.id} href={`/properties/${property.id}`} className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-gray-800">{property.name}</h2>
                      <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">{property.status}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{property.type}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{property.rent}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{property.station}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-xs text-gray-400">{floorplan ? "間取り保存済み" : "未作成"}</span>
                    <span className="text-xs text-emerald-600 font-bold">詳細を見る</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}