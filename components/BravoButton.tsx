"use client";

import { useState, useEffect } from "react";

const MAX_BRAVO = 10;
const STORAGE_KEY = (id: string) => `bravo_${id}_${new Date().toISOString().slice(0, 10)}`;

export default function BravoButton({
  employeeId,
  initialCount,
}: {
  employeeId: string;
  initialCount: number;
}) {
  const [bravoCount, setBravoCount] = useState(initialCount);
  const [myBravo, setMyBravo] = useState(0);
  const [bravoAnim, setBravoAnim] = useState(false);
  const [showMax, setShowMax] = useState(false);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY(employeeId)) ?? "0");
    setMyBravo(saved);
  }, [employeeId]);

  const handleBravo = () => {
    if (myBravo >= MAX_BRAVO) {
      setShowMax(true);
      setTimeout(() => setShowMax(false), 2000);
      return;
    }
    const next = myBravo + 1;
    setMyBravo(next);
    setBravoCount((c) => c + 1);
    localStorage.setItem(STORAGE_KEY(employeeId), String(next));
    setBravoAnim(true);
    setTimeout(() => setBravoAnim(false), 600);
  };

  const remaining = MAX_BRAVO - myBravo;

  return (
    <div className="border-t pt-4 mt-2 flex flex-col items-center gap-2">
      <div className="flex items-center gap-5">
        <div className="text-center">
          <p className="text-2xl font-black text-emerald-500">{bravoCount}</p>
          <p className="text-xs text-gray-400">BRAVO!</p>
        </div>
        <button
          onClick={handleBravo}
          disabled={myBravo >= MAX_BRAVO}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full font-bold text-white shadow-lg transition-all duration-150 select-none text-xs
            ${myBravo >= MAX_BRAVO
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-br from-amber-400 to-orange-500 hover:scale-105 active:scale-95"}
            ${bravoAnim ? "scale-125" : ""}`}
        >
          BRAVO!
        </button>
        <div className="text-center">
          <p className={`text-2xl font-black ${remaining > 0 ? "text-orange-400" : "text-gray-300"}`}>
            {remaining}
          </p>
          <p className="text-xs text-gray-400">残り回数</p>
        </div>
      </div>
      {showMax && (
        <p className="text-xs text-orange-500 font-medium text-center animate-bounce">
          今日のブラボーは使い切りました！
        </p>
      )}
      {!showMax && myBravo === 0 && (
        <p className="text-xs text-gray-400">1日{MAX_BRAVO}回まで応援できます</p>
      )}
      {!showMax && myBravo > 0 && myBravo < MAX_BRAVO && (
        <p className="text-xs text-gray-400">今日あと{remaining}回応援できます</p>
      )}
    </div>
  );
}
