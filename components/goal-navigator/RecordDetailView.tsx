"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import type { NavigatorRecord } from "@/lib/goalNavigatorStore";
import QuantitativeSheet from "@/components/goal-navigator/QuantitativeSheet";
import QualitativeSheet from "@/components/goal-navigator/QualitativeSheet";
import ProgressPanel from "@/components/goal-navigator/ProgressPanel";

type Props = {
  record: NavigatorRecord;
};

export default function RecordDetailView({ record }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

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

  const profile =
    record.kind === "quantitative"
      ? {
          name: record.answers.name || record.employeeName,
          stage: record.answers.stage || "",
          grade: record.answers.grade || "",
        }
      : {
          name: record.answers.name || record.employeeName,
          department: record.answers.department || record.department,
          grade: record.answers.grade || "",
        };

  return (
    <div ref={reportRef} className="w-full rounded-2xl border bg-gray-50 p-4 text-left shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-4">
        <div className="space-y-2">
          <p className="text-lg font-bold text-gray-800">{record.title}</p>
          <p className="text-sm text-gray-600">
            {record.employeeName} / {record.department}
          </p>
          <p className="text-xs text-gray-400">ステータス：{record.status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF出力は一時非公開（出力品質の確認中） */}
          {false && (
            <button
              onClick={downloadPdf}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700"
            >
              PDF出力
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
        {record.kind === "quantitative" ? (
          <QuantitativeSheet
            answers={record.answers}
            onChange={() => {}}
            disabled
            profile={profile}
          />
        ) : (
          <QualitativeSheet
            answers={record.answers}
            onChange={() => {}}
            disabled
            profile={profile}
          />
        )}
      </div>

      {/* スタッフの進捗入力 + 管理者コメント返信（マイページと相互反映） */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="mb-3 text-sm font-bold text-gray-700">
          スタッフの進捗報告 / 管理者コメント
        </p>
        <ProgressPanel
          recordId={record.id}
          updates={record.progressUpdates ?? []}
          canWrite={false}
          canReply={true}
        />
      </div>
    </div>
  );
}
