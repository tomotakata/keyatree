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

export type GoalProgress = {
  title: string;
  target: string;
  current: string;
  progress: number;
};

export type LastMonthResult = {
  month: string;
  declaration: string;
  achieved: boolean;
  reflection: string;
  improvement: string;
  goalResults: GoalProgress[];
};

export type MonthlyGoal = {
  month: string;
  declaration: string;
  cheers: number;
  comments: CheerComment[];
  currentProgress: GoalProgress[];
  lastMonth: LastMonthResult;
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
    photo: "/avatars/suzuki_ichiro.png",
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
          avatar: "/avatars/tanaka_hanako.jpeg",
          likes: 4,
          replies: [],
        },
        {
          id: "c6",
          from: "田中 花子",
          role: "同僚",
          message: "昨日のお客様対応、素晴らしかったです！さすが一郎さん！",
          date: "2025-05-07",
          avatar: "/avatars/tanaka_hanako.jpeg",
          likes: 6,
          replies: [],
        },
      ],
      currentProgress: [
        { title: "営業売上目標", target: "3,000万円", current: "1,840万円", progress: 61 },
        { title: "ありがとうメッセージ獲得", target: "100件", current: "67件", progress: 67 },
        { title: "新規顧客アポイント", target: "20件", current: "14件", progress: 70 },
      ],
      lastMonth: {
        month: "2025年4月",
        declaration: "新規顧客10件獲得と既存顧客満足度向上を実現する！",
        achieved: true,
        reflection: "新規顧客は11件獲得でき目標をクリアできた。ただし、月末に案件が集中してしまい、対応品質にバラつきが出た点は反省。既存顧客のフォロー頻度も想定より少なかった。",
        improvement: "案件進捗を週次で確認するルーティンを設けて、月末集中を防ぐ。顧客フォローは週1回のメール送付を習慣化し、接触頻度を上げる。",
        goalResults: [
          { title: "新規顧客獲得", target: "10件", current: "11件", progress: 100 },
          { title: "既存顧客フォロー", target: "30件", current: "22件", progress: 73 },
          { title: "提案書作成", target: "15件", current: "15件", progress: 100 },
        ],
      },
    },
  },
  {
    id: "002",
    name: "田中 花子",
    nameKana: "タナカ ハナコ",
    photo: "/avatars/tanaka_hanako.jpeg",
    department: "管理部 > 総務課",
    position: "課長",
    grade: "M1",
    jobType: "管理",
    employmentType: "正社員",
    joinedAt: "2013-04-01",
    evaluationRank: "S",
    enneagramType: 2,
    enneagramLabel: "援助者",
    bio: "スタッフ全員が働きやすい環境づくりに全力で取り組んでいます。",
    skills: [
      { subject: "リーダーシップ", value: 80, fullMark: 100 },
      { subject: "チームワーク", value: 90, fullMark: 100 },
      { subject: "課題分析", value: 75, fullMark: 100 },
      { subject: "提案力", value: 70, fullMark: 100 },
      { subject: "サポート", value: 95, fullMark: 100 },
      { subject: "交渉力", value: 72, fullMark: 100 },
    ],
    goals: [
      { title: "採用業務効率化", progress: 80 },
      { title: "社内研修プログラム整備", progress: 55 },
    ],
    thanks: [
      { from: "鈴木 一郎", message: "いつも気にかけてくれてありがとうございます！", date: "2024-11-05", tag: "助け合い" },
      { from: "佐藤 次郎", message: "総務の対応が早くてとても助かりました。", date: "2024-10-20", tag: "スピード" },
    ],
    monthlyGoal: {
      month: "2025年5月",
      declaration: "採用3名成功と社内研修コンテンツを2本完成させる！",
      cheers: 18,
      comments: [],
      currentProgress: [
        { title: "採用目標", target: "3名", current: "2名", progress: 67 },
        { title: "研修コンテンツ作成", target: "2本", current: "1本", progress: 50 },
      ],
      lastMonth: {
        month: "2025年4月", declaration: "入社オンボーディング改善と新ルール整備",
        achieved: true, reflection: "スムーズに進められた。", improvement: "継続して改善を続ける。",
        goalResults: [{ title: "オンボーディング改善", target: "1件", current: "1件", progress: 100 }],
      },
    },
  },
  {
    id: "003",
    name: "佐藤 次郎",
    nameKana: "サトウ ジロウ",
    photo: "",
    department: "営業部 > 第二営業課",
    position: "主任",
    grade: "S2",
    jobType: "営業",
    employmentType: "正社員",
    joinedAt: "2018-10-01",
    evaluationRank: "B",
    enneagramType: 7,
    enneagramLabel: "熱中者",
    bio: "新しいチャレンジが大好きです。お客様に喜んでいただける提案を心がけています。",
    skills: [
      { subject: "リーダーシップ", value: 55, fullMark: 100 },
      { subject: "チームワーク", value: 80, fullMark: 100 },
      { subject: "課題分析", value: 65, fullMark: 100 },
      { subject: "提案力", value: 85, fullMark: 100 },
      { subject: "サポート", value: 70, fullMark: 100 },
      { subject: "交渉力", value: 75, fullMark: 100 },
    ],
    goals: [
      { title: "新規開拓 8件", progress: 50 },
      { title: "既存顧客リピート率向上", progress: 30 },
    ],
    thanks: [
      { from: "鈴木 一郎", message: "提案書の作成を手伝ってくれてありがとう！", date: "2024-11-12", tag: "助け合い" },
    ],
    monthlyGoal: {
      month: "2025年5月",
      declaration: "新規開拓8件と顧客満足度アンケートで90点以上を目指す！",
      cheers: 12,
      comments: [],
      currentProgress: [
        { title: "新規開拓", target: "8件", current: "4件", progress: 50 },
        { title: "顧客満足度", target: "90点", current: "82点", progress: 91 },
      ],
      lastMonth: {
        month: "2025年4月", declaration: "新規開拓5件達成",
        achieved: false, reflection: "3件にとどまった。アプローチ方法を見直す必要がある。", improvement: "ロールプレイ練習を週2回実施する。",
        goalResults: [{ title: "新規開拓", target: "5件", current: "3件", progress: 60 }],
      },
    },
  },
  {
    id: "004",
    name: "山本 三郎",
    nameKana: "ヤマモト サブロウ",
    photo: "",
    department: "物件管理部 > 物件課",
    position: "担当者",
    grade: "J2",
    jobType: "物件管理",
    employmentType: "正社員",
    joinedAt: "2021-04-01",
    evaluationRank: "B",
    enneagramType: 6,
    enneagramLabel: "忠実者",
    bio: "物件の品質管理を徹底し、お客様に安心してご入居いただけるよう努めています。",
    skills: [
      { subject: "リーダーシップ", value: 45, fullMark: 100 },
      { subject: "チームワーク", value: 75, fullMark: 100 },
      { subject: "課題分析", value: 80, fullMark: 100 },
      { subject: "提案力", value: 55, fullMark: 100 },
      { subject: "サポート", value: 85, fullMark: 100 },
      { subject: "交渉力", value: 50, fullMark: 100 },
    ],
    goals: [
      { title: "物件点検100件完了", progress: 70 },
      { title: "クレーム件数ゼロ", progress: 85 },
    ],
    thanks: [
      { from: "田中 花子", message: "迅速な物件対応ありがとうございました！", date: "2024-10-30", tag: "スピード" },
    ],
    monthlyGoal: {
      month: "2025年5月",
      declaration: "物件点検100件達成とクレームゼロを維持する！",
      cheers: 8,
      comments: [],
      currentProgress: [
        { title: "物件点検", target: "100件", current: "70件", progress: 70 },
        { title: "クレーム件数", target: "0件", current: "0件", progress: 100 },
      ],
      lastMonth: {
        month: "2025年4月", declaration: "物件点検80件完了",
        achieved: true, reflection: "計画通り進めることができた。", improvement: "効率化ツールを活用してさらにスピードアップする。",
        goalResults: [{ title: "物件点検", target: "80件", current: "82件", progress: 100 }],
      },
    },
  },
  {
    id: "005",
    name: "中村 美咲",
    nameKana: "ナカムラ ミサキ",
    photo: "",
    department: "営業部 > 第一営業課",
    position: "担当者",
    grade: "J3",
    jobType: "営業",
    employmentType: "正社員",
    joinedAt: "2023-04-01",
    evaluationRank: "A",
    enneagramType: 4,
    enneagramLabel: "個人主義者",
    bio: "お客様一人ひとりに寄り添った、オーダーメイドの不動産提案が得意です。",
    skills: [
      { subject: "リーダーシップ", value: 40, fullMark: 100 },
      { subject: "チームワーク", value: 70, fullMark: 100 },
      { subject: "課題分析", value: 72, fullMark: 100 },
      { subject: "提案力", value: 88, fullMark: 100 },
      { subject: "サポート", value: 78, fullMark: 100 },
      { subject: "交渉力", value: 60, fullMark: 100 },
    ],
    goals: [
      { title: "担当顧客満足度向上", progress: 75 },
      { title: "自己研鑽：不動産知識強化", progress: 60 },
    ],
    thanks: [
      { from: "鈴木 一郎", message: "丁寧なお客様対応、いつも見習っています！", date: "2024-11-15", tag: "丁寧さ" },
    ],
    monthlyGoal: {
      month: "2025年5月",
      declaration: "担当顧客全員への定期フォローと新規提案3件を実現する！",
      cheers: 15,
      comments: [],
      currentProgress: [
        { title: "定期フォロー", target: "全顧客", current: "85%完了", progress: 85 },
        { title: "新規提案", target: "3件", current: "2件", progress: 67 },
      ],
      lastMonth: {
        month: "2025年4月", declaration: "顧客対応品質向上と自己学習継続",
        achieved: true, reflection: "コツコツ続けられた。", improvement: "より積極的な提案姿勢を身につける。",
        goalResults: [{ title: "自己学習", target: "30時間", current: "32時間", progress: 100 }],
      },
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
