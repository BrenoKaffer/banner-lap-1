import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(__dirname, 'index.html');

const PAGE_WIDTH_MM = 900;  // 90 cm
const MIN_HEIGHT_MM = 1200; // 120 cm (banner will be at least this tall)

const browser = await chromium.launch();
const page = await browser.newPage();

// Render at a fixed CSS-pixel width matching the mm width 1:1 (96px/in => 1mm = 3.7795px)
const MM_TO_PX = 96 / 25.4;
await page.setViewportSize({ width: Math.round(PAGE_WIDTH_MM * MM_TO_PX), height: 800 });
await page.goto(url, { waitUntil: 'networkidle' });

const contentHeightPx = await page.evaluate(() => document.querySelector('.page').scrollHeight);
const contentHeightMM = contentHeightPx / MM_TO_PX;
const finalHeightMM = Math.max(contentHeightMM, MIN_HEIGHT_MM);

console.log(`Conteudo renderizado: ${contentHeightMM.toFixed(1)}mm de altura (alvo minimo: ${MIN_HEIGHT_MM}mm)`);

await page.pdf({
  path: path.join(__dirname, '..', 'banner-90x120.pdf'),
  width: `${PAGE_WIDTH_MM}mm`,
  height: `${finalHeightMM}mm`,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

// Also export a PNG preview at the content's natural height (no padding) for quick visual review
await page.setViewportSize({ width: Math.round(PAGE_WIDTH_MM * MM_TO_PX), height: Math.round(contentHeightPx) });
await page.screenshot({ path: path.join(__dirname, '..', 'preview.png'), fullPage: true });

await browser.close();
console.log('OK: banner-90x120.pdf e preview.png gerados.');
