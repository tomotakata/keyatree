"use client";

import { useMemo, useRef, useState } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { NavigatorRecord } from "@/lib/goalNavigatorStore";

type Props = {
  record: NavigatorRecord;
};

function fieldEntries(record: NavigatorRecord) {
  return Object.entries(record.answers).filter(([, value]) => Boolean(value));
}

function sectionTitle(record: NavigatorRecord) {
  return record.kind === "quantitative" ? "目標設定レポート" : "定性目標設定レポート";
}

export default function RecordActions({ record }: Props) {
  const [open, setOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const entries = useMemo(() => fieldEntries(record), [record]);

  const downloadWord = async () => {
    const children = [
      new Paragraph({ children: [new TextRun({ text: sectionTitle(record), bold: true, size: 32 })] }),
      new Paragraph(""),
      new Paragraph(`名前：${record.employeeName}`),
      new Paragraph(`部署：${record.department}`),
      new Paragraph(`ステータス：${record.status}`),
      new Paragraph(""),
      ...entries.map(([key, value]) => new Paragraph(`${key}：${value}`)),
    ];

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.title}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${record.title}.pdf`);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
        >
          {open ? "詳細を閉じる" : "詳細を見る"}
        </button>
        <button
          onClick={downloadWord}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
        >
          Word出力
        </button>
        <button
          onClick={downloadPdf}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700"
        >
          PDF出力
        </button>
      </div>

      {open ? (
        <div ref={reportRef} className="w-full max-w-3xl rounded-2xl border bg-gray-50 p-4 text-left shadow-sm">
          <div className="space-y-2 border-b border-gray-200 pb-4">
            <p className="text-lg font-bold text-gray-800">{record.title}</p>
            <p className="text-sm text-gray-600">{record.employeeName} / {record.department}</p>
            <p className="text-xs text-gray-400">ステータス：{record.status}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white p-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-400">{key}</p>
                <p className="mt-1 text-sm text-gray-700 leading-6 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
