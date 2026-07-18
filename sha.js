const { chromium } = require('playwright-core');
const EXE='C:/Program Files/Google/Chrome/Application/chrome.exe';
(async()=>{const b=await chromium.launch({executablePath:EXE,args:['--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto('file:///C:/Users/user/labsyria/control-results-fail.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(600);
 await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));await p.waitForTimeout(300);
 await p.screenshot({path:'va-article.png',fullPage:true});
 await b.close();console.log('ok');})();
