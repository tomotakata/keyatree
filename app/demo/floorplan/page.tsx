"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const GRID = 20;
const CANVAS_W = 800;
const CANVAS_H = 600;

type RoomType = {
  id: string;
  label: string;
  color: string;
  border: string;
};

const ROOM_TYPES: RoomType[] = [
  { id: "living", label: "LDK", color: "#d1fae5", border: "#059669" },
  { id: "bedroom", label: "洋室", color: "#dbeafe", border: "#2563eb" },
  { id: "bedroom2", label: "和室", color: "#fef3c7", border: "#d97706" },
  { id: "bathroom", label: "浴室", color: "#e0e7ff", border: "#6366f1" },
  { id: "toilet", label: "トイレ", color: "#fce7f3", border: "#db2777" },
  { id: "kitchen", label: "台所", color: "#ecfccb", border: "#65a30d" },
  { id: "entrance", label: "玄関", color: "#f3f4f6", border: "#6b7280" },
  { id: "storage", label: "収納", color: "#fef9c3", border: "#ca8a04" },
  { id: "balcony", label: "バルコニー", color: "#e0f2fe", border: "#0284c7" },
];

type Room = {
  id: string;
  typeId: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  border: string;
};

type DragState =
  | { kind: "none" }
  | { kind: "placing"; typeId: string; mx: number; my: number }
  | { kind: "moving"; roomId: string; offX: number; offY: number }
  | { kind: "resizing"; roomId: string; corner: "br"; startX: number; startY: number; origW: number; origH: number };

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

let uidCounter = 1;
function uid() {
  return `room_${uidCounter++}`;
}

export default function FloorplanDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rooms, setRooms] = useState<Room[]>([
    { id: uid(), typeId: "entrance", label: "玄関", x: 40, y: 460, w: 120, h: 80, color: "#f3f4f6", border: "#6b7280" },
    { id: uid(), typeId: "living", label: "LDK", x: 40, y: 120, w: 300, h: 320, color: "#d1fae5", border: "#059669" },
    { id: uid(), typeId: "bedroom", label: "洋室1", x: 380, y: 120, w: 200, h: 180, color: "#dbeafe", border: "#2563eb" },
    { id: uid(), typeId: "bathroom", label: "浴室", x: 380, y: 340, w: 100, h: 100, color: "#e0e7ff", border: "#6366f1" },
    { id: uid(), typeId: "toilet", label: "トイレ", x: 500, y: 340, w: 80, h: 100, color: "#fce7f3", border: "#db2777" },
  ]);
  const [drag, setDrag] = useState<DragState>({ kind: "none" });
  const [selected, setSelected] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<{ id: string; value: string } | null>(null);
  const [propertyName, setPropertyName] = useState("サンプル物件 A");
  const [editProp, setEditProp] = useState(false);

  const svgPt = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag.kind === "none") return;
    const { x, y } = svgPt(e);
    if (drag.kind === "moving") {
      const nx = snap(x - drag.offX);
      const ny = snap(y - drag.offY);
      setRooms(prev => prev.map(r => r.id === drag.roomId ? { ...r, x: nx, y: ny } : r));
    } else if (drag.kind === "resizing") {
      const nx = snap(x - drag.startX + drag.origW);
      const ny = snap(y - drag.startY + drag.origH);
      setRooms(prev => prev.map(r => r.id === drag.roomId ? { ...r, w: Math.max(GRID * 2, nx), h: Math.max(GRID * 2, ny) } : r));
    }
  }, [drag, svgPt]);

  const handleSvgMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.kind === "placing") {
      const { x, y } = svgPt(e);
      const rt = ROOM_TYPES.find(t => t.id === drag.typeId)!;
      const newRoom: Room = {
        id: uid(),
        typeId: rt.id,
        label: rt.label,
        x: snap(x - 60),
        y: snap(y - 40),
        w: 120,
        h: 80,
        color: rt.color,
        border: rt.border,
      };
      setRooms(prev => [...prev, newRoom]);
      setSelected(newRoom.id);
    }
    setDrag({ kind: "none" });
  }, [drag, svgPt]);

  const startMove = useCallback((e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    const { x, y } = svgPt(e);
    setSelected(room.id);
    setDrag({ kind: "moving", roomId: room.id, offX: x - room.x, offY: y - room.y });
  }, [svgPt]);

  const startResize = useCallback((e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    const { x, y } = svgPt(e);
    setDrag({ kind: "resizing", roomId: room.id, corner: "br", startX: x, startY: y, origW: room.w, origH: room.h });
  }, [svgPt]);

  const deleteRoom = useCallback((id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    setSelected(null);
  }, []);

  const startEdit = useCallback((room: Room) => {
    setEditLabel({ id: room.id, value: room.label });
  }, []);

  const commitEdit = useCallback(() => {
    if (!editLabel) return;
    setRooms(prev => prev.map(r => r.id === editLabel.id ? { ...r, label: editLabel.value } : r));
    setEditLabel(null);
  }, [editLabel]);

  const exportSvgSource = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="utf-8"?>\n' + serializer.serializeToString(svg);
  }, []);

  const handleDownloadSvg = () => {
    const source = exportSvgSource();
    if (!source) return;
    const a = document.createElement("a");
    a.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    a.download = `${propertyName}_間取り.svg`;
    a.click();
  };

  const handleDownloadJson = () => {
    const payload = {
      propertyName,
      canvas: {
        width: CANVAS_W,
        height: CANVAS_H,
        grid: GRID,
      },
      rooms,
      exportedAt: new Date().toISOString(),
    };
    const a = document.createElement("a");
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    a.href = url;
    a.download = `${propertyName}_間取り.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    const source = exportSvgSource();
    if (!source) return;
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("png export failed"));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W * 2;
    canvas.height = CANVAS_H * 2;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${propertyName}_間取り.png`;
    a.click();
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const totalArea = rooms.reduce((s, r) => s + (r.w * r.h) / (GRID * GRID), 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
          <span className="text-gray-300">›</span>
          <Link href="/docs" className="text-sm text-gray-500 hover:text-emerald-600">ドキュメント</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">間取り作成デモ</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/docs/floorplan-requirements" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition font-medium">
              要件定義書
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadSvg} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition font-bold">
                SVG保存
              </button>
              <button onClick={handleDownloadPng} className="text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg transition font-bold">
                PNG保存
              </button>
              <button onClick={handleDownloadJson} className="text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition font-bold">
                JSON保存
              </button>
              <button onClick={handlePrintPdf} className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition font-bold">
                PDF印刷
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 py-4 gap-4">
        {/* sidebar: toolbox */}
        <aside className="w-52 flex-shrink-0 space-y-3">
          {/* property name */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">物件名</p>
            {editProp ? (
              <input
                autoFocus
                className="w-full text-sm border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none"
                value={propertyName}
                onChange={e => setPropertyName(e.target.value)}
                onBlur={() => setEditProp(false)}
                onKeyDown={e => e.key === "Enter" && setEditProp(false)}
              />
            ) : (
              <button onClick={() => setEditProp(true)} className="text-sm font-bold text-gray-800 w-full text-left hover:text-emerald-600 transition">
                {propertyName}
              </button>
            )}
          </div>

          {/* room palette */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-3">部屋パーツ</p>
            <p className="text-xs text-gray-400 mb-3">クリックして配置</p>
            <div className="space-y-1.5">
              {ROOM_TYPES.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setDrag({ kind: "placing", typeId: rt.id, mx: 0, my: 0 })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition hover:scale-105 active:scale-95 ${
                    drag.kind === "placing" && drag.typeId === rt.id
                      ? "ring-2 ring-emerald-400"
                      : ""
                  }`}
                  style={{ background: rt.color, borderColor: rt.border, color: rt.border }}
                >
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: rt.border }} />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* stats */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500">概算情報</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">部屋数</span>
                <span className="font-bold text-gray-700">{rooms.length} 室</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">総面積 (概算)</span>
                <span className="font-bold text-gray-700">{totalArea.toFixed(1)} u</span>
              </div>
            </div>
          </div>

          {/* instructions */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-emerald-700 mb-2">操作ガイド</p>
            <ul className="text-xs text-emerald-600 space-y-1">
              <li>部屋パーツを選択してキャンバス上でクリック配置</li>
              <li>部屋をドラッグして移動</li>
              <li>右下角をドラッグでサイズ変更</li>
              <li>ダブルクリックでラベル編集</li>
              <li>Deleteキーで選択部屋を削除</li>
              <li>SVG / PNG / JSON / PDF印刷に対応</li>
            </ul>
          </div>
        </aside>

        {/* canvas area */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden relative flex flex-col">
          {/* canvas header */}
          <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">{propertyName}</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">間取り図</span>
            </div>
            {drag.kind === "placing" && (
              <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                キャンバス上をクリックして配置
              </span>
            )}
            {selected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">選択中</span>
                <button
                  onClick={() => deleteRoom(selected)}
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1 rounded-lg transition font-semibold"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          {/* SVG canvas */}
          <div className="flex-1 overflow-auto">
            <svg
              ref={svgRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className={`block ${drag.kind === "placing" ? "cursor-crosshair" : drag.kind === "moving" ? "cursor-grabbing" : "cursor-default"}`}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onClick={() => { if (drag.kind === "none") setSelected(null); }}
              onKeyDown={(e) => {
                if ((e.key === "Delete" || e.key === "Backspace") && selected) {
                  deleteRoom(selected);
                }
              }}
              tabIndex={0}
              style={{ outline: "none", userSelect: "none" }}
            >
              {/* grid */}
              <defs>
                <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
                <pattern id="gridLarge" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
                  <rect width={GRID * 5} height={GRID * 5} fill="url(#grid)" />
                  <path d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`} fill="none" stroke="#d1d5db" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={CANVAS_W} height={CANVAS_H} fill="url(#gridLarge)" />

              {/* outer wall border */}
              <rect x={20} y={20} width={CANVAS_W - 40} height={CANVAS_H - 40} fill="none" stroke="#374151" strokeWidth="3" strokeDasharray="8 4" rx="2" />

              {/* compass */}
              <g transform="translate(740, 40)">
                <circle cx={20} cy={20} r={18} fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
                <text x={20} y={14} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ef4444">N</text>
                <text x={20} y={33} textAnchor="middle" fontSize="7" fill="#9ca3af">S</text>
                <text x={8} y={24} textAnchor="middle" fontSize="7" fill="#9ca3af">W</text>
                <text x={33} y={24} textAnchor="middle" fontSize="7" fill="#9ca3af">E</text>
                <line x1={20} y1={4} x2={20} y2={18} stroke="#ef4444" strokeWidth="2" />
                <polygon points="20,4 17,12 23,12" fill="#ef4444" />
              </g>

              {/* scale bar */}
              <g transform="translate(30, 560)">
                <rect x={0} y={0} width={80} height={8} fill="none" stroke="#9ca3af" strokeWidth="1" />
                <rect x={0} y={0} width={40} height={8} fill="#9ca3af" fillOpacity="0.3" />
                <rect x={40} y={0} width={40} height={8} fill="#9ca3af" fillOpacity="0.6" />
                <text x={0} y={18} fontSize="8" fill="#9ca3af">0</text>
                <text x={36} y={18} fontSize="8" fill="#9ca3af">2m</text>
                <text x={76} y={18} fontSize="8" fill="#9ca3af">4m</text>
              </g>

              {/* rooms */}
              {rooms.map(room => {
                const isSel = room.id === selected;
                return (
                  <g key={room.id}>
                    <rect
                      x={room.x} y={room.y} width={room.w} height={room.h}
                      fill={room.color}
                      stroke={isSel ? "#059669" : room.border}
                      strokeWidth={isSel ? 2.5 : 1.5}
                      rx={2}
                      className="transition-colors"
                      onMouseDown={(e) => startMove(e, room)}
                      onDoubleClick={(e) => { e.stopPropagation(); startEdit(room); }}
                      style={{ cursor: "grab" }}
                    />
                    {/* label */}
                    {editLabel?.id === room.id ? (
                      <foreignObject x={room.x + 4} y={room.y + room.h / 2 - 12} width={room.w - 8} height={24}>
                        <input
                          autoFocus
                          className="w-full text-center text-xs font-bold bg-transparent border-b border-emerald-400 focus:outline-none"
                          value={editLabel.value}
                          onChange={e => setEditLabel({ ...editLabel, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === "Enter" && commitEdit()}
                          style={{ fontSize: "12px", fontWeight: "bold", color: room.border }}
                        />
                      </foreignObject>
                    ) : (
                      <>
                        <text
                          x={room.x + room.w / 2} y={room.y + room.h / 2 - 4}
                          textAnchor="middle"
                          fontSize={Math.min(14, room.w / 5, room.h / 3)}
                          fontWeight="bold"
                          fill={room.border}
                          className="select-none pointer-events-none"
                        >
                          {room.label}
                        </text>
                        <text
                          x={room.x + room.w / 2} y={room.y + room.h / 2 + 12}
                          textAnchor="middle"
                          fontSize="8"
                          fill={room.border}
                          fillOpacity="0.7"
                          className="select-none pointer-events-none"
                        >
                          {((room.w * room.h) / (GRID * GRID)).toFixed(1)}u
                        </text>
                      </>
                    )}
                    {/* resize handle */}
                    {isSel && (
                      <rect
                        x={room.x + room.w - 8} y={room.y + room.h - 8}
                        width={8} height={8}
                        fill="#059669"
                        rx={2}
                        style={{ cursor: "se-resize" }}
                        onMouseDown={(e) => { e.stopPropagation(); startResize(e, room); }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* footer hint */}
          <div className="px-5 py-2 border-t bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              ダブルクリックでラベル編集 | ドラッグで移動 | 右下角ドラッグでリサイズ
            </p>
            <p className="text-xs text-gray-400">
              {CANVAS_W / GRID * 0.5}m x {CANVAS_H / GRID * 0.5}m キャンバス (1マス = 50cm)
            </p>
          </div>
        </main>
      </div>

      {/* bottom bar */}
      <div className="bg-white border-t shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">デモ注記</span>
            <span className="text-xs text-gray-400">本デモはブラウザ内のみで動作するプロトタイプです。実装版ではSupabase保存、正式PDF出力、寸法表示、物件連携に対応予定です。</span>
          </div>
          <Link
            href="/docs/floorplan-requirements"
            className="ml-auto text-xs text-emerald-600 hover:underline font-semibold flex-shrink-0"
          >
            要件定義書を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
