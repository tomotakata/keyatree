import { Employee } from "@/lib/mockData";

export default function BasicInfo({ employee }: { employee: Employee }) {
  const rows = [
    { label: "役職", value: employee.position },
    { label: "等級", value: employee.grade },
    { label: "職種", value: employee.jobType },
    { label: "雇用形態", value: employee.employmentType },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        基本情報
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b last:border-0">
              <td className="py-2.5 pr-4 text-gray-500 w-24 font-medium">{row.label}</td>
              <td className="py-2.5 text-gray-800 font-semibold">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
