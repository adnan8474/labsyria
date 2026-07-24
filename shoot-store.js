/**
 * Store screenshots that need interaction first. The plain walk captures resting
 * states, but the two screens that sell the app (the Levey-Jennings chart and an
 * answered assistant question) only exist after a tap, so they get driven here.
 *
 * Usage: node shoot-store.js <lang> <outdir> [phone|ipad]
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8099';
const lang = process.argv[2] || 'ar';
const outDir = process.argv[3] || `shots-${lang}`;
const DEVICES = {
  phone: { width: 430, height: 932, scale: 3 },
  ipad: { width: 1032, height: 1376, scale: 2 },
};
const device = DEVICES[process.argv[4] || 'phone'];

const L = {
  ar: {
    plot: 'ارسم وحلّل',
    ask: 'ما الفرق بين التحقّق والتصديق؟',
    startCourse: 'ابدأ الدورة',
  },
  en: {
    plot: 'Plot & analyse',
    ask: 'Explain the Westgard rules briefly',
    startCourse: 'Start course',
  },
};

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    locale: lang === 'ar' ? 'ar-SY' : 'en-GB',
  });
  const page = await ctx.newPage();
  const t = L[lang];

  const go = async (route) => {
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.evaluate((l) => {
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    }, lang);
    await page.waitForTimeout(1500);
  };
  const shot = async (name) => {
    const p = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: p });
    const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    console.log(`${name.padEnd(18)} chars=${String(txt.length).padStart(5)} px=${fs.statSync(p).size}`);
  };

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((l) => {
    localStorage.setItem('labsyria.settings.v1', JSON.stringify({ lang: l, theme: 'light' }));
    localStorage.setItem('labsyria.onboarded.v1', 'true');
  }, lang);

  // Levey-Jennings with the chart actually drawn.
  await go('/tool/lj');
  await page.getByText(t.plot, { exact: false }).first().click();
  await page.waitForTimeout(1600);
  await shot('lj-plotted');

  // Assistant with a real answer on screen. Without the network the app falls
  // back to its grounded on-device retrieval, which is still a genuine answer.
  await go('/assistant');
  await page.getByText(t.ask, { exact: false }).first().click();
  await page.waitForTimeout(6000);
  // The thread auto-scrolls to the newest text, which lands mid-answer with the
  // question off screen. Pull the question back into view so the shot reads as
  // a question and its answer rather than an orphaned wall of text.
  await page.getByText(t.ask, { exact: false }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await shot('assistant-answered');

  // First lesson of a course, in the reader.
  await go('/course/quality-control');
  await page.getByText(t.startCourse, { exact: false }).first().click();
  await page.waitForTimeout(2500);
  await shot('lesson');

  await b.close();
})();
