/**
 * 公式サイト(https://kenshin-games.jp/)を site/ に作る(`npm run build`)。
 *   /                     トップ(Rugby 7v7 の紹介・ニュース)
 *   /support/             サポート・よくある質問・お問い合わせ
 *   /rugby7v7/terms/      利用規約
 *   /rugby7v7/privacy/    プライバシーポリシー
 *   /rugby7v7/legal/      特定商取引法に基づく表記・資金決済法に基づく表示
 *   /settai-mahjong/          接待麻雀の紹介(トップは Rugby 7v7 がメイン。接待麻雀は別のページ)
 *   /settai-mahjong/privacy/  接待麻雀のプライバシーポリシー
 *
 * 文面と画像は、それぞれのゲームのリポジトリから読む(このリポジトリには写さない。アプリの中と同じ文面にするため)。
 * ふだんは、このリポジトリと同じ階層に置いたもの。場所は環境変数で変えられる:
 *   RUGBY_DIR(既定 ../rugby-7v7/)   src/legal.ts・package.json の version・public/title/keyvisual.jpg・resources/icon.png・
 *                                   resources/screens/(Rugby 7v7 の tools/site-shots.mjs が撮る)
 *   SETTAI_DIR(既定 ../mahjong-offline/)  src/legal.ts・アプリのアイコン・resources/logo.png と ogp.jpg(tools/make-icon.mjs が作る)・
 *                                   resources/screens/(tools/store-shots.mjs が作る)
 * site/ の中身を Cloudflare Pages に置く(`npm run deploy`。docs/website.md)
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import subsetFont from 'subset-font';

const root = fileURLToPath(new URL('../', import.meta.url));
/** ゲームのリポジトリの場所(環境変数がなければ、このリポジトリの隣)。末尾の / はあってもなくてもよい */
const repoDir = (env, name) => {
  const d = process.env[env] ?? root + '../' + name;
  return d.endsWith('/') ? d : d + '/';
};
const RUGBY_DIR = repoDir('RUGBY_DIR', 'rugby-7v7');
if (!fs.existsSync(RUGBY_DIR + 'src/legal.ts')) {
  throw new Error(`Rugby 7v7 のリポジトリが見つかりません: ${RUGBY_DIR}(RUGBY_DIR=<フォルダ>/ で場所を指定)`);
}
// Node 22.18 以降は .ts の型を取り除いてそのまま読める(legal.ts は import のないファイルにしてある)
const legal = await import(pathToFileURL(RUGBY_DIR + 'src/legal.ts').href);
const pkg = JSON.parse(fs.readFileSync(RUGBY_DIR + 'package.json', 'utf8'));
const out = root + 'site/';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out + 'img', { recursive: true });

const { OPERATOR, URLS, APP_TITLE } = legal;

// 接待麻雀(別のリポジトリ)。文面はアプリの中と同じ src/legal.ts
const SETTAI_DIR = repoDir('SETTAI_DIR', 'mahjong-offline');
if (!fs.existsSync(SETTAI_DIR + 'src/legal.ts')) {
  throw new Error(`接待麻雀のリポジトリが見つかりません: ${SETTAI_DIR}(SETTAI_DIR=<フォルダ>/ で場所を指定)`);
}
const settai = await import(pathToFileURL(SETTAI_DIR + 'src/legal.ts').href);
const SETTAI = settai.APP_TITLE;
const SETTAI_PATH = settai.SITE_PATH; // '/settai-mahjong/'
const BRAND = OPERATOR.brand;
const EMAIL = OPERATOR.email;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------- 画像

/** Mac は sips(標準)。ほか(Linux・クラウドの作業環境)は ImageMagick(magick / convert) */
const has = (cmd) => {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
const IMAGE_TOOL = has('sips') ? 'sips' : has('magick') ? 'magick' : has('convert') ? 'convert' : '';
if (!IMAGE_TOOL) throw new Error('画像を縮める sips(Mac)か ImageMagick(magick / convert)が必要です');

/** 縮小して JPEG に(長い辺 px) */
const jpeg = (src, dst, width) =>
  IMAGE_TOOL === 'sips'
    ? execFileSync('sips', ['-Z', String(width), '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', src, '--out', out + dst], { stdio: 'ignore' })
    : execFileSync(IMAGE_TOOL, [src, '-resize', `${width}x${width}`, '-quality', '80', out + dst], { stdio: 'ignore' });
/** 正方形の PNG に(px) */
const png = (src, dst, size) =>
  IMAGE_TOOL === 'sips'
    ? execFileSync('sips', ['-z', String(size), String(size), src, '--out', out + dst], { stdio: 'ignore' })
    : execFileSync(IMAGE_TOOL, [src, '-resize', `${size}x${size}!`, out + dst], { stdio: 'ignore' });

jpeg(RUGBY_DIR + 'public/title/keyvisual.jpg', 'img/keyvisual.jpg', 1672);
const SCREENS = ['match', 'gacha', 'formation', 'squad', 'title'];
for (const s of SCREENS) jpeg(RUGBY_DIR + `resources/screens/${s}.jpg`, `img/${s}.jpg`, 1280);
png(RUGBY_DIR + 'resources/icon.png', 'img/icon.png', 512);
png(RUGBY_DIR + 'resources/icon.png', 'apple-touch-icon.png', 180);
png(RUGBY_DIR + 'resources/icon.png', 'favicon.png', 64);
// 接待麻雀:アイコン・横書きの題字(透明)・SNS で共有したときの画像(この 2 つは接待麻雀の tools/make-icon.mjs が作る)と、ゲーム画面(縦長)
png(SETTAI_DIR + 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 'img/settai-icon.png', 256);
fs.copyFileSync(SETTAI_DIR + 'resources/logo.png', out + 'img/settai-logo.png');
fs.copyFileSync(SETTAI_DIR + 'resources/ogp.jpg', out + 'img/settai-ogp.jpg');
const SETTAI_SCREENS = ['home', 'play', 'result', 'dungeon', 'gacha', 'challenge'];
// 縦長なので、長い辺(縦)を 1300px に(横は約 600px。パソコンの 2 倍の画面でもにじまない)
for (const s of SETTAI_SCREENS) jpeg(SETTAI_DIR + `resources/screens/${s}.jpg`, `img/settai-${s}.jpg`, 1300);

/**
 * 画像の URL に、中身から作る番号を付ける(img/match.jpg?v=1a2b3c4d)。Cloudflare の配信網とブラウザは画像を数時間覚えているので、
 * 写真を撮り直しても URL が同じだと、地域によっては古い写真が出続ける(2026-10-15 にユーザーが気づいた)。中身が変われば URL も変わる
 */
const img = (dst) => `${dst}?v=${createHash('sha1').update(fs.readFileSync(out + dst)).digest('hex').slice(0, 8)}`;

// ---------------------------------------------------------------- 共通の枠

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** path:サイトの中の場所('/' や '/support/')。depth はそこから root への相対パスに使う */
/** CSS の中身から作る番号。ブラウザは style.css を数時間覚えているので、中身が変わったら URL を変えて読み直させる */
const CSS_VERSION = createHash('sha1').update(fs.readFileSync(root + 'tools/style.css')).digest('hex').slice(0, 8);

/** theme:ブラウザの上の帯の色。bodyClass:ページごとの色(接待麻雀のページは 'settai-page' で緑と金) */
function page({ path, title, description, body, hero = false, image = 'img/keyvisual.jpg', theme = '#05070f', bodyClass = '' }) {
  const depth = path.split('/').filter(Boolean).length;
  const r = depth === 0 ? './' : '../'.repeat(depth);
  const full = title ? `${title}|${BRAND}` : `${BRAND}|${APP_TITLE} 公式サイト`;
  const classes = [hero && 'has-hero', bodyClass].filter(Boolean).join(' ');
  // 上の帯で、いま開いているページ(接待麻雀・サポート)に印を付ける
  const here = (p) => (path.startsWith(p) ? ' aria-current="page"' : '');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${URLS.home.replace(/\/$/, '')}${path}">
<meta property="og:image" content="${URLS.home}${img(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${theme}">
<link rel="icon" href="${r}${img('favicon.png')}">
<link rel="apple-touch-icon" href="${r}${img('apple-touch-icon.png')}">
<link rel="stylesheet" href="${r}style.css?v=${CSS_VERSION}">
</head>
<body${classes ? ` class="${classes}"` : ''}>
<header class="bar">
  <a class="brand" href="${r}">KENSHIN<span>GAMES</span></a>
  <nav>
    <a href="${r}#game">${esc(APP_TITLE)}</a>
    <a href="${r}${SETTAI_PATH.slice(1)}"${here(SETTAI_PATH)}>${esc(SETTAI)}</a>
    <a class="nav-news" href="${r}#news">ニュース</a>
    <a href="${r}support/"${here('/support/')}>サポート</a>
  </nav>
</header>
${body}
<footer>
  <div class="foot-inner">
    <a class="brand" href="${r}">KENSHIN<span>GAMES</span></a>
    <nav>
      <a href="${r}support/">サポート・お問い合わせ</a>
      <a href="${r}rugby7v7/terms/">利用規約(${esc(APP_TITLE)})</a>
      <a href="${r}rugby7v7/privacy/">プライバシーポリシー(${esc(APP_TITLE)})</a>
      <a href="${r}rugby7v7/legal/">特定商取引法・資金決済法に基づく表示(${esc(APP_TITLE)})</a>
      <a href="${r}${SETTAI_PATH.slice(1)}privacy/">プライバシーポリシー(${esc(SETTAI)})</a>
    </nav>
    <p class="copy">© ${YEAR} ${esc(BRAND)}</p>
  </div>
</footer>
${hero ? `<script>
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
</script>
` : ''}</body>
</html>
`;
}

const write = (path, html) => {
  const dir = out + path.replace(/^\//, '');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + 'index.html', html);
};

// ---------------------------------------------------------------- トップ

const FEATURES = [
  {
    img: 'match',
    title: '指先ひとつで、本格ラグビー',
    text: 'スティックで走り、ボタンでパス・キック・タックル。長押しでロングパス、ステップやハンドオフで相手をかわしてトライを狙おう。',
  },
  {
    img: 'gacha',
    title: '選手を集めて、最強の 7 人に',
    text: 'ガチャで個性ゆたかな選手を獲得。同じ選手を重ねて限界突破すれば、能力はさらに伸びていく。',
  },
  {
    img: 'formation',
    title: 'FW と BK、戦術はキミしだい',
    text: '先発は FW 3 人・BK 4 人。フォーメーションを選んで、キックオフの並びや立ち位置、キッカーまで決められる。',
  },
  {
    img: 'squad',
    title: 'CPU は 5 段階。勝つほど報酬アップ',
    text: '「かんたん」から「レジェンド」まで。オートで観戦もでき、2 倍速・3 倍速でテンポよく試合が進む。',
  },
];

const APP_STORE_URL = 'https://apps.apple.com/jp/app/rugby-7v7/id6819972467';

/**
 * 接待麻雀の App Store のページ。配信が始まったらここに URL を入れる(サイトの「近日配信」がすべて「App Store で入手」のリンクになる)。
 * あわせて NEWS に「配信開始」を 1 行(game: 'settai')
 */
const SETTAI_APP_STORE_URL = 'https://apps.apple.com/jp/app/%E6%8E%A5%E5%BE%85%E9%BA%BB%E9%9B%80/id6826494271';
const settaiStore = () =>
  SETTAI_APP_STORE_URL
    ? `<a class="store" href="${SETTAI_APP_STORE_URL}" rel="noopener">App Store で入手</a>`
    : `<span class="store soon">App Store にて近日配信</span>`;

/** 接待麻雀の紹介(写真は接待麻雀のリポジトリの resources/screens/。tools/store-shots.mjs が撮る) */
const SETTAI_FEATURES = [
  {
    img: 'play',
    title: '接待しながら打つ、本格麻雀',
    text: '四人麻雀・三人麻雀に対応。赤ドラ・喰いタン・持ち点などのルールも選べる。おすすめの打牌を教えてくれるヒントや、局の振り返りつき。',
  },
  {
    img: 'result',
    title: '上司の機嫌が、出世を決める',
    text: '差し込みや鳴かせで上司を勝たせると機嫌が上がり、上司から和了ると大きく下がる。機嫌が 0 になると、上司は怒って帰ってしまう…。',
  },
  {
    img: 'dungeon',
    title: '出世街道を、社長まで',
    text: '新入社員のあなたが、上司や取引先を接待しながら社長をめざす。「部長に満貫を和了らせる」などのお題をこなして 6 つの関門を突破しよう。昇進するたびに、接待に役立つスキルを選べる。',
  },
  {
    img: 'gacha',
    title: '人脈ガチャで、相方を見つける',
    text: 'ゲームで貯まる「名刺」で社員を引こう。相方にした社員が同じ卓につき、ペア打ちで一緒に上司を接待してくれる。お金はかからない。',
  },
  {
    img: 'challenge',
    title: '接待チャレンジ',
    text: '課長・部長・社長の 3 人の上司を、東風戦でトップにして気持ちよく帰せるか挑戦。上司ごとに、いちばん良かった評価が残る。',
  },
];

/** ニュース。game: 'settai' は接待麻雀のページにも出す(トップにはすべて出す) */
const NEWS = [
  { date: '2026.10.30', game: 'settai', text: `「${SETTAI}」のバージョン 1.3.0 を配信しました。相方と打つほど親しくなり、仕事帰りの話が読める「寄り道」と、送別会・暑気払い・社員旅行の季節のイベントが加わりました。`, href: SETTAI_PATH.slice(1) },
  { date: '2026.10.29', game: 'settai', text: `新作「${SETTAI}」を App Store で配信開始しました。上司を勝たせて出世する、接待しながら打つ麻雀ゲームです。`, href: SETTAI_PATH.slice(1) },
  { date: '2026.10.24', game: 'settai', text: `新作「${SETTAI}」を App Store にて配信予定です。上司を勝たせて出世する、接待しながら打つ麻雀ゲームです。`, href: SETTAI_PATH.slice(1) },
  { date: '2026.10.14', text: `バージョン 1.2.0 を配信しました。試合の選手がキャラクターの絵で動くようになり、「戦績」やキッカーの指名も加わりました。` },
  { date: '2026.10.10', text: `バージョン 1.1.0 を配信しました。はじめての試合で「あそびかた」が見られるようになり、選手編成の画面も一新しました。` },
  { date: '2026.10.08', text: `「${APP_TITLE}」を App Store で配信開始しました。` },
  { date: '2026.10.07', text: `公式サイトをオープンしました。` },
  { date: '2026.10.07', text: `「${APP_TITLE}」を App Store にて配信予定です。` },
];

write(
  '/',
  page({
    path: '/',
    hero: true,
    description: `7 人制ラグビーのスマホゲーム「${APP_TITLE}」公式サイト。走る・パスする・タックルする。選手を集めて、最強の 7 人をつくろう。`,
    body: `
<section class="hero" style="background-image:url(${img('img/keyvisual.jpg')})">
  <div class="hero-inner">
    <p class="kicker">iPhone 向け 7 人制ラグビーゲーム</p>
    <h1 class="logo">RUGBY <em>7v7</em><small>STRIKE LEAGUE</small></h1>
    <p class="lead">7 人制ラグビーを、その指先で。</p>
    <div class="cta">
      <a class="store" href="${APP_STORE_URL}" rel="noopener">App Store で入手</a>
      <a class="ghost" href="#game">ゲーム紹介</a>
    </div>
    <p class="note">基本プレイ無料(アプリ内課金あり)</p>
  </div>
</section>

<main>
<section id="game" class="section">
  <h2 class="heading"><span>GAME</span>ゲーム紹介</h2>
  <p class="intro">1 チーム 7 人。広いフィールドを一気に駆け抜ける、スピード感あふれる 7 人制ラグビーを、スマホで手軽に。<br>試合で勝って報酬を集め、選手を獲得・育成して、自分だけのチームを強くしていこう。</p>
  <div class="features">
${FEATURES.map(
  (f, i) => `    <article class="feature${i % 2 ? ' flip' : ''}">
      <figure><img src="${img(`img/${f.img}.jpg`)}" alt="${esc(f.title)}" loading="lazy" width="1280" height="720"></figure>
      <div><p class="num">0${i + 1}</p><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>
    </article>`,
).join('\n')}
  </div>
</section>

<section id="news" class="section">
  <h2 class="heading"><span>NEWS</span>ニュース</h2>
  <ul class="news">
${NEWS.map((n) => `    <li><time>${n.date}</time><p>${esc(n.text)}${n.href ? ` <a href="${n.href}">詳しく見る</a>` : ''}</p></li>`).join('\n')}
  </ul>
</section>

<section class="section info">
  <h2 class="heading"><span>INFO</span>タイトル情報</h2>
  <dl>
    <dt>タイトル</dt><dd>${esc(APP_TITLE)}</dd>
    <dt>ジャンル</dt><dd>スポーツ(7 人制ラグビー)</dd>
    <dt>対応機種</dt><dd>iPhone(iOS ${legal.MIN_IOS} 以降)</dd>
    <dt>価格</dt><dd>基本プレイ無料(アプリ内課金あり)</dd>
    <dt>配信</dt><dd><a href="${APP_STORE_URL}" rel="noopener">App Store</a> にて配信中</dd>
    <dt>開発・運営</dt><dd>${esc(BRAND)}</dd>
  </dl>
</section>

<section class="section more">
  <h2 class="heading"><span>MORE GAMES</span>ほかのゲーム</h2>
  <a class="game-link" href="${SETTAI_PATH.slice(1)}">
    <img src="${img('img/settai-icon.png')}" alt="" width="88" height="88">
    <span class="gl-main"><b>${esc(SETTAI)}</b><small>上司を勝たせて、出世する。接待しながら打つ麻雀ゲーム(App Store にて${SETTAI_APP_STORE_URL ? '配信中' : '近日配信'})</small></span>
    <span class="gl-go">詳しく見る</span>
  </a>
</section>
</main>
`,
  }),
);

// ---------------------------------------------------------------- サポート

const FAQ = [
  ['購入したジェムが届きません', 'ショップの画面を開き直すと、受け取っていなかった購入の分を受け取れます。それでも届かないときは、App Store の領収書(注文番号)を添えてお問い合わせください。'],
  ['購入を取り消したい(返金してほしい)', 'App Store での購入の返金は、Apple の「問題を報告する」(reportaproblem.apple.com)からお申し込みください。'],
  ['機種変更でデータを引き継げますか', '現在のバージョンでは、データは端末の中にだけ保存されるため、引き継ぎはできません。アプリを削除するとデータも消えますのでご注意ください。'],
  ['ログインボーナスはいつ受け取れますか', '毎日、日本時間の 0 時に日付が変わります。その日はじめてホーム画面を開いたときに受け取れます。'],
  ['ガチャの確率はどこで見られますか', 'ガチャの画面の「提供割合」から、それぞれのガチャの確率を確認できます。'],
  ['未成年でも購入できますか', '保護者の同意を得たうえでご購入ください。16 歳未満は 1 か月 5,000 円、16〜19 歳は 1 か月 20,000 円までの上限があります。'],
];

const SETTAI_FAQ = [
  ['通信は必要ですか', '必要ありません。対局・人脈ガチャを含め、すべて端末の中だけで遊べます。'],
  ['お金はかかりますか', 'かかりません。アプリ内課金はなく、人脈ガチャはゲームで貯まる「名刺」だけで引けます。'],
  ['名刺はどうやって貯めますか', 'フリー対局の終局(順位に応じて)、接待チャレンジ、出世街道の昇進、実績の解除で貯まります。'],
  ['人脈ガチャの確率はどこで見られますか', 'ガチャの画面に表示しています(N 55%・R 30%・SR 12%・SSR 3%)。10 連では SR 以上が 1 人確定、60 回 SSR が出なければ次は SSR が出ます。'],
  ['機種変更でデータを引き継げますか', 'データは端末の中にだけ保存されるため、引き継ぎはできません。アプリを削除するとデータも消えますのでご注意ください。'],
  ['対局の途中でアプリを閉じてしまいました', 'ホーム画面の「続きから」で、同じ局面から再開できます。'],
];

write(
  '/support/',
  page({
    path: '/support/',
    title: 'サポート・お問い合わせ',
    description: `${APP_TITLE}・${SETTAI} のサポート・よくある質問・お問い合わせ窓口。`,
    body: `
<main class="doc">
  <h1 class="heading"><span>SUPPORT</span>サポート・お問い合わせ</h1>
  <section class="contact">
    <h2>お問い合わせ</h2>
    <p>ゲームの不具合・ご購入・ご意見などは、メールでお問い合わせください。</p>
    <p><a class="mail" href="mailto:${EMAIL}?subject=${encodeURIComponent(`${BRAND} お問い合わせ`)}">${EMAIL}</a></p>
    <ul>
      <li>ゲームの名前(${esc(APP_TITLE)}・${esc(SETTAI)})</li>
      <li>お使いの端末と iOS のバージョン</li>
      <li>起きたこと(いつ・どの画面で・何をしたら)</li>
      <li>購入についてのお問い合わせは、App Store の領収書(注文番号)</li>
    </ul>
    <p class="small">返信までお時間をいただくことがあります。個人で運営しているため、お電話での対応はしておりません。</p>
  </section>
  <section>
    <h2>よくある質問(${esc(APP_TITLE)})</h2>
    <div class="faq">
${FAQ.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </section>
  <section id="settai-mahjong">
    <h2>よくある質問(${esc(SETTAI)})</h2>
    <div class="faq">
${SETTAI_FAQ.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </section>
  <section>
    <h2>規約・表記</h2>
    <ul class="links">
      <li><a href="../rugby7v7/terms/">利用規約(${esc(APP_TITLE)})</a></li>
      <li><a href="../rugby7v7/privacy/">プライバシーポリシー(${esc(APP_TITLE)})</a></li>
      <li><a href="../rugby7v7/legal/">特定商取引法に基づく表記・資金決済法に基づく表示(${esc(APP_TITLE)})</a></li>
      <li><a href="..${SETTAI_PATH}privacy/">プライバシーポリシー(${esc(SETTAI)})</a></li>
    </ul>
  </section>
</main>
`,
  }),
);

// ---------------------------------------------------------------- 規約・表記

/** 規約の文(1 行目はタイトル、「第N条」などは見出しに) */
function docBody(text) {
  const lines = text.split('\n').slice(1);
  return lines
    .map((l) => {
      if (!l.trim()) return '';
      if (/^(第\d+条|\d+\. )/.test(l)) return `<h2>${esc(l)}</h2>`;
      return `<p>${esc(l)}</p>`;
    })
    .join('\n');
}
const table = (text) =>
  `<dl class="table">${text
    .split('\n')
    .map((l) => {
      const i = l.indexOf(':');
      return `<dt>${esc(l.slice(0, i))}</dt><dd>${esc(l.slice(i + 1))}</dd>`;
    })
    .join('')}</dl>`;

const docPage = (path, title, inner) =>
  write(
    path,
    page({
      path,
      title: `${title}(${APP_TITLE})`,
      description: `${APP_TITLE} の${title}。`,
      body: `<main class="doc"><h1 class="heading"><span>${esc(APP_TITLE.toUpperCase())}</span>${esc(title)}</h1>${inner}</main>`,
    }),
  );

docPage('/rugby7v7/terms/', '利用規約', docBody(legal.termsText()));
docPage('/rugby7v7/privacy/', 'プライバシーポリシー', docBody(legal.privacyText()));
docPage(
  '/rugby7v7/legal/',
  '特定商取引法・資金決済法に基づく表示',
  `<h2>特定商取引法に基づく表記</h2>${table(legal.tokushohoText())}<h2>資金決済法に基づく表示</h2>${table(legal.shikinText())}`,
);

// ---------------------------------------------------------------- 接待麻雀のページ

// Rugby 7v7(トップ)と同じ流れ:大きな見出し(ヒーロー)→ ゲーム紹介 → ニュース → タイトル情報 → ほかのゲーム。
// 色だけ、ゲームと同じ麻雀卓の緑と金(body の settai-page)。ゲーム画面は縦長なので、スマホの枠に入れて並べる
const SETTAI_THEME = '#071a13';
const phone = (name, alt, cls = '', lazy = true) =>
  `<figure class="phone${cls}"><img src="../${img(`img/settai-${name}.jpg`)}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''} width="600" height="1300"></figure>`;

write(
  SETTAI_PATH,
  page({
    path: SETTAI_PATH,
    hero: true,
    theme: SETTAI_THEME,
    bodyClass: 'settai-page',
    title: `${SETTAI}(iPhone 向け麻雀ゲーム)`,
    description: `「${SETTAI}」公式ページ。上司を勝たせて、出世する。接待しながら打つ麻雀ゲーム。通信なし・課金なしで遊べます。`,
    image: 'img/settai-ogp.jpg',
    body: `
<section class="s-hero">
  <div class="s-hero-art" aria-hidden="true">
    ${phone('play', '', ' p-left', false)}
    ${phone('home', '', ' p-center', false)}
    ${phone('gacha', '', ' p-right', false)}
  </div>
  <div class="s-hero-inner">
    <p class="kicker">iPhone 向け麻雀ゲーム</p>
    <h1 class="s-logo"><img src="../${img('img/settai-logo.png')}" alt="${esc(SETTAI)}" width="1155" height="320"><small>SETTAI MAHJONG</small></h1>
    <p class="s-lead">上司を勝たせて、出世する。</p>
    <div class="cta">
      ${settaiStore()}
      <a class="ghost" href="#game">ゲーム紹介</a>
    </div>
    <p class="note">無料(アプリ内課金・広告なし)</p>
  </div>
</section>

<main>
<section id="game" class="section">
  <h2 class="heading"><span>GAME</span>ゲーム紹介</h2>
  <p class="intro">あなたは新入社員。麻雀の卓で上司の機嫌を取りながら、差し込み・鳴かせで上司を気持ちよく勝たせて、社長の座をめざそう。<br>通信なし・課金なし・広告なし。すべての機能を、端末の中だけで遊べます。</p>
  <div class="features">
${SETTAI_FEATURES.map(
  (f, i) => `    <article class="feature tall${i % 2 ? ' flip' : ''}">
      ${phone(f.img, f.title)}
      <div><p class="num">0${i + 1}</p><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>
    </article>`,
).join('\n')}
  </div>
</section>

<section id="news" class="section">
  <h2 class="heading"><span>NEWS</span>ニュース</h2>
  <ul class="news">
${NEWS.filter((n) => n.game === 'settai').map((n) => `    <li><time>${n.date}</time><p>${esc(n.text)}</p></li>`).join('\n')}
  </ul>
</section>

<section class="section info">
  <h2 class="heading"><span>INFO</span>タイトル情報</h2>
  <dl>
    <dt>タイトル</dt><dd>${esc(SETTAI)}</dd>
    <dt>ジャンル</dt><dd>麻雀(四人麻雀・三人麻雀)</dd>
    <dt>対応機種</dt><dd>iPhone(iOS ${settai.MIN_IOS} 以降)</dd>
    <dt>価格</dt><dd>無料(アプリ内課金・広告なし)</dd>
    <dt>配信</dt><dd>${SETTAI_APP_STORE_URL ? `<a href="${SETTAI_APP_STORE_URL}" rel="noopener">App Store</a> にて配信中` : 'App Store にて近日配信'}</dd>
    <dt>開発・運営</dt><dd>${esc(BRAND)}</dd>
    <dt>サポート</dt><dd><a href="../support/#settai-mahjong">よくある質問・お問い合わせ</a></dd>
    <dt>規約</dt><dd><a href="privacy/">プライバシーポリシー</a></dd>
  </dl>
</section>

<section class="section more">
  <h2 class="heading"><span>MORE GAMES</span>ほかのゲーム</h2>
  <a class="game-link" href="../">
    <img src="../${img('img/icon.png')}" alt="" width="88" height="88">
    <span class="gl-main"><b>${esc(APP_TITLE)}</b><small>7 人制ラグビーを、その指先で。走る・パスする・タックルする、スマホのラグビーゲーム(App Store にて配信中)</small></span>
    <span class="gl-go">詳しく見る</span>
  </a>
</section>
</main>
`,
  }),
);

{
  const path = `${SETTAI_PATH}privacy/`;
  write(
    path,
    page({
      path,
      title: `プライバシーポリシー(${SETTAI})`,
      description: `${SETTAI} のプライバシーポリシー。`,
      image: 'img/settai-ogp.jpg',
      theme: SETTAI_THEME,
      bodyClass: 'settai-page',
      body: `<main class="doc"><h1 class="heading"><span>${esc(SETTAI)}</span>プライバシーポリシー</h1>${docBody(settai.privacyText())}</main>`,
    }),
  );
}

// 見つからないページ(Cloudflare Pages は 404.html を使う)
fs.writeFileSync(
  out + '404.html',
  page({
    path: '/',
    title: 'ページが見つかりません',
    description: 'ページが見つかりません。',
    body: `<main class="doc center"><h1 class="heading"><span>404</span>ページが見つかりません</h1><p><a href="/">トップへもどる</a></p></main>`,
  }).replace(/href="\.\//g, 'href="/'),
);

// ---------------------------------------------------------------- 見た目(CSS)と見出しのフォント

fs.copyFileSync(root + 'tools/style.css', out + 'style.css');

// 見出しのフォント(Dela Gothic One)を、サイトで使う文字だけに絞る
let used = '';
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = d + '/' + f;
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) used += fs.readFileSync(p, 'utf8');
  }
};
walk(out.replace(/\/$/, ''));
const chars = [...new Set(used + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')].join('');
fs.mkdirSync(out + 'fonts', { recursive: true });
const font = await subsetFont(fs.readFileSync(root + 'tools/fonts/DelaGothicOne-Regular.ttf'), chars, { targetFormat: 'woff2' });
fs.writeFileSync(out + 'fonts/dela.woff2', font);
fs.copyFileSync(root + 'tools/fonts/OFL-DelaGothicOne.txt', out + 'fonts/OFL-DelaGothicOne.txt');

// セキュリティ用のヘッダー(Cloudflare Pages の _headers)。ページの中の <script> は、中身のハッシュで許可する(書き換えると自動で追従)
const scriptHashes = new Set();
const scan = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = d + '/' + f;
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (f.endsWith('.html'))
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))
        scriptHashes.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  }
};
scan(out.replace(/\/$/, ''));
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...scriptHashes].join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');
fs.writeFileSync(
  out + '_headers',
  `/*
  Content-Security-Policy: ${csp}
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=15552000
`,
);

console.log(`site/ を作りました(v${pkg.version})。トップ・サポート・規約 3 ページ・${SETTAI}の紹介とプライバシーポリシー・404`);
const missing = legal.missingLegalFields();
if (missing.length) console.log(`※ まだ空欄:${missing.join('、')}`);
