import { readFileSync } from "fs";
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "staff";
const H = { Authorization: `Bearer ${KEY}`, apikey: KEY };

async function list(prefix) {
  const r = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: prefix ? prefix + "/" : "", limit: 5000, offset: 0 }),
  });
  if (!r.ok) throw new Error(`list ${r.status} ${await r.text()}`);
  return r.json();
}
async function download(path) {
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, { headers: H });
  if (!r.ok) return null;
  try { return JSON.parse(await r.text()); } catch { return null; }
}

const targets = ["n.kaneda@365keyaki.onmicrosoft.com", "h.koga@365keyaki.onmicrosoft.com"];
const files = (await list("accounts")).filter((f) => f.name.endsWith(".json"));
const all = [];
for (const f of files) { const a = await download(`accounts/${f.name}`); if (a) all.push(a); }
console.log("総アカウント数:", all.length);

for (const email of targets) {
  const hit = all.find((a) => (a.email || "") === email);
  const ci = all.find((a) => (a.email || "").toLowerCase() === email.toLowerCase());
  console.log(`\n[${email}]`);
  const a = hit ?? ci;
  if (!a) { console.log("  ✗ アカウント不在"); continue; }
  if (!hit && ci) console.log("  ⚠ 完全一致なし→保存メールに大文字/空白:", JSON.stringify(ci.email));
  console.log("  email(JSON):", JSON.stringify(a.email));
  console.log("  password(JSON):", JSON.stringify(a.password));
  console.log("  isActive:", a.isActive, " employeeId:", a.employeeId);
  const mem = await download(`members/${a.employeeId}.json`);
  console.log("  member存在:", !!mem);
}
console.log("\n前後空白のあるメール:", all.filter((a) => a.email !== (a.email || "").trim()).map((a) => JSON.stringify(a.email)));
console.log("大文字を含むメール:", all.filter((a) => (a.email || "") !== (a.email || "").toLowerCase()).map((a) => JSON.stringify(a.email)));
const dup = {}; for (const a of all) { const k = (a.email || "").toLowerCase(); dup[k] = (dup[k] || 0) + 1; }
console.log("重複メール:", Object.entries(dup).filter(([, c]) => c > 1));
console.log("空白入りパスワード:", all.filter((a) => (a.password || "") !== (a.password || "").trim()).map((a) => JSON.stringify(a.email)));
