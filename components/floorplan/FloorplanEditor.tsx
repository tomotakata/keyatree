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
  type FloorplanSymbol,
  type FloorplanSymbolType,
  type FloorplanDimension,
  type FloorplanText,
  type FloorplanWall,
  getAllFloorplans,
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

const SYMBOL_TYPES: { id: FloorplanSymbolType; label: string }[] = [
  { id: "door", label: "ドア" },
  { id: "window", label: "窓" },
  { id: "sliding", label: "引違戸" },
  { id: "north", label: "方位" },
];

const ADVANCED_SYMBOL_TYPES = [
  { id: "doubleDoor", label: "両開戸" },
  { id: "foldingDoor", label: "折戸" },
  { id: "fixWindow", label: "FIX窓" },
  { id: "pocketDoor", label: "引込戸" },
] as const;

const EQUIPMENT_TYPES: { id: FloorplanSymbolType; label: string }[] = [
  { id: "sink", label: "流し台" },
  { id: "stove", label: "コンロ" },
  { id: "bath", label: "浴槽" },
  { id: "washstand", label: "洗面台" },
  { id: "toiletBowl", label: "便器" },
  { id: "fridge", label: "冷蔵庫" },
  { id: "washer", label: "洗濯機" },
];

const PRESET_TEXTS = [
  "洋室6帖",
  "洋室4.5帖",
  "和室6帖",
  "LDK16帖",
  "DK8帖",
  "玄関",
  "廊下",
  "クローゼット",
  "押入",
  "ベランダ",
] as const;

function toMeters(value: number) {
  return `${(value / 40).toFixed(1)}m`;
}

type EditorSnapshot = {
  rooms: FloorplanRoom[];
  symbols: FloorplanSymbol[];
  dimensions: FloorplanDimension[];
  texts: FloorplanText[];
  walls: FloorplanWall[];
};

type ClipboardPayload =
  | { kind: "room"; room: FloorplanRoom }
  | { kind: "symbol"; symbol: FloorplanSymbol }
  | { kind: "text"; text: FloorplanText }
  | { kind: "wall"; wall: FloorplanWall };

type DragState =
  | { kind: "none" }
  | { kind: "placing"; typeId: string }
  | { kind: "moving"; roomId: string; offX: number; offY: number }
  | { kind: "moving-symbol"; symbolId: string; offX: number; offY: number }
  | { kind: "rotating-symbol"; symbolId: string; cx: number; cy: number }
  | { kind: "rotating-room"; roomId: string; cx: number; cy: number }
  | { kind: "moving-wall"; wallId: string; offX: number; offY: number }
  | { kind: "moving-wall-endpoint"; wallId: string; endpoint: 1 | 2 }
  | { kind: "resizing"; roomId: string; startX: number; startY: number; origW: number; origH: number };

const SNAP = GRID / 2;

function snap(v: number) {
  return Math.round(v / SNAP) * SNAP;
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
    rotation: 0,
  };
}

function createSymbol(type: FloorplanSymbolType, x: number, y: number): FloorplanSymbol {
  if (type === "north") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 34, h: 34 };
  if (type === "window") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 80, h: 16, rotation: 0 };
  if (type === "sliding") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 90, h: 20, rotation: 0 };
  if (type === "sink") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 60, h: 40, rotation: 0 };
  if (type === "stove") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 60, h: 40, rotation: 0 };
  if (type === "bath") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 80, h: 60, rotation: 0 };
  if (type === "washstand") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 50, h: 40, rotation: 0 };
  if (type === "toiletBowl") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 40, h: 56, rotation: 0 };
  if (type === "fridge") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 40, h: 40, rotation: 0 };
  if (type === "washer") return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 40, h: 40, rotation: 0 };
  return { id: crypto.randomUUID(), type, x: snap(x), y: snap(y), w: 42, h: 42, rotation: 0 };
}

function createWall(x: number, y: number): FloorplanWall {
  return {
    id: crypto.randomUUID(),
    x1: snap(x),
    y1: snap(y),
    x2: snap(x + 160),
    y2: snap(y),
    thickness: 8,
    wallType: "straight",
  };
}

const WALL_Z_BASE = 0;
const ROOM_Z_BASE = 1000;
const SYMBOL_Z_BASE = 2000;
const zOfWall = (w: FloorplanWall) => w.zIndex ?? WALL_Z_BASE;
const zOfRoom = (r: FloorplanRoom) => r.zIndex ?? ROOM_Z_BASE;
const zOfSymbol = (s: FloorplanSymbol) => s.zIndex ?? SYMBOL_Z_BASE;

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
  const [symbols, setSymbols] = useState<FloorplanSymbol[]>([]);
  const [dimensions, setDimensions] = useState<FloorplanDimension[]>([]);
  const [texts, setTexts] = useState<FloorplanText[]>([]);
  const [walls, setWalls] = useState<FloorplanWall[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedPlans, setSavedPlans] = useState(getAllFloorplans());
  const [drag, setDrag] = useState<DragState>({ kind: "none" });
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedWall, setSelectedWall] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<{ id: string; value: string } | null>(null);
  const [editText, setEditText] = useState<{ id: string; value: string } | null>(null);
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [future, setFuture] = useState<EditorSnapshot[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardPayload | null>(null);
  const [templates, setTemplates] = useState(getFloorplanTemplates());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = getFloorplan(propertyId);
    setRooms(saved?.rooms ?? []);
    setSymbols(saved?.symbols ?? []);
    setDimensions(saved?.dimensions ?? []);
    setTexts(saved?.texts ?? []);
    setWalls(saved?.walls ?? []);
    setTemplates(getFloorplanTemplates());
    setSavedPlans(getAllFloorplans());
    setHistory([]);
    setFuture([]);
  }, [propertyId]);

  const selectedRoom = rooms.find((room) => room.id === selected) ?? null;
  const selectedTextItem = texts.find((item) => item.id === selectedText) ?? null;
  const selectedWallItem = walls.find((item) => item.id === selectedWall) ?? null;

  const snapshot = useCallback(
    (): EditorSnapshot => ({
      rooms: structuredClone(rooms),
      symbols: structuredClone(symbols),
      dimensions: structuredClone(dimensions),
      texts: structuredClone(texts),
      walls: structuredClone(walls),
    }),
    [dimensions, rooms, symbols, texts, walls]
  );

  const restoreSnapshot = useCallback((next: EditorSnapshot) => {
    setRooms(next.rooms);
    setSymbols(next.symbols);
    setDimensions(next.dimensions);
    setTexts(next.texts);
    setWalls(next.walls);
    setSelected(null);
    setSelectedSymbol(null);
    setSelectedText(null);
    setSelectedWall(null);
  }, []);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-39), snapshot()]);
    setFuture([]);
  }, [snapshot]);

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
    if (drag.kind === "moving-symbol") {
      setSymbols((prev) => prev.map((symbol) => symbol.id === drag.symbolId ? { ...symbol, x: snap(x - drag.offX), y: snap(y - drag.offY) } : symbol));
    }
    if (drag.kind === "rotating-symbol") {
      const raw = Math.atan2(y - drag.cy, x - drag.cx) * 180 / Math.PI + 90;
      const stepped = Math.round(raw / 15) * 15;
      const deg = ((stepped % 360) + 360) % 360;
      setSymbols((prev) => prev.map((symbol) => symbol.id === drag.symbolId ? { ...symbol, rotation: deg } : symbol));
    }
    if (drag.kind === "rotating-room") {
      const raw = Math.atan2(y - drag.cy, x - drag.cx) * 180 / Math.PI + 90;
      const stepped = Math.round(raw / 15) * 15;
      const deg = ((stepped % 360) + 360) % 360;
      setRooms((prev) => prev.map((room) => room.id === drag.roomId ? { ...room, rotation: deg } : room));
    }
    if (drag.kind === "moving-wall") {
      setWalls((prev) => prev.map((wall) => wall.id === drag.wallId ? {
        ...wall,
        x1: snap(x - drag.offX),
        y1: snap(y - drag.offY),
        x2: snap(x - drag.offX + (wall.x2 - wall.x1)),
        y2: snap(y - drag.offY + (wall.y2 - wall.y1)),
      } : wall));
    }
    if (drag.kind === "moving-wall-endpoint") {
      setWalls((prev) => prev.map((wall) => wall.id === drag.wallId
        ? (drag.endpoint === 1
            ? { ...wall, x1: snap(x), y1: snap(y) }
            : { ...wall, x2: snap(x), y2: snap(y) })
        : wall));
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
      if (drag.typeId === "wall") {
        pushHistory();
        const wall = createWall(x, y);
        setWalls((prev) => [...prev, wall]);
        setSelectedWall(wall.id);
        setSelected(null);
        setSelectedSymbol(null);
        setSelectedText(null);
      } else if (ROOM_TYPES.some((room) => room.id === drag.typeId)) {
        pushHistory();
        const room = createRoom(drag.typeId, x, y);
        setRooms((prev) => [...prev, room]);
        setSelected(room.id);
        setSelectedSymbol(null);
        setSelectedText(null);
        setSelectedWall(null);
      } else {
        pushHistory();
        const symbol = createSymbol(
          (drag.typeId === "doubleDoor" ? "door" :
            drag.typeId === "foldingDoor" ? "door" :
            drag.typeId === "fixWindow" ? "window" :
            drag.typeId === "pocketDoor" ? "sliding" :
            drag.typeId) as FloorplanSymbolType,
          x,
          y
        );
        setSymbols((prev) => [...prev, symbol]);
        setSelectedSymbol(symbol.id);
        setSelected(null);
        setSelectedText(null);
        setSelectedWall(null);
      }
    }
    setDrag({ kind: "none" });
  }, [drag, pushHistory, svgPoint]);

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
    saveFloorplan({ propertyId, propertyName, rooms, symbols, dimensions, texts, walls, thumbnail });
    setSavedPlans(getAllFloorplans());
    showToast("間取り図を下書き保存しました");
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const latest = prev[prev.length - 1];
      setFuture((futurePrev) => [snapshot(), ...futurePrev].slice(0, 40));
      restoreSnapshot(latest);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const latest = prev[0];
      setHistory((historyPrev) => [...historyPrev.slice(-39), snapshot()]);
      restoreSnapshot(latest);
      return prev.slice(1);
    });
  };

  const duplicateCurrent = () => {
    const duplicatedName = window.prompt("複製名を入力してください", `${propertyName} 複製`);
    if (!duplicatedName?.trim()) return;
    const duplicatedId = `${propertyId}-copy-${Date.now()}`;
    saveFloorplan({
      id: crypto.randomUUID(),
      propertyId: duplicatedId,
      propertyName: duplicatedName.trim(),
      rooms: rooms.map((room) => ({ ...room, id: crypto.randomUUID() })),
      symbols: symbols.map((symbol) => ({ ...symbol, id: crypto.randomUUID() })),
      dimensions: dimensions.map((dimension) => ({ ...dimension, id: crypto.randomUUID() })),
      texts: texts.map((text) => ({ ...text, id: crypto.randomUUID() })),
      walls: walls.map((wall) => ({ ...wall, id: crypto.randomUUID() })),
      thumbnail: undefined,
    });
    setSavedPlans(getAllFloorplans());
    showToast("複製を保存しました");
  };

  const addRoomDimension = () => {
    if (!selected) return;
    const room = rooms.find((item) => item.id === selected);
    if (!room) return;
    pushHistory();
    setDimensions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        x1: room.x,
        y1: room.y - 12,
        x2: room.x + room.w,
        y2: room.y - 12,
        label: toMeters(room.w),
      },
      {
        id: crypto.randomUUID(),
        x1: room.x + room.w + 12,
        y1: room.y,
        x2: room.x + room.w + 12,
        y2: room.y + room.h,
        label: toMeters(room.h),
      },
    ]);
    showToast("寸法線を追加しました");
  };

  const addFreeText = () => {
    const raw = window.prompt("表示する文字を入力してください", "洋室6帖");
    if (!raw?.trim()) return;
    pushHistory();
    const textItem: FloorplanText = {
      id: crypto.randomUUID(),
      text: raw.trim(),
      x: 80,
      y: 80,
      fontSize: 14,
    };
    setTexts((prev) => [...prev, textItem]);
    setSelectedText(textItem.id);
    setSelected(null);
    setSelectedSymbol(null);
    showToast("文字を追加しました");
  };

  const addPresetText = (label: string) => {
    pushHistory();
    const textItem: FloorplanText = {
      id: crypto.randomUUID(),
      text: label,
      x: 80,
      y: 80,
      fontSize: 14,
    };
    setTexts((prev) => [...prev, textItem]);
    setSelectedText(textItem.id);
    setSelected(null);
    setSelectedSymbol(null);
    setSelectedWall(null);
    showToast(`「${label}」を追加しました`);
  };

  const rotateSelectedSymbol = (delta = 90) => {
    if (!selectedSymbol) return;
    pushHistory();
    setSymbols((prev) => prev.map((symbol) => symbol.id === selectedSymbol
      ? { ...symbol, rotation: ((((symbol.rotation ?? 0) + delta) % 360) + 360) % 360 }
      : symbol));
  };

  const resetSymbolRotation = () => {
    if (!selectedSymbol) return;
    pushHistory();
    setSymbols((prev) => prev.map((symbol) => symbol.id === selectedSymbol
      ? { ...symbol, rotation: 0 }
      : symbol));
  };

  const rotateSelectedRoom = (delta = 90) => {
    if (!selected) return;
    pushHistory();
    setRooms((prev) => prev.map((room) => room.id === selected
      ? { ...room, rotation: ((((room.rotation ?? 0) + delta) % 360) + 360) % 360 }
      : room));
  };

  const resetRoomRotation = () => {
    if (!selected) return;
    pushHistory();
    setRooms((prev) => prev.map((room) => room.id === selected
      ? { ...room, rotation: 0 }
      : room));
  };

  const bringSelectedToFront = () => {
    const allZ = [...walls.map(zOfWall), ...rooms.map(zOfRoom), ...symbols.map(zOfSymbol)];
    const next = (allZ.length ? Math.max(...allZ) : 0) + 1;
    if (selected) {
      pushHistory();
      setRooms((prev) => prev.map((room) => room.id === selected ? { ...room, zIndex: next } : room));
    } else if (selectedWall) {
      pushHistory();
      setWalls((prev) => prev.map((wall) => wall.id === selectedWall ? { ...wall, zIndex: next } : wall));
    } else if (selectedSymbol) {
      pushHistory();
      setSymbols((prev) => prev.map((symbol) => symbol.id === selectedSymbol ? { ...symbol, zIndex: next } : symbol));
    }
  };

  const sendSelectedToBack = () => {
    const allZ = [...walls.map(zOfWall), ...rooms.map(zOfRoom), ...symbols.map(zOfSymbol)];
    const next = (allZ.length ? Math.min(...allZ) : 0) - 1;
    if (selected) {
      pushHistory();
      setRooms((prev) => prev.map((room) => room.id === selected ? { ...room, zIndex: next } : room));
    } else if (selectedWall) {
      pushHistory();
      setWalls((prev) => prev.map((wall) => wall.id === selectedWall ? { ...wall, zIndex: next } : wall));
    } else if (selectedSymbol) {
      pushHistory();
      setSymbols((prev) => prev.map((symbol) => symbol.id === selectedSymbol ? { ...symbol, zIndex: next } : symbol));
    }
  };

  const copySelected = () => {
    if (selectedRoom) {
      setClipboard({ kind: "room", room: structuredClone(selectedRoom) });
      showToast("部屋をコピーしました");
      return;
    }
    if (selectedWallItem) {
      setClipboard({ kind: "wall", wall: structuredClone(selectedWallItem) });
      showToast("壁をコピーしました");
      return;
    }
    const symbol = symbols.find((item) => item.id === selectedSymbol);
    if (symbol) {
      setClipboard({ kind: "symbol", symbol: structuredClone(symbol) });
      showToast("記号をコピーしました");
      return;
    }
    if (selectedTextItem) {
      setClipboard({ kind: "text", text: structuredClone(selectedTextItem) });
      showToast("文字をコピーしました");
    }
  };

  const pasteClipboard = () => {
    if (!clipboard) return;
    pushHistory();
    if (clipboard.kind === "room") {
      const pasted = {
        ...clipboard.room,
        id: crypto.randomUUID(),
        x: clipboard.room.x + 20,
        y: clipboard.room.y + 20,
      };
      setRooms((prev) => [...prev, pasted]);
      setSelected(pasted.id);
      setSelectedSymbol(null);
      setSelectedText(null);
      showToast("部屋を貼り付けました");
      return;
    }
    if (clipboard.kind === "symbol") {
      const pasted = {
        ...clipboard.symbol,
        id: crypto.randomUUID(),
        x: clipboard.symbol.x + 20,
        y: clipboard.symbol.y + 20,
      };
      setSymbols((prev) => [...prev, pasted]);
      setSelected(null);
      setSelectedSymbol(pasted.id);
      setSelectedText(null);
      showToast("記号を貼り付けました");
      return;
    }
    if (clipboard.kind === "wall") {
      const pasted = {
        ...clipboard.wall,
        id: crypto.randomUUID(),
        x1: clipboard.wall.x1 + 20,
        y1: clipboard.wall.y1 + 20,
        x2: clipboard.wall.x2 + 20,
        y2: clipboard.wall.y2 + 20,
      };
      setWalls((prev) => [...prev, pasted]);
      setSelected(null);
      setSelectedSymbol(null);
      setSelectedText(null);
      setSelectedWall(pasted.id);
      showToast("壁を貼り付けました");
      return;
    }
    const pasted = {
      ...clipboard.text,
      id: crypto.randomUUID(),
      x: clipboard.text.x + 20,
      y: clipboard.text.y + 20,
    };
    setTexts((prev) => [...prev, pasted]);
    setSelected(null);
    setSelectedSymbol(null);
    setSelectedText(pasted.id);
    showToast("文字を貼り付けました");
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

  const renderWallNode = (wall: FloorplanWall) => (
    <line
      key={wall.id}
      x1={wall.x1}
      y1={wall.y1}
      x2={wall.x2}
      y2={wall.y2}
      stroke={selectedWall === wall.id ? "#059669" : "#374151"}
      strokeWidth={wall.thickness}
      strokeLinecap="round"
      onMouseDown={(e) => {
        e.stopPropagation();
        const { x, y } = svgPoint(e);
        setSelected(null);
        setSelectedSymbol(null);
        setSelectedText(null);
        setSelectedWall(wall.id);
        setDrag({ kind: "moving-wall", wallId: wall.id, offX: x - wall.x1, offY: y - wall.y1 });
      }}
      style={{ cursor: "grab" }}
    />
  );

  const renderRoomNode = (room: FloorplanRoom) => {
    const isSelected = room.id === selected;
    return (
      <g
        key={room.id}
        transform={`rotate(${room.rotation ?? 0} ${room.x + room.w / 2} ${room.y + room.h / 2})`}
      >
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
          <>
            <rect
              x={room.x - 3}
              y={room.y - 3}
              width={room.w + 6}
              height={room.h + 6}
              fill="none"
              stroke="#059669"
              strokeWidth={1}
              strokeDasharray="4 3"
              pointerEvents="none"
            />
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
            <line
              x1={room.x + room.w / 2}
              y1={room.y - 3}
              x2={room.x + room.w / 2}
              y2={room.y - 24}
              stroke="#059669"
              strokeWidth={1.5}
              pointerEvents="none"
            />
            <circle
              cx={room.x + room.w / 2}
              cy={room.y - 28}
              r={8}
              fill="#059669"
              stroke="white"
              strokeWidth={2}
              style={{ cursor: "grab" }}
              onMouseDown={(e) => {
                e.stopPropagation();
                pushHistory();
                setSelected(room.id);
                setDrag({
                  kind: "rotating-room",
                  roomId: room.id,
                  cx: room.x + room.w / 2,
                  cy: room.y + room.h / 2,
                });
              }}
            />
            <path
              d="M -4 -30 A 4.5 4.5 0 1 1 -4 -26"
              transform={`translate(${room.x + room.w / 2} 0)`}
              fill="none"
              stroke="white"
              strokeWidth={1.4}
              pointerEvents="none"
            />
          </>
        )}
      </g>
    );
  };

  const renderSymbolNode = (symbol: FloorplanSymbol) => (
    <g
      key={symbol.id}
      transform={`translate(${symbol.x} ${symbol.y}) rotate(${symbol.rotation ?? 0} ${symbol.w / 2} ${symbol.h / 2})`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.stopPropagation();
        const { x, y } = svgPoint(e);
        setSelected(null);
        setSelectedWall(null);
        setSelectedSymbol(symbol.id);
        setDrag({ kind: "moving-symbol", symbolId: symbol.id, offX: x - symbol.x, offY: y - symbol.y });
      }}
      style={{ cursor: "grab" }}
    >
      <rect x={0} y={0} width={symbol.w} height={symbol.h} fill="transparent" />
      {symbol.type === "north" && (
        <>
          <circle cx={symbol.w / 2} cy={symbol.h / 2} r={16} fill="white" stroke={selectedSymbol === symbol.id ? "#059669" : "#d1d5db"} strokeWidth="1.5" />
          <text x={symbol.w / 2} y={12} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ef4444">N</text>
          <line x1={symbol.w / 2} y1={5} x2={symbol.w / 2} y2={18} stroke="#ef4444" strokeWidth="2" />
          <polygon points="17,5 20,12 23,5" fill="#ef4444" />
        </>
      )}
      {symbol.type === "door" && (
        <>
          <line x1="4" y1={symbol.h - 4} x2="4" y2="4" stroke="#374151" strokeWidth="2" />
          <path d={`M 4 ${symbol.h - 4} A ${symbol.w - 8} ${symbol.h - 8} 0 0 1 ${symbol.w - 4} 4`} fill="none" stroke="#9ca3af" strokeDasharray="4 2" />
          <line x1="4" y1={symbol.h - 4} x2={symbol.w - 4} y2="4" stroke="#374151" strokeWidth="2" />
        </>
      )}
      {symbol.type === "window" && (
        <>
          <rect x="4" y="4" width={symbol.w - 8} height={symbol.h - 8} rx="3" fill="#e0f2fe" stroke={selectedSymbol === symbol.id ? "#059669" : "#0284c7"} strokeWidth="2" />
          <line x1={symbol.w / 2} y1="4" x2={symbol.w / 2} y2={symbol.h - 4} stroke="#0284c7" strokeWidth="1.5" />
        </>
      )}
      {symbol.type === "sliding" && (
        <>
          <rect x="4" y="3" width={symbol.w - 8} height={symbol.h - 6} rx="3" fill="white" stroke={selectedSymbol === symbol.id ? "#059669" : "#6366f1"} strokeWidth="2" />
          <line x1={symbol.w / 2} y1="5" x2={symbol.w / 2} y2={symbol.h - 5} stroke="#6366f1" strokeWidth="1.5" />
          <line x1="8" y1={symbol.h / 2} x2={symbol.w - 8} y2={symbol.h / 2} stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" />
        </>
      )}
      {symbol.type === "sink" && (
        <>
          <rect x="2" y="2" width={symbol.w - 4} height={symbol.h - 4} rx="4" fill="#f1f5f9" stroke={selectedSymbol === symbol.id ? "#059669" : "#64748b"} strokeWidth="2" />
          <ellipse cx={symbol.w / 2} cy={symbol.h / 2 + 4} rx={symbol.w / 4} ry={symbol.h / 4} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx={symbol.w / 2} cy={8} r={2.5} fill="#94a3b8" />
          <text x={symbol.w / 2} y={symbol.h - 4} textAnchor="middle" fontSize="7" fill="#64748b">流し</text>
        </>
      )}
      {symbol.type === "stove" && (
        <>
          <rect x="2" y="2" width={symbol.w - 4} height={symbol.h - 4} rx="4" fill="#fef2f2" stroke={selectedSymbol === symbol.id ? "#059669" : "#9ca3af"} strokeWidth="2" />
          <circle cx={symbol.w / 3} cy={symbol.h / 2} r={7} fill="none" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx={(symbol.w / 3) * 2} cy={symbol.h / 2} r={7} fill="none" stroke="#ef4444" strokeWidth="1.5" />
          <text x={symbol.w / 2} y={symbol.h - 3} textAnchor="middle" fontSize="7" fill="#9ca3af">コンロ</text>
        </>
      )}
      {symbol.type === "bath" && (
        <>
          <rect x="2" y="2" width={symbol.w - 4} height={symbol.h - 4} rx="10" fill="#e0f2fe" stroke={selectedSymbol === symbol.id ? "#059669" : "#0284c7"} strokeWidth="2" />
          <rect x="8" y="8" width={symbol.w - 16} height={symbol.h - 16} rx="8" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
          <text x={symbol.w / 2} y={symbol.h / 2 + 3} textAnchor="middle" fontSize="8" fill="#0369a1">浴槽</text>
        </>
      )}
      {symbol.type === "washstand" && (
        <>
          <rect x="2" y="2" width={symbol.w - 4} height={symbol.h - 4} rx="4" fill="#f0fdfa" stroke={selectedSymbol === symbol.id ? "#059669" : "#14b8a6"} strokeWidth="2" />
          <ellipse cx={symbol.w / 2} cy={symbol.h / 2 + 2} rx={symbol.w / 4} ry={symbol.h / 5} fill="#ccfbf1" stroke="#14b8a6" strokeWidth="1.5" />
          <circle cx={symbol.w / 2} cy={8} r={2.5} fill="#14b8a6" />
          <text x={symbol.w / 2} y={symbol.h - 3} textAnchor="middle" fontSize="6" fill="#0f766e">洗面</text>
        </>
      )}
      {symbol.type === "toiletBowl" && (
        <>
          <rect x="6" y="2" width={symbol.w - 12} height={14} rx="3" fill="#f8fafc" stroke={selectedSymbol === symbol.id ? "#059669" : "#94a3b8"} strokeWidth="2" />
          <ellipse cx={symbol.w / 2} cy={symbol.h / 2 + 8} rx={symbol.w / 3} ry={symbol.h / 3.2} fill="#f1f5f9" stroke={selectedSymbol === symbol.id ? "#059669" : "#94a3b8"} strokeWidth="2" />
          <text x={symbol.w / 2} y={symbol.h - 3} textAnchor="middle" fontSize="6" fill="#64748b">便器</text>
        </>
      )}
      {symbol.type === "fridge" && (
        <>
          <rect x="2" y="2" width={symbol.w - 4} height={symbol.h - 4} rx="4" fill="#eef2ff" stroke={selectedSymbol === symbol.id ? "#059669" : "#6366f1"} strokeWidth="2" />
          <line x1="4" y1={symbol.h / 2.4} x2={symbol.w - 4} y2={symbol.h / 2.4} stroke="#6366f1" strokeWidth="1.2" />
          <line x1={symbol.w - 9} y1="8" x2={symbol.w - 9} y2={symbol.h / 2.4 - 3} stroke="#6366f1" strokeWidth="2" />
          <text x={symbol.w / 2} y={symbol.h - 4} textAnchor="middle" fontSize="6" fill="#4338ca">冷蔵</text>
        </>
      )}
      {symbol.type === "washer" && (
        <>
          <rect x="2" y="2" width={symbol.w - 4} height={symbol.h - 4} rx="4" fill="#f0f9ff" stroke={selectedSymbol === symbol.id ? "#059669" : "#0ea5e9"} strokeWidth="2" />
          <circle cx={symbol.w / 2} cy={symbol.h / 2 + 2} r={symbol.w / 4} fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
          <circle cx={symbol.w / 2} cy={symbol.h / 2 + 2} r={2.5} fill="#0ea5e9" />
          <text x={symbol.w / 2} y={symbol.h - 3} textAnchor="middle" fontSize="6" fill="#0369a1">洗濯</text>
        </>
      )}
      {selectedSymbol === symbol.id && drag.kind !== "moving-symbol" && (
        <g>
          <rect
            x={-3}
            y={-3}
            width={symbol.w + 6}
            height={symbol.h + 6}
            fill="none"
            stroke="#059669"
            strokeWidth={1}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
          <line
            x1={symbol.w / 2}
            y1={-3}
            x2={symbol.w / 2}
            y2={-22}
            stroke="#059669"
            strokeWidth={1.5}
            pointerEvents="none"
          />
          <circle
            cx={symbol.w / 2}
            cy={-26}
            r={7}
            fill="#059669"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: "grab" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              pushHistory();
              setDrag({
                kind: "rotating-symbol",
                symbolId: symbol.id,
                cx: symbol.x + symbol.w / 2,
                cy: symbol.y + symbol.h / 2,
              });
            }}
          />
          <path
            d="M -3.5 -28 A 4 4 0 1 1 -3.5 -24"
            transform={`translate(${symbol.w / 2} 0)`}
            fill="none"
            stroke="white"
            strokeWidth={1.3}
            pointerEvents="none"
          />
        </g>
      )}
    </g>
  );

  const layeredNodes = [
    ...walls.map((wall) => ({ z: zOfWall(wall), node: renderWallNode(wall) })),
    ...rooms.map((room) => ({ z: zOfRoom(room), node: renderRoomNode(room) })),
    ...symbols.map((symbol) => ({ z: zOfSymbol(symbol), node: renderSymbolNode(symbol) })),
  ].sort((a, b) => a.z - b.z);

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
            <button onClick={duplicateCurrent} className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold">複製</button>
            <button onClick={undo} disabled={history.length === 0} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold disabled:opacity-40">元に戻す</button>
            <button onClick={redo} disabled={future.length === 0} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold disabled:opacity-40">やり直し</button>
            <button onClick={copySelected} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold">コピー</button>
            <button onClick={pasteClipboard} disabled={!clipboard} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold disabled:opacity-40">貼り付け</button>
            <button onClick={addFreeText} className="text-xs bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg font-bold">文字入力</button>
            <button onClick={() => setShowSavedList((prev) => !prev)} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold">保存済み一覧</button>
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
            <p className="text-xs font-bold text-gray-500 mb-2">建具・記号</p>
            <div className="space-y-1.5">
              {SYMBOL_TYPES.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => setDrag({ kind: "placing", typeId: symbol.id })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>{symbol.label}</span>
                  <span className="text-gray-400">配置</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">追加建具</p>
            <div className="space-y-1.5">
              {ADVANCED_SYMBOL_TYPES.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => setDrag({ kind: "placing", typeId: symbol.id })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>{symbol.label}</span>
                  <span className="text-gray-400">配置</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">設備アイコン</p>
            <div className="space-y-1.5">
              {EQUIPMENT_TYPES.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => setDrag({ kind: "placing", typeId: symbol.id })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>{symbol.label}</span>
                  <span className="text-gray-400">配置</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">壁機能</p>
            <button
              onClick={() => setDrag({ kind: "placing", typeId: "wall" })}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <span>直線壁</span>
              <span className="text-gray-400">配置</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">定型文字</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TEXTS.map((label) => (
                <button
                  key={label}
                  onClick={() => addPresetText(label)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {label}
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
                <button onClick={addRoomDimension} className="mt-2 w-full text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg py-1.5 font-bold">
                  この部屋の寸法線を追加
                </button>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500">回転</p>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {Math.round(selectedRoom.rotation ?? 0)}°
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 mb-1.5">部屋の上の丸いハンドルをドラッグでも回転できます</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => rotateSelectedRoom(-90)}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    ⟲ -90°
                  </button>
                  <button
                    onClick={() => rotateSelectedRoom(90)}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    +90° ⟳
                  </button>
                </div>
                <button
                  onClick={resetRoomRotation}
                  className="mt-2 w-full text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                >
                  角度をリセット (0°)
                </button>
                <p className="text-[10px] text-gray-400 mt-2 mb-1">重なり順（壁や他の部屋との上下）</p>
                <div className="flex gap-2">
                  <button
                    onClick={bringSelectedToFront}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    最前面へ
                  </button>
                  <button
                    onClick={sendSelectedToBack}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    最背面へ
                  </button>
                </div>
                <button
                  onClick={() => {
                    pushHistory();
                    setRooms((prev) => prev.filter((room) => room.id !== selectedRoom.id));
                    setSelected(null);
                  }}
                  className="mt-2 w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg py-1.5 font-bold"
                >
                  この部屋を削除
                </button>
              </div>
            )}
            {selectedTextItem && (
              <div className="pt-2 border-t">
                <p className="text-xs font-bold text-gray-500 mb-1">選択中の文字</p>
                <input
                  value={editText?.id === selectedTextItem.id ? editText.value : selectedTextItem.text}
                  onChange={(e) => setEditText({ id: selectedTextItem.id, value: e.target.value })}
                  onBlur={() => {
                    if (!editText || editText.id !== selectedTextItem.id) return;
                    pushHistory();
                    setTexts((prev) => prev.map((item) => item.id === selectedTextItem.id ? { ...item, text: editText.value } : item));
                  }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                />
                <button
                  onClick={() => {
                    pushHistory();
                    setTexts((prev) => prev.filter((item) => item.id !== selectedTextItem.id));
                    setSelectedText(null);
                  }}
                  className="mt-2 w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg py-1.5 font-bold"
                >
                  この文字を削除
                </button>
              </div>
            )}
            {selectedWallItem && (
              <div className="pt-2 border-t">
                <p className="text-xs font-bold text-gray-500 mb-1">選択中の壁</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      pushHistory();
                      setWalls((prev) => prev.map((wall) => wall.id === selectedWallItem.id ? { ...wall, thickness: Math.min(20, wall.thickness + 2) } : wall));
                    }}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    太くする
                  </button>
                  <button
                    onClick={() => {
                      pushHistory();
                      setWalls((prev) => prev.map((wall) => wall.id === selectedWallItem.id ? { ...wall, thickness: Math.max(4, wall.thickness - 2) } : wall));
                    }}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    細くする
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 mb-1">重なり順（部屋やキッチンとの上下）</p>
                <div className="flex gap-2">
                  <button
                    onClick={bringSelectedToFront}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    最前面へ
                  </button>
                  <button
                    onClick={sendSelectedToBack}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    最背面へ
                  </button>
                </div>
                <button
                  onClick={() => {
                    pushHistory();
                    setWalls((prev) => prev.filter((wall) => wall.id !== selectedWallItem.id));
                    setSelectedWall(null);
                  }}
                  className="mt-2 w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg py-1.5 font-bold"
                >
                  この壁を削除
                </button>
              </div>
            )}
            {selectedSymbol && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-gray-500">選択中の記号</p>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {Math.round(symbols.find((s) => s.id === selectedSymbol)?.rotation ?? 0)}°
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mb-1.5">記号上の丸いハンドルをドラッグでも回転できます</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => rotateSelectedSymbol(-90)}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    ⟲ -90°
                  </button>
                  <button
                    onClick={() => rotateSelectedSymbol(90)}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    +90° ⟳
                  </button>
                </div>
                <button
                  onClick={resetSymbolRotation}
                  className="mt-2 w-full text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                >
                  角度をリセット (0°)
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={bringSelectedToFront}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    最前面へ
                  </button>
                  <button
                    onClick={sendSelectedToBack}
                    className="flex-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 font-bold"
                  >
                    最背面へ
                  </button>
                </div>
                <button
                  onClick={() => {
                    pushHistory();
                    setSymbols((prev) => prev.filter((symbol) => symbol.id !== selectedSymbol));
                    setSelectedSymbol(null);
                  }}
                  className="mt-2 w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg py-1.5 font-bold"
                >
                  この記号を削除
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
                onClick={(e) => {
                  const target = e.target as SVGElement;
                  const fill = target.getAttribute?.("fill") ?? "";
                  const isBackground =
                    target.tagName === "svg" ||
                    (target.tagName === "rect" && fill.startsWith("url(#grid"));
                  if (drag.kind === "none" && isBackground) {
                    setSelected(null);
                    setSelectedSymbol(null);
                    setSelectedText(null);
                    setSelectedWall(null);
                  }
                }}
                onKeyDown={(e) => {
                  const target = e.target as HTMLElement;
                  if (editLabel || editText || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                    return;
                  }
                  if ((e.key === "Delete" || e.key === "Backspace") && selected) {
                    pushHistory();
                    setRooms((prev) => prev.filter((room) => room.id !== selected));
                    setSelected(null);
                  }
                  if ((e.key === "Delete" || e.key === "Backspace") && selectedSymbol) {
                    pushHistory();
                    setSymbols((prev) => prev.filter((symbol) => symbol.id !== selectedSymbol));
                    setSelectedSymbol(null);
                  }
                  if ((e.key === "Delete" || e.key === "Backspace") && selectedText) {
                    pushHistory();
                    setTexts((prev) => prev.filter((text) => text.id !== selectedText));
                    setSelectedText(null);
                  }
                  if ((e.key === "Delete" || e.key === "Backspace") && selectedWall) {
                    pushHistory();
                    setWalls((prev) => prev.filter((wall) => wall.id !== selectedWall));
                    setSelectedWall(null);
                  }
                }}
                className="block outline-none"
              >
                <defs>
                  <marker id="dimArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M 0 3 L 6 0 L 6 6 z" fill="#6b7280" />
                  </marker>
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
                {layeredNodes.map((entry) => entry.node)}
                {selectedWallItem && (
                  <>
                    <circle
                      cx={selectedWallItem.x1}
                      cy={selectedWallItem.y1}
                      r={6}
                      fill="#ffffff"
                      stroke="#059669"
                      strokeWidth="2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        pushHistory();
                        setDrag({ kind: "moving-wall-endpoint", wallId: selectedWallItem.id, endpoint: 1 });
                      }}
                      style={{ cursor: "crosshair" }}
                    />
                    <circle
                      cx={selectedWallItem.x2}
                      cy={selectedWallItem.y2}
                      r={6}
                      fill="#ffffff"
                      stroke="#059669"
                      strokeWidth="2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        pushHistory();
                        setDrag({ kind: "moving-wall-endpoint", wallId: selectedWallItem.id, endpoint: 2 });
                      }}
                      style={{ cursor: "crosshair" }}
                    />
                  </>
                )}
                {dimensions.map((dimension) => (
                  <g key={dimension.id}>
                    <line x1={dimension.x1} y1={dimension.y1} x2={dimension.x2} y2={dimension.y2} stroke="#6b7280" strokeWidth="1.2" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
                    <text x={(dimension.x1 + dimension.x2) / 2} y={(dimension.y1 + dimension.y2) / 2 - 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#4b5563">{dimension.label}</text>
                  </g>
                ))}
                {/* rooms are rendered via layeredNodes */}
                {texts.map((textItem) => (
                  <g
                    key={textItem.id}
                    transform={`translate(${textItem.x} ${textItem.y})`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      pushHistory();
                      const { x, y } = svgPoint(e);
                      setTexts((prev) => prev.map((item) => item.id === textItem.id ? { ...item, x: snap(x), y: snap(y) } : item));
                      setSelected(null);
                      setSelectedSymbol(null);
                      setSelectedText(textItem.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedText(textItem.id);
                      setEditText({ id: textItem.id, value: textItem.text });
                    }}
                    style={{ cursor: "grab" }}
                  >
                    {editText?.id === textItem.id ? (
                      <foreignObject x={0} y={-16} width={180} height={28}>
                        <input
                          autoFocus
                          value={editText.value}
                          onChange={(e) => setEditText({ id: textItem.id, value: e.target.value })}
                          onBlur={() => {
                            pushHistory();
                            setTexts((prev) => prev.map((item) => item.id === textItem.id ? { ...item, text: editText.value } : item));
                            setEditText(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              pushHistory();
                              setTexts((prev) => prev.map((item) => item.id === textItem.id ? { ...item, text: editText.value } : item));
                              setEditText(null);
                            }
                          }}
                          className="w-full rounded border border-fuchsia-300 px-2 py-1 text-xs font-bold focus:outline-none"
                        />
                      </foreignObject>
                    ) : (
                      <text x={0} y={0} fontSize={textItem.fontSize} fontWeight="bold" fill={selectedText === textItem.id ? "#c026d3" : "#374151"}>
                        {textItem.text}
                      </text>
                    )}
                  </g>
                ))}
                {/* symbols are rendered via layeredNodes */}
              </svg>
            </div>
          </div>
        </main>
      </div>

      {showSavedList && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-bold text-gray-800">保存済み間取り一覧</h2>
              <button onClick={() => setShowSavedList(false)} className="text-sm text-gray-400 hover:text-gray-700">閉じる</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-3">
              {savedPlans.length === 0 ? (
                <p className="text-sm text-gray-400">保存済み間取りはまだありません。</p>
              ) : savedPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row gap-4">
                  {plan.thumbnail ? <img src={plan.thumbnail} alt={plan.propertyName} className="h-28 w-full md:w-44 rounded-lg border object-cover bg-gray-50" /> : <div className="h-28 w-full md:w-44 rounded-lg border bg-gray-50" />}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{plan.propertyName}</p>
                    <p className="text-xs text-gray-400 mt-1">{plan.propertyId}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">部屋 {plan.rooms.length}室</span>
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">記号 {plan.symbols.length}件</span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">寸法 {plan.dimensions?.length ?? 0}件</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">更新: {new Date(plan.updatedAt).toLocaleString("ja-JP")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}