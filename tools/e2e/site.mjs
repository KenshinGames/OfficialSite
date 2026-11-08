/**
 * 公式サイト(site/)の見た目:パソコン幅とスマホ幅のスクショ、リンク切れ、横スクロールが出ないか。
 * 先に `npm run build` と `npm run serve`(site/ を http://localhost:8090/ で開く)を動かしておく
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
/** Chrome の場所(Mac の Chrome・クラウドの作業環境の Chromium)。CHROME=<パス> で指定もできる */
const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium'];
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
const BASE = process.env.SITE ?? 'http://localhost:8090/';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? CHROMES.find((p) => fs.existsSync(p)),
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
const R = {};
const pages = ['', 'support/', 'rugby7v7/terms/', 'rugby7v7/privacy/', 'rugby7v7/legal/'];
for (const [w, h, tag] of [
  [1366, 860, 'pc'],
  [390, 844, 'sp'],
]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: tag === 'sp' ? 2 : 1 });
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    // 遅れて読む画像(loading=lazy)も読み込ませる
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 300));
    const name = `site-${tag}-${p.replace(/\//g, '-').replace(/-$/, '') || 'top'}`;
    await page.screenshot({ path: OUT + name + '.png', fullPage: p === '' });
    R[name] = await page.evaluate(() => ({
      横スクロール: document.documentElement.scrollWidth > window.innerWidth,
      見出しのフォント: document.fonts.check('20px Dela'),
    }));
  }
}
// リンク切れ(サイトの中のリンクを全部たどる)
const seen = new Set();
const queue = [BASE];
while (queue.length) {
  const u = queue.shift();
  if (seen.has(u)) continue;
  seen.add(u);
  const res = await page.goto(u, { waitUntil: 'domcontentloaded' });
  if (res.status() >= 400) errors.push(`リンク切れ ${u}`);
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
  for (const l of links) if (l.startsWith(BASE) && !l.includes('#')) queue.push(l.split('#')[0]);
}
R.たどったページ = [...seen].map((u) => u.replace(BASE, '/'));
console.log(JSON.stringify(R, null, 1));
console.log('errors:', errors);
await browser.close();
