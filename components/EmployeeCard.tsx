import { Employee } from "@/lib/mockData";
import Avatar from "@/components/Avatar";

const enneagramColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-pink-100 text-pink-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-purple-100 text-purple-700",
  5: "bg-blue-100 text-blue-700",
  6: "bg-orange-100 text-orange-700",
  7: "bg-green-100 text-green-700",
  8: "bg-gray-100 text-gray-700",
  9: "bg-teal-100 text-teal-700",
};

export default function EmployeeCard({ employee }: { employee: Employee }) {
  const color = enneagramColors[employee.enneagramType] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* アバター */}
      <Avatar name={employee.name} size="lg" className="shadow-lg" />

      {/* 名前 */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-0.5">{employee.nameKana}</p>
        <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{employee.department}</p>
      </div>

      {/* エニアグラムバッジ */}
      <span className={`text-xs font-medium px-3 py-1 rounded-full ${color}`}>
        Type {employee.enneagramType}・{employee.enneagramLabel}
      </span>

      {/* 自己紹介 */}
      {employee.bio && (
        <p className="text-xs text-gray-500 text-center leading-relaxed border-t pt-3 mt-1">
          {employee.bio}
        </p>
      )}
    </div>
  );
}
