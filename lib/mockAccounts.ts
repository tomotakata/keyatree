// モックアカウントデータ（将来Supabase Authに差し替え）
export type Account = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  password: string; // 本番ではハッシュ化必須
  permissionId: string;
  permissionName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export const mockAccounts: Account[] = [
  {
    id: "acc001",
    employeeId: "001",
    name: "鈴木 一郎",
    email: "suzuki@keyaki-s.com",
    password: "password123",
    permissionId: "staff",
    permissionName: "一般社員",
    isActive: true,
    lastLoginAt: "2025-05-25 09:12",
    createdAt: "2016-04-01",
  },
  {
    id: "acc002",
    employeeId: "002",
    name: "田中 花子",
    email: "tanaka@keyaki-s.com",
    password: "password123",
    permissionId: "hr_manager",
    permissionName: "人事管理者",
    isActive: true,
    lastLoginAt: "2025-05-26 08:45",
    createdAt: "2013-04-01",
  },
  {
    id: "acc003",
    employeeId: "003",
    name: "佐藤 次郎",
    email: "sato@keyaki-s.com",
    password: "password123",
    permissionId: "staff",
    permissionName: "一般社員",
    isActive: true,
    lastLoginAt: "2025-05-24 17:30",
    createdAt: "2018-10-01",
  },
  {
    id: "acc_admin",
    employeeId: "",
    name: "管理者",
    email: "admin@keyaki-s.com",
    password: "admin1234",
    permissionId: "admin",
    permissionName: "システム管理者",
    isActive: true,
    lastLoginAt: "2025-05-26 10:00",
    createdAt: "2013-01-01",
  },
];

export function findAccount(email: string, password: string): Account | null {
  return mockAccounts.find(
    (a) => a.email === email && a.password === password && a.isActive
  ) ?? null;
}
