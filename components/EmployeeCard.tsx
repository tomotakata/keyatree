import { Employee } from "@/lib/mockData";

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
  const initials = employee.name.replace(/\s/g, "").slice(0, 2);
  const color = enneagramColors[employee.enneagramType] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* 顔写真 */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
          {employee.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={employee.photo}
              alt={employee.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </div>

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
