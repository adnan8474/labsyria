const { chromium } = require('playwright-core');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const rev = async p => { await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))); await p.waitForTimeout(400); };
const B='https://adnan8474.github.io/labsyria';
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args:['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(B+'/',{waitUntil:'networkidle',timeout:45000}); await p.waitForTimeout(1500); await rev(p);
  await p.screenshot({ path:'v2live-home.png', fullPage:true });
  await p.click('#langBtn'); await p.waitForTimeout(700); await rev(p);
  await p.screenshot({ path:'v2live-home-en.png' });
  await p.close();
  const m = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
  await m.goto(B+'/',{waitUntil:'load'}); await m.waitForTimeout(1200); await rev(m);
  await m.screenshot({ path:'v2live-mobile.png', fullPage:true });
  await b.close(); console.log('live v2 shots done');
})();
