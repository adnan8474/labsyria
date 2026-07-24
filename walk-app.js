/**
 * Walk the exported LabSyria web build, capture every screen at App Store
 * iPhone 6.9" pixel dimensions (430x932 @3x = 1290x2796), and fail loudly on
 * console errors. Doubles as the store-screenshot generator.
 *
 * Usage: node walk-app.js <lang> <outdir>
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8099';
const lang = process.argv[2] || 'ar';
const outDir = process.argv[3] || `shots-${lang}`;
// Store screenshot geometries. iPhone 6.9" is the required App Store size and
// Play accepts it as-is; iPad 13" is required because the build ships with
// supportsTablet, and Apple rejects a tablet-capable app with no tablet shots.
const DEVICES = {
  phone: { width: 430, height: 932, scale: 3 }, // 1290 x 2796
  ipad: { width: 1032, height: 1376, scale: 2 }, // 2064 x 2752
};
const device = DEVICES[process.argv[4] || 'phone'];

const ROUTES = [
  ['onboarding', '/onboarding'],
  ['home', '/'],
  ['academy', '/learn'],
  ['course', '/course/quality-control'],
  ['assistant', '/assistant'],
  ['tools', '/tools'],
  ['tool-lj', '/tool/lj'],
  ['tool-calc', '/tool/calculators'],
  ['tool-ref', '/tool/reference'],
  ['library', '/library'],
  ['store', '/store'],
  ['more', '/more/menu'],
  ['terms', '/more/terms'],
  ['disclaimer', '/more/disclaimer'],
  ['privacy', '/more/privacy'],
  ['settings', '/more/settings'],
  ['verify', '/verify'],
  ['certificates', '/certificates'],
];

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    locale: lang === 'ar' ? 'ar-SY' : 'en-GB',
  });
  const page = await ctx.newPage();

  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${String(e).slice(0, 200)}`));

  // Seed language + skip the onboarding gate so the deep routes render.
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((l) => {
    localStorage.setItem('labsyria.settings.v1', JSON.stringify({ lang: l, theme: 'light' }));
    localStorage.setItem('labsyria.onboarded.v1', 'true');
  }, lang);

  const report = [];
  for (const [name, route] of ROUTES) {
    const before = problems.length;
    if (name === 'onboarding') {
      await page.evaluate(() => localStorage.setItem('labsyria.onboarded.v1', 'false'));
    }
    await page.goto(BASE + route, { waitUntil: 'load' });
    // react-native-web does not propagate I18nManager direction to the document,
    // so an Arabic build renders with LTR row order in the browser even though
    // native mirrors it. Force it here so the walk (and the store screenshots
    // it produces) match what the shipped app actually looks like.
    await page.evaluate((l) => {
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    }, lang);
    await page.waitForTimeout(1800);
    if (name === 'onboarding') {
      await page.evaluate(() => localStorage.setItem('labsyria.onboarded.v1', 'true'));
    }
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    const shot = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: shot });
    const bytes = fs.statSync(shot).size;
    report.push({
      name,
      route,
      chars: text.length,
      bytes,
      newErrors: problems.length - before,
      head: text.slice(0, 90),
    });
  }

  await b.close();

  console.log(`\n=== ${lang.toUpperCase()} WALK ===`);
  for (const r of report) {
    const flag = r.chars < 40 ? ' <== SUSPICIOUSLY EMPTY' : r.newErrors ? ' <== ERRORS' : '';
    console.log(
      `${r.name.padEnd(14)} chars=${String(r.chars).padStart(5)} px=${String(r.bytes).padStart(7)} err=${r.newErrors}${flag}`,
    );
    if (r.chars < 40) console.log(`    text: "${r.head}"`);
  }
  if (problems.length) {
    console.log(`\n--- ${problems.length} console problem(s) ---`);
    [...new Set(problems)].slice(0, 12).forEach((p) => console.log('  ' + p));
  } else {
    console.log('\nNo console errors.');
  }
})();
