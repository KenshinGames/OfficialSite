# OfficialSite

KENSHIN GAMES の公式ホームページ(https://kenshin-games.jp/)。Cloudflare Pages(プロジェクト名 `kenshin-games`)で公開している。

もとは Rugby 7v7 のリポジトリの中(`tools/site.mjs`・`site/`)にあったものを、ここに移した(2026-11)。
どのゲームのリポジトリからでも、このリポジトリを隣に置けばサイトを作り直し・更新できる。

## フォルダ

| 場所 | 中身 |
|---|---|
| `tools/build.mjs` | サイトを作るスクリプト。ページの文面(ゲーム紹介 `FEATURES`・ニュース `NEWS`・よくある質問 `FAQ`・接待麻雀の `SETTAI_*`)もここ |
| `tools/style.css` | 見た目(`site/style.css` に写す) |
| `tools/fonts/` | 見出しのフォント Dela Gothic One(使う文字だけに絞って `site/fonts/` に入れる) |
| `tools/e2e/` | 確認のスクリプト(スクショは `tools/e2e/shots/`。git 管理外) |
| `site/` | できあがったサイト(公開する中身。作り直したら一緒にコミットする) |
| `docs/website.md` | ドメイン・メール・公開の手順と、更新するときにどこを直すか |

## ゲームのリポジトリとの関係

規約・プライバシーポリシーの文面と、アイコン・ゲーム画面の写真は、**それぞれのゲームのリポジトリから読む**(アプリの中と同じ文面にするため。ここには写さない)。

```
<作業フォルダ>/
  OfficialSite/      ← このリポジトリ
  rugby-7v7/         ← src/legal.ts・package.json の version・public/title/keyvisual.jpg・resources/icon.png・resources/screens/
  mahjong-offline/   ← src/legal.ts・iOS のアイコン・resources/logo.png・resources/ogp.jpg・resources/screens/
```

隣に置けないときは、場所を環境変数で指定する:`RUGBY_DIR=<フォルダ>/ SETTAI_DIR=<フォルダ>/ npm run build`

ゲームのリポジトリからは、次のように呼べる(Rugby 7v7 の `npm run site` / `npm run site:deploy` はこれを呼ぶ):

```bash
npm --prefix ../OfficialSite run build    # site/ を作り直す
npm --prefix ../OfficialSite run deploy   # 作り直して公開
```

新しいゲームを足すときは、そのリポジトリに `src/legal.ts`(`APP_TITLE`・`SITE_PATH`・`MIN_IOS`・`privacyText()` など。import のないファイル)と画像を用意し、
`tools/build.mjs` に `SETTAI_DIR` と同じように場所(`<名前>_DIR`)とページを足す。

## コマンド

Node 22.18 以降(`.ts` をそのまま import する)。はじめに `npm install`。

| コマンド | すること |
|---|---|
| `npm run build` | `site/` を作る。画像の縮小は Mac なら sips、それ以外は ImageMagick(`magick` / `convert`) |
| `npm run serve` | `site/` を http://localhost:8090/ で開く |
| `npm test` | パソコン幅・スマホ幅のスクショ、横スクロール、見出しのフォント、リンク切れ(`npm run serve` を動かしたまま) |
| `URL=https://kenshin-games.jp/ npm run test:csp` | 公開したサイトのセキュリティヘッダー(CSP)で表示が壊れないか |
| `npm run deploy` | 作り直して Cloudflare Pages に公開(初回だけブラウザで Cloudflare にログイン) |

Chrome は Mac の Google Chrome、なければ `/opt/pw-browsers/chromium` などを使う。`CHROME=<パス>` で指定もできる。
