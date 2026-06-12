import HeaderNav from "@/components/HeaderNav";

export default function SupabaseSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav currentLabel="Supabase導入手順" />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Supabase導入手順</h1>
          <p className="mt-2 text-sm text-gray-500">
            目標設定ナビゲーターの保存・履歴・承認・監査ログを実DBへ切り替えるための手順です。
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">1. 環境変数</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
          </pre>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">2. 実行SQL</h2>
          <p className="mt-2 text-sm text-gray-500">
            `supabase/goal_navigator_schema.sql` を Supabase SQL Editor で実行してください。
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">3. 反映結果</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>・`goal_navigator_records` に保存</li>
            <li>・`audit_logs` に create / update / approve を記録</li>
            <li>・履歴画面と承認画面は自動でDB参照へ切替</li>
          </ul>
        </div>
      </main>
    </div>
  );
}