# 公式サイト・ドメイン・メール(kenshin-games.jp)

| もの | 内容 |
|---|---|
| ドメイン | `kenshin-games.jp`(Bundle ID は `jp.kenshingames.rugby7v7` のまま。遊ぶ人には見えないので、ハイフンの有無がずれていても問題ない) |
| 公式サイト | https://kenshin-games.jp/(このリポジトリ OfficialSite。中身は `npm run build` で `site/` に作る) |
| お問い合わせ | `support@kenshin-games.jp`(届いたメールはふだんの Gmail に転送) |
| App Store に登録する URL | サポート https://kenshin-games.jp/support/ ・ プライバシーポリシー https://kenshin-games.jp/rugby7v7/privacy/ |
| 接待麻雀(2 本目のゲーム) | トップは Rugby 7v7 がメイン(ユーザーの要望)。接待麻雀は別のページ https://kenshin-games.jp/settai-mahjong/ (作りはトップと同じ:大きな見出し → ゲーム紹介 → ニュース → タイトル情報 → ほかのゲーム。色だけゲームと同じ緑と金。ユーザーの要望。トップからは上の帯・ニュース・いちばん下の「ほかのゲーム」でリンク)、サポートのよくある質問、プライバシーポリシー https://kenshin-games.jp/settai-mahjong/privacy/ 。文面・アイコン・写真は接待麻雀のリポジトリ(`../mahjong-offline`)から読む |

費用はドメイン代だけ(.jp は年 3,000〜4,000 円ほど)。サイトの公開とメールの転送は Cloudflare の無料プランでできる。

## 1. ドメインを取る(日本のドメイン会社で)

Cloudflare では `.jp` を買えないので、日本のドメイン会社で取る。

- 候補:Xserver ドメイン / ムームードメイン / お名前.com など(どこでも同じ `.jp` が取れる。値段と使いやすさで選ぶ)
- ☑ `kenshin-games.jp` を検索して、空いていれば申し込む
  - `.jp` は日本に住所がある人だけが取れる
  - 登録者の情報(氏名など)の公開を代わりに引き受ける「Whois 公開代行」があるか、申し込みのときに確認する
  - 「サーバー」「メール」などのセット販売は**いらない**(Cloudflare で無料でできる)
- 空いていなければ `kenshin-games.com` など。その場合は Rugby 7v7 の `src/legal.ts` のメールと URL を書き換えて、このリポジトリで `npm run build` をやり直す

## 2. Cloudflare にドメインを登録する(無料)

- ☑ https://dash.cloudflare.com/ でアカウントを作る
- ☑ 「ドメインを追加」→ `kenshin-games.jp` → **Free プラン**
- ☑ Cloudflare が表示する**ネームサーバー 2 つ**を、ドメイン会社の管理画面の「ネームサーバー設定」に入れる
  - 切り替わるまで数分〜1 日。Cloudflare から「有効になりました」とメールが来る

## 3. メール:support@kenshin-games.jp を作る(受け取り)

- ☑ Cloudflare →(ドメインを選ぶ)→「メール」→「Email Routing」→ 有効にする(必要な DNS の設定は自動で入る)
- ☑ 「カスタムアドレス」に `support` を作り、転送先にふだんの Gmail を入れる
- ☑ Gmail に届く確認メールのリンクを押す
- ☑ 別のアドレスから `support@kenshin-games.jp` にメールを送って、Gmail に届くか確かめる

**返信について**:今の設定は受け取りだけ。Gmail からそのまま返信すると、相手には Gmail のアドレスが見える。
`support@kenshin-games.jp` から返信したくなったら、送信用のメールサービス(無料のものもある)を足す。必要になったら Claude に聞く。

## 4. 公式サイトを公開する(無料)

いちばん簡単なのは、Cloudflare の画面に `site/` フォルダを置く方法。

- 🛠 `npm run build`(`site/` を最新にする)
- ☑ Cloudflare →「Workers & Pages」→「作成」→「Pages」→「アセットをアップロード」
  - プロジェクト名:`kenshin-games`
  - `site/` フォルダをドラッグ & ドロップ →「デプロイ」
- ☑ できたプロジェクトの「カスタムドメイン」→ `kenshin-games.jp` を追加(DNS は自動で設定される)
- ☑ https://kenshin-games.jp/ が開くか確かめる(数分かかることがある)

2 回目からは、コマンド 1 つで更新できる(初回だけブラウザで Cloudflare にログインする):

```bash
npm run deploy
```

## サイトを更新するとき

| やりたいこと | 直すところ |
|---|---|
| ニュースを足す | `tools/build.mjs` の `NEWS`(新しいバージョンを配信したら 1 行。日付は App Store の公開日。調べ方は Rugby 7v7 の docs/app-store-release.md の「11. アップデート」) |
| ゲーム紹介の文・画像 | `tools/build.mjs` の `FEATURES`、画像は Rugby 7v7 のリポジトリで `node tools/site-shots.mjs`(開発サーバーを動かしてから)で撮り直す(`resources/screens/` に入る) |
| Rugby 7v7 の規約・表記 | Rugby 7v7 のリポジトリの `src/legal.ts`(アプリの中と同じ文面。アプリとサイトの両方が変わる) |
| 接待麻雀の紹介・よくある質問 | `tools/build.mjs` の `SETTAI_FEATURES`・`SETTAI_FAQ`(写真は接待麻雀のリポジトリの `resources/screens/`。撮り直しは接待麻雀の `tools/store-shots.mjs`) |
| 接待麻雀の配信開始 | `tools/build.mjs` の `SETTAI_APP_STORE_URL` に App Store の URL を入れる(「近日配信」がすべて「App Store で入手」のリンクに)+ `NEWS` に 1 行(`game: 'settai'` で接待麻雀のページにも出る) |
| 接待麻雀の題字・SNS で共有したときの画像 | 接待麻雀のリポジトリの `resources/logo.png`・`ogp.jpg`(接待麻雀の `node tools/make-icon.mjs` が作る) |
| 接待麻雀のプライバシーポリシー | 接待麻雀のリポジトリの `src/legal.ts`(アプリの中と同じ文面)。リポジトリの場所が `../mahjong-offline` でなければ `SETTAI_DIR=<フォルダ>/ npm run build`(Rugby 7v7 も同じく `RUGBY_DIR`) |
| 見た目 | `tools/style.css` |

直したら `npm run build` → `npm test`(確認)→ `npm run deploy`。

### ゲーム画面の写真を撮り直すとき(Rugby 7v7 のリポジトリで行う)

- **写真は配信中のアプリの画面で撮る**(開発中のコードには、まだ配信していない機能が写るため)。配信した版のコードを別の場所に取り出し、別のポートの開発サーバーで動かして撮る:

  ```bash
  git worktree add --detach <作業用フォルダ>/rugby-live <配信した版の commit>   # 例 1.2.0 は 1235b33
  ln -s "$PWD/node_modules" <作業用フォルダ>/rugby-live/node_modules
  # <作業用フォルダ>/rugby-live/vite.shots.config.ts に、ポート 5174 と別のキャッシュの設定を置く(下)
  (cd <作業用フォルダ>/rugby-live && npx vite --config vite.shots.config.ts)   # 動かしたまま、別の端末で ↓
  URL=http://127.0.0.1:5174/ node tools/site-shots.mjs                            # resources/screens/ に撮れる
  git worktree remove --force <作業用フォルダ>/rugby-live                           # 終わったら片付ける
  ```

  ```ts
  // vite.shots.config.ts(キャッシュを分けないと、いつもの開発サーバーと取り合いになる)
  import { mergeConfig } from 'vite';
  import base from './vite.config';
  export default mergeConfig(base, { cacheDir: '<作業用フォルダ>/vite-cache-live', server: { host: '127.0.0.1', port: 5174, strictPort: true } });
  ```

- 試合の写真は、カメラを 1.5 倍に寄せ(`MATCH_ZOOM`。実際の試合は 1 倍)、手で遊んでいる見た目で、選手が画面いっぱいに広がった瞬間を撮る(2026-10-15 ユーザーの要望)。
  気に入らなければ `ONLY=match SHOTS_OUT=<フォルダ>` で何度か撮り比べて、いちばん良いものを `resources/screens/match.jpg` に置く
- サイトの画像の URL には、中身から作る番号が付く(`img/match.jpg?v=…`)。Cloudflare の配信網は画像を地域ごとに数時間覚えていて、URL が同じだと
  ブラウザのキャッシュを消しても古い写真が出続けたため(2026-10-15)。写真を替えれば URL も変わるので、何もしなくてよい
App Store で配信が始まったら、トップの「App Store で近日配信」を App Store へのリンク(Apple の公式バッジ)に替える。
