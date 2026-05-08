export type Skill = {
  subject: string;
  value: number;
  fullMark: number;
};

export type Goal = {
  title: string;
  progress: number;
};

export type ThanksCard = {
  from: string;
  message: string;
  date: string;
  tag: string;
};

export type CheerComment = {
  from: string;
  role: string;
  message: string;
  date: string;
  avatar: string;
};

export type MonthlyGoal = {
  month: string;
  declaration: string;
  cheers: number;
  comments: CheerComment[];
};

export type Employee = {
  id: string;
  name: string;
  nameKana: string;
  photo: string;
  department: string;
  position: string;
  grade: string;
  jobType: string;
  employmentType: string;
  joinedAt: string;
  evaluationRank: string;
  enneagramType: number;
  enneagramLabel: string;
  bio: string;
  skills: Skill[];
  goals: Goal[];
  thanks: ThanksCard[];
  monthlyGoal: MonthlyGoal;
};

export const employees: Employee[] = [
  {
    id: "001",
    name: "鈴木 一郎",
    nameKana: "スズキ イチロウ",
    photo: "https://api.dicebear.com/9.x/avataaars/png?seed=ichiro-suzuki&backgroundColor=b6e3f4&radius=50&size=200&mouth=smile&eyes=happy",
    department: "営業部 > 第一営業課",
    position: "主任",
    grade: "S3",
    jobType: "営業",
    employmentType: "正社員",
    joinedAt: "2016-04-01",
    evaluationRank: "A",
    enneagramType: 3,
    enneagramLabel: "達成者",
    bio: "お客様の夢のマイホーム実現を全力でサポートします。",
    skills: [
      { subject: "リーダーシップ", value: 70, fullMark: 100 },
      { subject: "チームワーク", value: 85, fullMark: 100 },
      { subject: "課題分析", value: 60, fullMark: 100 },
      { subject: "提案力", value: 75, fullMark: 100 },
      { subject: "サポート", value: 80, fullMark: 100 },
      { subject: "交渉力", value: 65, fullMark: 100 },
    ],
    goals: [
      { title: "新規顧客獲得 10件", progress: 60 },
      { title: "売上目標 ¥3,000万円達成", progress: 40 },
      { title: "宅建士資格取得", progress: 90 },
    ],
    thanks: [
      {
        from: "田中 花子",
        message: "難しい案件を最後まで丁寧に対応してくれてありがとう！おかげで契約できました。",
        date: "2024-11-10",
        tag: "助け合い",
      },
      {
        from: "佐藤 次郎",
        message: "いつも相談に乗ってくれて本当に助かっています。",
        date: "2024-10-25",
        tag: "頑張り",
      },
      {
        from: "山本 三郎",
        message: "先日の物件提案、素晴らしいアイデアでした！",
        date: "2024-10-05",
        tag: "アイデア",
      },
    ],
    monthlyGoal: {
      month: "2025年5月",
      declaration:
        "今月は営業売上3,000万円達成と、お客様からの「ありがとう」メッセージを100件獲得！！全力で駆け抜けます！",
      cheers: 24,
      comments: [
        {
          from: "田中 部長",
          role: "上長",
          message: "一郎なら絶対できる！チーム全員で応援してるぞ！",
          date: "2025-05-01",
          avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=tanaka-bucho&backgroundColor=ffd5dc&radius=50&size=80",
        },
        {
          from: "佐藤 次郎",
          role: "同僚",
          message: "一緒に今月も頑張ろう！何かあればすぐ声かけて！",
          date: "2025-05-02",
          avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=sato-jiro&backgroundColor=c0aede&radius=50&size=80",
        },
        {
          from: "山本 三郎",
          role: "同僚",
          message: "3,000万円！すごい目標だね。絶対達成できると思う！",
          date: "2025-05-03",
          avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=yamamoto-saburo&backgroundColor=d1f4e0&radius=50&size=80",
        },
        {
          from: "田中 花子",
          role: "同僚",
          message: "鈴木さんのお客様への姿勢、本当に尊敬しています。今月も応援してます！",
          date: "2025-05-04",
          avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=tanaka-hanako&backgroundColor=fde68a&radius=50&size=80",
        },
      ],
    },
  },
];

export function getEmployee(id: string): Employee | undefined {
  return employees.find((e) => e.id === id);
}

export function calcTenure(joinedAt: string): string {
  const joined = new Date(joinedAt);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - joined.getFullYear()) * 12 +
    (now.getMonth() - joined.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}ヶ月`;
  return `${years}年${months > 0 ? months + "ヶ月" : ""}`;
}
