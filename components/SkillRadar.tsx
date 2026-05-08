"use client";

import { Skill } from "@/lib/mockData";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function SkillRadar({ skills }: { skills: Skill[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        スキルマップ
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={skills} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <Tooltip
            formatter={(value) => [`${value}点`, "スコア"]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Radar
            name="スキル"
            dataKey="value"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 3, fill: "#10b981" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
