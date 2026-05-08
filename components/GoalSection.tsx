import { Goal } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";

export default function GoalSection({ goals }: { goals: Goal[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        目標設定・進捗
      </h3>
      <div className="space-y-4">
        {goals.map((goal, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-700 font-medium">{goal.title}</span>
              <span
                className={`text-xs font-bold ${
                  goal.progress >= 80
                    ? "text-emerald-600"
                    : goal.progress >= 50
                    ? "text-yellow-600"
                    : "text-rose-500"
                }`}
              >
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
