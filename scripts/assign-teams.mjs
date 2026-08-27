import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local を読み込む
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase env not found in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = "staff";
const PREFIX = "members";

const norm = (s) => (s || "").replace(/[\s\u3000]+/g, "");
const TEAM = {
  "寺田健祐": "クライアントマネジメントチーム",
  "齊藤葵": "リーシングチーム",
  "平塚太一": "リーシングチーム",
  "津金幸乃": "クライアントマネジメントチーム",
  "若林悟": "クライアントマネジメントチーム",
  "日下部勝敏": "クライアントマネジメントチーム",
  "荒深花加": "リーシングチーム",
  "大月翔平": "リーシングチーム",
  "三宅智之": "カスタマーサポートチーム",
  "秋山滉太": "リーシングチーム",
  "廣瀬理絵": "カスタマーサポートチーム",
  "三澤夏織": "カスタマーサポートチーム",
  "古屋真宏": "クライアントマネジメントチーム",
  "齊藤裕": "マーケティングチーム",
};

async function getJson(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try { return JSON.parse(await data.text()); } catch { return null; }
}
async function putJson(path, value) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, JSON.stringify(value), {
    contentType: "application/json", upsert: true,
  });
  if (error) throw new Error(error.message);
}

const { data: files, error } = await supabase.storage.from(BUCKET).list(PREFIX, { limit: 1000 });
if (error) { console.error("list error:", error.message); process.exit(1); }

const remaining = new Set(Object.keys(TEAM));
let updated = 0;
for (const f of files.filter((x) => x.name.endsWith(".json"))) {
  const path = `${PREFIX}/${f.name}`;
  const emp = await getJson(path);
  if (!emp || !emp.name) continue;
  const team = TEAM[norm(emp.name)];
  if (!team) continue;
  if (emp.team === team) {
    console.log(`= ${emp.name}: 既に ${team}`);
    remaining.delete(norm(emp.name));
    continue;
  }
  emp.team = team;
  await putJson(path, emp);
  updated++;
  remaining.delete(norm(emp.name));
  console.log(`✓ ${emp.name} → ${team}`);
}

if (remaining.size > 0) {
  console.log("\n[未マッチ] 以下の氏名はストレージ上のスタッフに見つかりませんでした:");
  for (const k of remaining) console.log("  -", k, `(${TEAM[k]})`);
}
console.log(`\n完了: ${updated}名を更新`);
