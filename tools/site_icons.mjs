// The site's icons, all from the 「上河」 seal (STYLE.md: the brand seal), into web/public/ (served at the site root):
// - favicon.svg (made by hand: assets/ui/seal_small.svg, paper behind the cut characters) -> favicon-32.png and
//   favicon.ico (a PNG inside an ICO, for anything that asks /favicon.ico): the tab icon, the clean seal, readable small;
// - apple-touch-icon.png (180), icon-192.png, icon-512.png: the worn seal (assets/ui/seal.svg) stamped on paper, the
//   home-screen icon; icon-maskable-512.png keeps it inside Android's round safe zone (a square seal <= 0.8 / sqrt 2).
// site.webmanifest and the <link>s in every page point at them. Usage: node tools/site_icons.mjs (Chrome renders).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const PUB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../web/public');
const PAPER = '#efe4cc'; // --qm-paper
const uri = (f) => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(PUB, f)).toString('base64');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ deviceScaleFactor: 1 });

// one square: the seal at `scale` of the side, on paper or transparent
async function render(out, svg, side, scale, paper) {
  const s = Math.round(side * scale), off = (side - s) / 2;
  await page.setViewportSize({ width: side, height: side });
  await page.setContent(`<body style="margin:0;background:${paper ? PAPER : 'transparent'}">` +
    `<img src="${uri(svg)}" style="position:absolute;left:${off}px;top:${off}px;width:${s}px;height:${s}px"></body>`);
  await page.waitForFunction(() => document.images[0].complete);
  await page.screenshot({ path: path.join(PUB, out), omitBackground: !paper, clip: { x: 0, y: 0, width: side, height: side } });
  console.log(`  ${out} ${side}px`);
}
await render('favicon-32.png', 'favicon.svg', 32, 1, false);
await render('apple-touch-icon.png', 'assets/ui/seal.svg', 180, 0.72, true);
await render('icon-192.png', 'assets/ui/seal.svg', 192, 0.72, true);
await render('icon-512.png', 'assets/ui/seal.svg', 512, 0.72, true);
await render('icon-maskable-512.png', 'assets/ui/seal.svg', 512, 0.56, true);
await browser.close();

// favicon.ico: one 32 px PNG entry (ICO allows PNG data since Vista; every browser reads it)
const png = fs.readFileSync(path.join(PUB, 'favicon-32.png'));
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4); // reserved, type icon, 1 image
head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9); // 32x32, no palette
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(PUB, 'favicon.ico'), Buffer.concat([head, png]));
console.log('  favicon.ico');
