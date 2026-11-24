# くらし予報｜追加課金なしで週次SEO分析を動かす

Windsor.aiやGSC Wizardの有料プランは不要です。GitHub ActionsとGoogle公式のSearch Console API／GA4 Data APIを利用します。毎週月曜08:17（日本時間）と手動で実行可能です。

## 最初に必要なGoogle認証

Googleのサービスアカウントを1個用意します。秘密鍵JSONはGitHubのソースコードやチャットへ貼らず、GitHub Actions Secretsだけに保管してください。

1. Google Cloud Console（https://console.cloud.google.com/）で既存プロジェクトを選ぶか新規作成。課金契約・請求先の登録を要求された場合は中断してください。
2. 「APIとサービス」→「ライブラリ」で Google Search Console API と Google Analytics Data API を有効化。
3. 「IAMと管理」→「サービスアカウント」で専用アカウントを作り、JSONキーを手元に取得。メールアドレス（末尾 iam.gserviceaccount.com）を控えます。
4. Google Search Console（https://search.google.com/search-console）で  https://kurashi-yoho.vercel.app/  のプロパティを選び、「設定」→「ユーザーと権限」で専用メールアドレスを制限付きユーザーとして追加。
5. Google Analytics（https://analytics.google.com/）の対象GA4プロパティ「管理」→「プロパティのアクセス管理」に同じ専用メールを閲覧者として追加。数字のプロパティIDを確認します。G-で始まる測定IDとは違います。
6. GitHub（https://github.com/natsu720411/kurashi-yoho/settings/secrets/actions）の Settings → Secrets and variables → Actions → New repository secret で GOOGLE_SERVICE_ACCOUNT_JSON を作成し、JSONキーの**全内容**を保存。鍵をチャットに送らないでください。
7. 同じ設定画面の Variables に GA4_PROPERTY_ID を追加し、数字のGA4プロパティIDを保存。GA4が準備できなければ省略してSearch Consoleのみの集計も可能です。
8. GitHub Actions（https://github.com/natsu720411/kurashi-yoho/actions/workflows/kurashi-yoho-free-seo-audit.yml）から Run workflow を実行し、ジョブサマリーとレポートを確認。

## レポートの内容・安全対策

- 直近3日を除外した直近28日と前28日を比較。クリック、表示、CTR、掲載順位をサイト全体・クエリ・ページ・クエリ×ページで取得。
- 検証候補は表示60回以上・掲載順位5〜20位・表示増または低CTRを満たした場合だけ抽出。少数表示を過大評価しない。
- GA4を接続すると計算開始・完了・コピー等のイベント件数、専用3ページの完了数を集計。イベント件数からの完了比率は**厳密な利用者単位の完了率ではありません**。
- 直近14日以内に編集したページや公開直後の新ページは、比較可能な検索データを待ちます。レポートのみ作成し、サイトのコードは自動変更しません。
- Google APIに接続できない場合は推測値を表示せずエラーにします。認証未設定なら「設定待ち」と明示します。
- 公開GitHubリポジトリではActionsのレポートやログが閲覧可能な場合があります。秘密鍵や個人データは出力しません。全サイト集計値と検索語を扱います。
- Google公式APIとGitHubの無料利用範囲で運用し、課金契約はしません。Googleが課金設定を要求する場合は中断してください。

公式文書：
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
