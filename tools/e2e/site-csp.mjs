/** 公開したサイトのセキュリティヘッダー(CSP)で、表示が壊れないか。URL=https://... npm run test:csp
 *  Cloudflare が自動で足す解析の script(cloudflareinsights)は CSP で止めているので、違反として数えない */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
/** Chrome の場所(Mac の Chrome・クラウドの作業環境の Chromium)。CHROME=<パス> で指定もできる */
const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium'];
const url = process.env.URL ?? 'https://kenshin-games.jp/';
const exe = process.env.CHROME ?? CHROMES.find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const problems = [];
page.on('console', (m) => !/cloudflareinsights/.test(m.text()) && /Content Security Policy|Refused/i.test(m.text()) && problems.push(m.text()));
page.on('requestfailed', (r) => !/cloudflareinsights/.test(r.url()) && problems.push('失敗: ' + r.url()));
for (const p of ['', 'support/', 'rugby7v7/terms/', 'rugby7v7/privacy/', 'rugby7v7/legal/']) {
  await page.goto(url + p, { waitUntil: 'networkidle0' });
  if (p === '') {
    await page.evaluate(() => scrollTo(0, 400));
    await new Promise((r) => setTimeout(r, 300));
    console.log('スクロールで header が変わる(inline script):', await page.evaluate(() => document.body.classList.contains('scrolled')));
    console.log('ヒーロー背景:', await page.evaluate(() => getComputedStyle(document.querySelector('.hero')).backgroundImage.slice(0, 40)));
    console.log('見出しフォント:', await page.evaluate(() => document.fonts.check("20px Dela")));
  }
}
console.log(problems.length ? '問題:\n' + problems.join('\n') : 'CSP 違反・読み込み失敗: なし');
await browser.close();
