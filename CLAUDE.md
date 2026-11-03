# OfficialSite — 開発メモ(Claude 用)

KENSHIN GAMES の公式サイト(https://kenshin-games.jp/)。まず README.md を読むこと。手順の詳細は docs/website.md。

## 約束
- サイトは `tools/build.mjs` が `site/` に作る静的な HTML。`site/` は手で直さない(作り直すと消える)。直したら `npm run build` して `site/` も一緒にコミットする
- 規約・プライバシーポリシーの文面は、各ゲームのリポジトリの `src/legal.ts`(アプリの中と同じ)。ここに写さない。Rugby 7v7 = `RUGBY_DIR`(既定 `../rugby-7v7/`)、接待麻雀 = `SETTAI_DIR`(既定 `../mahjong-offline/`)
  - `legal.ts` は Node が直接 import するので、import を書かないファイルにしておく(各ゲームのリポジトリの約束)
- 文面・画像をそろえずに作ると、`site/` に古い・ちがう内容が入る。ゲームのリポジトリが手元にないときは build しない(見つからなければエラーで止まる)
- 画像の URL には中身の番号 `?v=` を付ける(`img()`。Cloudflare の配信網が古い写真を数時間持ち続けるため)。CSS も同じ(`CSS_VERSION`)
- `_headers` の CSP は、ページの中の `<script>` のハッシュから自動で作る。外のサーバーへ送る(フォームなど)なら `connect-src` を足す
  (ご意見フォームの Worker `https://api.kenshin-games.jp` は公式サイトからの送信も受け付ける。Worker 本体は Rugby 7v7 の `server/feedback`)
- ゲーム画面の写真は各ゲームのリポジトリで撮る(Rugby 7v7 = `node tools/site-shots.mjs`、**配信中の版のコードで**)

## 確認(変更のたびに)
`npm run build` → `npm run serve` を動かしたまま `npm test`(横スクロール・フォント・リンク切れ・errors が空)。スクショは `tools/e2e/shots/`。
公開後は `URL=https://kenshin-games.jp/ npm run test:csp`。
