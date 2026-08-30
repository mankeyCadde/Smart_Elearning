import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/student/dashboard', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'dashboard.png' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const profileBtn = btns.find(b => b.textContent.includes('Profile'));
    if (profileBtn) profileBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'profile.png' });
  
  await browser.close();
})();
