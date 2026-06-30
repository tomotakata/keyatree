"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  getFloorplan,
  getFloorplanTemplates,
  saveFloorplan,
  saveFloorplanTemplate,
  type FloorplanRoom,
} from "@/lib/floorplanStore";

const GRID = 20;
const CANVAS_W = 800;
const CANVAS_H = 600;

const ROOM_TYPES = [
  { id: "living", label: "LDK", color: "#d1fae5", border: "#059669" },
  { id: "bedroom", label: "洋室", color: "#dbeafe", border: "#2563eb" },
  { id: "bedroom2", label: "和室", color: "#fef3c7", border: "#d97706" },
  { id: "bathroom", label: "浴室", color: "#e0e7ff", border: "#6366f1" },
  { id: "toilet", label: "トイレ", color: "#fce7f3", border: "#db2777" },
  { id: "kitchen", label: "台所", color: "#ecfccb", border: "#65a30d" },
  { id: "entrance", label: "玄関", color: "#f3f4f6", border: "#6b7280" },
  { id: "storage", label: "収納", color: "#fef9c3", border: "#ca8a04" },
  { id: "balcony", label: "バルコニー", color: "#e0f2fe", border: "#0284c7" },
] as const;

type DragState =
  | { kind: "none" }
  | { kind: "placing"; typeId: string }
  | { kind: "moving"; roomId: string; offX: number; offY: number }
  | { kind: "resizing"; roomId: string; startX: number; startY: number; origW: number; origH: number };

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

function createRoom(typeId: string, x: number, y: number): FloorplanRoom {
  const roomType = ROOM_TYPES.find((room) => room.id === typeId) ?? ROOM_TYPES[0];
  return {
    id: crypto.randomUUID(),
    typeId: roomType.id,
    label: roomType.label,
    x: snap(x - 60),
    y: snap(y - 40),
    w: 120,
    h: 80,
    color: roomType.color,
    border: roomType.border,
  };
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FloorplanEditor({
  propertyId,
  propertyName,
  backHref,
}: {
  propertyId: string;
  propertyName: string;
  backHref: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [rooms, setRooms] = useState<FloorplanRoom[]>([]);
  const [drag, setDrag] = useState<DragState>({ kind: "none" });
  const [selected, setSelected] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<{ id: string; value: string } | null>(null);
  const [templates, setTemplates] = useState(getFloorplanTemplates());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = getFloorplan(propertyId);
    setRooms(saved?.rooms ?? []);
    setTemplates(getFloorplanTemplates());
  }, [propertyId]);

  const selectedRoom = rooms.find((room) => room.id === selected) ?? null;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const svgPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag.kind === "none") return;
    const { x, y } = svgPoint(e);
    if (drag.kind === "moving") {
      setRooms((prev) => prev.map((room) => room.id === drag.roomId ? { ...room, x: snap(x - drag.offX), y: snap(y - drag.offY) } : room));
    }
    if (drag.kind === "resizing") {
      const nextW = snap(x - drag.startX + drag.origW);
      const nextH = snap(y - drag.startY + drag.origH);
      setRooms((prev) => prev.map((room) => room.id === drag.roomId ? { ...room, w: Math.max(GRID * 2, nextW), h: Math.max(GRID * 2, nextH) } : room));
    }
  }, [drag, svgPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.kind === "placing") {
      const { x, y } = svgPoint(e);
      const room = createRoom(drag.typeId, x, y);
      setRooms((prev) => [...prev, room]);
      setSelected(room.id);
    }
    setDrag({ kind: "none" });
  }, [drag, svgPoint]);

  const exportSvgSource = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    return `<?xml version="1.0" encoding="utf-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
  }, []);

  const totalArea = useMemo(
    () => rooms.reduce((sum, room) => sum + (room.w * room.h) / (GRID * GRID), 0),
    [rooms]
  );

  const saveCurrent = async () => {
    const thumbnail = await (async () => {
      if (!exportRef.current) return undefined;
      const canvas = await html2canvas(exportRef.current, { scale: 0.6, backgroundColor: "#ffffff" });
      return canvas.toDataURL("image/png");
    })();
    saveFloorplan({ propertyId, propertyName, rooms, thumbnail });
    showToast("間取り図を下書き保存しました");
  };

  const saveAsTemplate = () => {
    const name = window.prompt("テンプレート名を入力してください", `${propertyName} テンプレート`);
    if (!name?.trim()) return;
    saveFloorplanTemplate(name.trim(), rooms);
    setTemplates(getFloorplanTemplates());
    showToast("テンプレートとして保存しました");
  };

  const downloadSvg = () => {
    const source = exportSvgSource();
    if (!source) return;
    downloadBlob(`${propertyName}_間取り.svg`, new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  };

  const downloadJson = () => {
    downloadBlob(
      `${propertyName}_間取り.json`,
      new Blob([JSON.stringify({ propertyId, propertyName, rooms, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" })
    );
  };

  const downloadPng = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: "#ffffff" });
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(`${propertyName}_間取り.png`, blob);
    });
  };

  const downloadPdf = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 10;
    const renderWidth = pageWidth - margin * 2;
    const renderHeight = (canvas.height * renderWidth) / canvas.width;
    pdf.addImage(imageData, "PNG", margin, 10, renderWidth, renderHeight);
    pdf.save(`${propertyName}_間取り.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">戻る</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">{propertyName} 間取り作成</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={saveCurrent} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold">下書き保存</button>
            <button onClick={saveAsTemplate} className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold">テンプレート保存</button>
            <button onClick={downloadSvg} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold">SVG</button>
            <button onClick={downloadPng} className="text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg font-bold">PNG</button>
            <button onClick={downloadPdf} className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">PDF出力</button>
            <button onClick={downloadJson} className="text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg font-bold">JSON</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-4 flex flex-1 gap-4 overflow-hidden">
        <aside className="w-64 flex-shrink-0 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">部屋パーツ</p>
            <div className="space-y-1.5">
              {ROOM_TYPES.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setDrag({ kind: "placing", typeId: room.id })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition hover:scale-[1.01]"
                  style={{ background: room.color, borderColor: room.border, color: room.border }}
                >
                  <span className="w-3 h-3 rounded-sm" style={{ background: room.border }} />
                  {room.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">テンプレート</p>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setRooms(template.rooms.map((room) => ({ ...room, id: crypto.randomUUID() })));
                    showToast(`テンプレート「${template.name}」を読み込みました`);
                  }}
                  className="w-full text-left text-xs border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-700">{template.name}</p>
                  <p className="text-gray-400 mt-0.5">{template.rooms.length}室</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500">図面情報</p>
            <div className="text-xs flex justify-between"><span className="text-gray-500">部屋数</span><span className="font-bold text-gray-700">{rooms.length} 室</span></div>
            <div className="text-xs flex justify-between"><span className="text-gray-500">総面積</span><span className="font-bold text-gray-700">{totalArea.toFixed(1)} u</span></div>
            {selectedRoom && (
              <div className="pt-2 border-t">
                <p className="text-xs font-bold text-gray-500 mb-1">選択中の部屋</p>
                <input
                  value={editLabel?.id === selectedRoom.id ? editLabel.value : selectedRoom.label}
                  onChange={(e) => setEditLabel({ id: selectedRoom.id, value: e.target.value })}
                  onBlur={() => {
                    if (!editLabel || editLabel.id !== selectedRoom.id) return;
                    setRooms((prev) => prev.map((room) => room.id === selectedRoom.id ? { ...room, label: editLabel.value } : room));
                  }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                />
                <button
                  onClick={() => {
                    setRooms((prev) => prev.filter((room) => room.id !== selectedRoom.id));
                    setSelected(null);
                  }}
                  className="mt-2 w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg py-1.5 font-bold"
                >
                  この部屋を削除
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">{propertyName}</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">編集キャンバス</span>
            </div>
            <span className="text-xs text-gray-400">ダブルクリックで部屋名編集 / ドラッグ移動 / 右下でサイズ変更</span>
          </div>
          <div className="flex-1 overflow-auto bg-gray-50">
            <div ref={exportRef} className="inline-block bg-white">
              <svg
                ref={svgRef}
                width={CANVAS_W}
                height={CANVAS_H}
                tabIndex={0}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => drag.kind === "none" && setSelected(null)}
                onKeyDown={(e) => {
                  if ((e.key === "Delete" || e.key === "Backspace") && selected) {
                    setRooms((prev) => prev.filter((room) => room.id !== selected));
                    setSelected(null);
                  }
                }}
                className="block outline-none"
              >
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
                <rect x={20} y={20} width={CANVAS_W - 40} height={CANVAS_H - 40} fill="none" stroke="#374151" strokeWidth="3" strokeDasharray="8 4" rx="2" />
                {rooms.map((room) => {
                  const isSelected = room.id === selected;
                  return (
                    <g key={room.id}>
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.w}
                        height={room.h}
                        fill={room.color}
                        stroke={isSelected ? "#059669" : room.border}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        rx={2}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const { x, y } = svgPoint(e);
                          setSelected(room.id);
                          setDrag({ kind: "moving", roomId: room.id, offX: x - room.x, offY: y - room.y });
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditLabel({ id: room.id, value: room.label });
                          setSelected(room.id);
                        }}
                        style={{ cursor: "grab" }}
                      />
                      {editLabel?.id === room.id ? (
                        <foreignObject x={room.x + 4} y={room.y + room.h / 2 - 12} width={room.w - 8} height={24}>
                          <input
                            autoFocus
                            value={editLabel.value}
                            onChange={(e) => setEditLabel({ id: room.id, value: e.target.value })}
                            onBlur={() => {
                              setRooms((prev) => prev.map((item) => item.id === room.id ? { ...item, label: editLabel.value } : item));
                              setEditLabel(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setRooms((prev) => prev.map((item) => item.id === room.id ? { ...item, label: editLabel.value } : item));
                                setEditLabel(null);
                              }
                            }}
                            className="w-full text-center text-xs font-bold bg-transparent border-b border-emerald-400 focus:outline-none"
                          />
                        </foreignObject>
                      ) : (
                        <>
                          <text x={room.x + room.w / 2} y={room.y + room.h / 2 - 4} textAnchor="middle" fontSize={Math.min(14, room.w / 5, room.h / 3)} fontWeight="bold" fill={room.border}>
                            {room.label}
                          </text>
                          <text x={room.x + room.w / 2} y={room.y + room.h / 2 + 12} textAnchor="middle" fontSize="8" fill={room.border} fillOpacity="0.7">
                            {((room.w * room.h) / (GRID * GRID)).toFixed(1)}u
                          </text>
                        </>
                      )}
                      {isSelected && (
                        <rect
                          x={room.x + room.w - 8}
                          y={room.y + room.h - 8}
                          width={8}
                          height={8}
                          fill="#059669"
                          rx={2}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const { x, y } = svgPoint(e);
                            setDrag({ kind: "resizing", roomId: room.id, startX: x, startY: y, origW: room.w, origH: room.h });
                          }}
                          style={{ cursor: "se-resize" }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}