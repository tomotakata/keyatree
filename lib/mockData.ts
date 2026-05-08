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

export type Reply = {
  id: string;
  from: string;
  avatar: string;
  message: string;
  date: string;
};

export type CheerComment = {
  id: string;
  from: string;
  role: string;
  message: string;
  date: string;
  avatar: string;
  likes: number;
  replies: Reply[];
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

// 同じ人が複数投稿している場合、最新をHOT扱いにする
export function markHotComments(comments: CheerComment[]): (CheerComment & { isHot: boolean })[] {
  const latestByPerson: Record<string, string> = {};
  const sorted = [...comments].sort((a, b) => b.date.localeCompare(a.date));
  for (const c of sorted) {
    if (!latestByPerson[c.from]) latestByPerson[c.from] = c.id;
  }
  const multiPosters = Object.entries(
    comments.reduce((acc, c) => { acc[c.from] = (acc[c.from] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).filter(([, v]) => v > 1).map(([k]) => k);

  return sorted.map((c) => ({
    ...c,
    isHot: multiPosters.includes(c.from) && latestByPerson[c.from] === c.id,
  }));
}

const AVATAR_MALE = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}&skinColor=yellow&hairColor=black&top=shortHairShortWaved&facialHairType=beardLight&facialHairColor=black&backgroundColor=${bg}&radius=50&size=80`;
const AVATAR_FEMALE = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}&skinColor=yellow&hairColor=black&top=longHairStraight&backgroundColor=${bg}&radius=50&size=80`;

export const employees: Employee[] = [
  {
    id: "001",
    name: "鈴木 一郎",
    nameKana: "スズキ イチロウ",
    photo: "https://api.dicebear.com/9.x/avataaars/png?seed=ichiro&skinColor=yellow&hairColor=black&top=shortHairShortWaved&facialHairType=beardLight&facialHairColor=black&backgroundColor=b6e3f4&radius=50&size=200&mouth=smile",
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
      { from: "田中 花子", message: "難しい案件を最後まで丁寧に対応してくれてありがとう！おかげで契約できました。", date: "2024-11-10", tag: "助け合い" },
      { from: "佐藤 次郎", message: "いつも相談に乗ってくれて本当に助かっています。", date: "2024-10-25", tag: "頑張り" },
      { from: "山本 三郎", message: "先日の物件提案、素晴らしいアイデアでした！", date: "2024-10-05", tag: "アイデア" },
    ],
    monthlyGoal: {
      month: "2025年5月",
      declaration: "今月は営業売上3,000万円達成と、お客様からの「ありがとう」メッセージを100件獲得！！全力で駆け抜けます！",
      cheers: 24,
      comments: [
        {
          id: "c1",
          from: "田中 部長",
          role: "上長",
          message: "一郎なら絶対できる！チーム全員で応援してるぞ！",
          date: "2025-05-01",
          avatar: `https://api.dicebear.com/9.x/avataaars/png?seed=tanaka-bucho&skinColor=yellow&hairColor=black&top=shortHairSides&facialHairType=beardMedium&facialHairColor=black&backgroundColor=ffd5dc&radius=50&size=80`,
          likes: 5,
          replies: [
            {
              id: "r1",
              from: "鈴木 一郎",
              avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=ichiro&skinColor=yellow&hairColor=black&top=shortHairShortWaved&facialHairType=beardLight&facialHairColor=black&backgroundColor=b6e3f4&radius=50&size=80",
              message: "ありがとうございます！絶対やり遂げます！",
              date: "2025-05-01",
            },
          ],
        },
        {
          id: "c2",
          from: "佐藤 次郎",
          role: "同僚",
          message: "一緒に今月も頑張ろう！何かあればすぐ声かけて！",
          date: "2025-05-02",
          avatar: AVATAR_MALE("sato-jiro", "c0aede"),
          likes: 3,
          replies: [],
        },
        {
          id: "c3",
          from: "田中 部長",
          role: "上長",
          message: "先日のプレゼンも最高だった。この調子で行こう！",
          date: "2025-05-05",
          avatar: `https://api.dicebear.com/9.x/avataaars/png?seed=tanaka-bucho&skinColor=yellow&hairColor=black&top=shortHairSides&facialHairType=beardMedium&facialHairColor=black&backgroundColor=ffd5dc&radius=50&size=80`,
          likes: 8,
          replies: [],
        },
        {
          id: "c4",
          from: "山本 三郎",
          role: "同僚",
          message: "3,000万円！すごい目標だね。絶対達成できると思う！",
          date: "2025-05-03",
          avatar: AVATAR_MALE("yamamoto", "d1f4e0"),
          likes: 2,
          replies: [],
        },
        {
          id: "c5",
          from: "田中 花子",
          role: "同僚",
          message: "鈴木さんのお客様への姿勢、本当に尊敬しています。今月も応援してます！",
          date: "2025-05-04",
          avatar: AVATAR_FEMALE("hanako", "fde68a"),
          likes: 4,
          replies: [],
        },
        {
          id: "c6",
          from: "田中 花子",
          role: "同僚",
          message: "昨日のお客様対応、素晴らしかったです！さすが一郎さん！",
          date: "2025-05-07",
          avatar: AVATAR_FEMALE("hanako", "fde68a"),
          likes: 6,
          replies: [],
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
