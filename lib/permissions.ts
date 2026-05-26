// 権限マスターデータ（将来DB化する想定）
export type Permission = {
  id: string;
  name: string;
  description: string;
  color: string;
  access: {
    employeeList: "full" | "dept" | "self" | "read" | "none";
    employeeEdit: "full" | "dept" | "self" | "none";
    evaluation: "full" | "dept" | "self" | "none";
    task: "full" | "dept" | "self" | "none";
    masters: "full" | "none";
    settings: "full" | "none";
    news: "full" | "read" | "none";
  };
  notes: string[];
};

export const permissions: Permission[] = [
  {
    id: "admin",
    name: "システム管理者",
    description: "全機能へのフルアクセス権限。システム設定・マスター管理・全社員情報の閲覧と編集が可能。",
    color: "rose",
    access: {
      employeeList: "full",
      employeeEdit: "full",
      evaluation:   "full",
      task:         "full",
      masters:      "full",
      settings:     "full",
      news:         "full",
    },
    notes: [
      "全社員の情報を閲覧・編集できる",
      "マスターデータ（部署・役職・等級等）の管理が可能",
      "システム設定の変更が可能",
      "権限の付与・変更が可能",
    ],
  },
  {
    id: "hr_manager",
    name: "人事管理者",
    description: "全社員の人事情報・評価管理が可能。マスター管理も担当。システム設定のみ制限。",
    color: "amber",
    access: {
      employeeList: "full",
      employeeEdit: "full",
      evaluation:   "full",
      task:         "full",
      masters:      "full",
      settings:     "none",
      news:         "full",
    },
    notes: [
      "全社員の情報を閲覧・編集できる",
      "全社員の評価データを管理できる",
      "マスターデータの管理が可能",
      "システム設定の変更は不可",
    ],
  },
  {
    id: "dept_manager",
    name: "部門管理者",
    description: "自部門の社員情報・タスク・評価を管理できる。他部門は閲覧のみ。",
    color: "blue",
    access: {
      employeeList: "full",
      employeeEdit: "dept",
      evaluation:   "dept",
      task:         "dept",
      masters:      "none",
      settings:     "none",
      news:         "full",
    },
    notes: [
      "全社員の一覧・プロフィールは閲覧可能",
      "自部門の社員情報のみ編集できる",
      "自部門の評価・タスクを管理できる",
      "他部門の社員情報の編集は不可",
      "マスター管理・システム設定は不可",
    ],
  },
  {
    id: "staff",
    name: "一般社員",
    description: "自分のプロフィールと目標の管理が可能。他社員は閲覧のみ。",
    color: "emerald",
    access: {
      employeeList: "read",
      employeeEdit: "self",
      evaluation:   "self",
      task:         "self",
      masters:      "none",
      settings:     "none",
      news:         "read",
    },
    notes: [
      "社員一覧の閲覧は可能",
      "自分のプロフィール・目標のみ編集できる",
      "他社員の情報は閲覧のみ（編集不可）",
      "マスター管理・システム設定は不可",
      "サンクスカードの送受信は可能",
    ],
  },
  {
    id: "readonly",
    name: "閲覧専用",
    description: "全ページの閲覧のみ可能。情報の追加・編集・削除は一切不可。",
    color: "gray",
    access: {
      employeeList: "read",
      employeeEdit: "none",
      evaluation:   "none",
      task:         "none",
      masters:      "none",
      settings:     "none",
      news:         "read",
    },
    notes: [
      "全ページの閲覧のみ可能",
      "社員情報・評価・タスクの編集は不可",
      "新規登録・削除は不可",
      "パートタイム・外部委託者向け",
    ],
  },
];

export const accessLabels: Record<string, string> = {
  full: "フルアクセス",
  dept: "自部門のみ",
  self: "自分のみ",
  read: "閲覧のみ",
  none: "アクセス不可",
};

export const featureLabels: Record<string, string> = {
  employeeList: "社員一覧",
  employeeEdit: "社員情報編集",
  evaluation:   "評価管理",
  task:         "タスク管理",
  masters:      "マスター管理",
  settings:     "システム設定",
  news:         "社内通知",
};
