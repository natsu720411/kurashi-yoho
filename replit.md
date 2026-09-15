# くらし予報

家電・車・住まい・定期支出から、これからの出費と毎月の積立目安を予測するスマートフォン向けWebアプリです。

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/kurashi-yohou/src/App.tsx` — 画面フロー、localStorage保存、予測計算、タイムライン
- `artifacts/kurashi-yohou/src/lib/constants.ts` — 家電の買い替え年数・平均費用・入力用定数の一元管理
- `artifacts/kurashi-yohou/src/index.css` — くらし予報のテーマと共通アニメーション

## Architecture decisions

- MVPではログイン・外部API・DBを使わず、ブラウザのlocalStorageに入力内容を保存する。
- 出費予測は、登録された家電の買い替え目安、車の更新予定、定期支出を同じタイムラインに展開して集計する。
- 家電の目安年数と平均費用は `constants.ts` の定数から変更できるようにする。

## Product

- 3ステップの診断で世帯情報、家電、車、定期支出を入力できる。
- 今後1・3・5年間の予想支出、3年間に備える月額積立目安、年月順の支出タイムラインを表示する。
- 入力内容は再訪時に復元され、結果画面から設定編集・支出編集・全リセットができる。

## User preferences

- 日本の初心者向けに、明るく清潔で、金融サービスほど堅くないUIにする。

## Gotchas

- Viteのビルドは `PORT` と `BASE_PATH` が必要なため、ワークフロー経由で確認するか両方を指定して実行する。

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
