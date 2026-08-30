import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
  console.log("Current URL after load:", page.url());
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const profileBtn = btns.find(b => b.textContent.includes('Profile'));
    if (profileBtn) profileBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  console.log("URL after clicking Profile:", page.url());
  
  await browser.close();
})();
