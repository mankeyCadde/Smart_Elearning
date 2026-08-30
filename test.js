import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating to dashboard...");
  await page.goto('http://localhost:5173/student/dashboard', { waitUntil: 'networkidle0' });
  
  let url = page.url();
  console.log("Current URL after load:", url);
  
  console.log("Clicking Profile button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const profileBtn = btns.find(b => b.textContent.includes('Profile'));
    if (profileBtn) profileBtn.click();
    else console.log("Profile button not found");
  });
  
  await new Promise(r => setTimeout(r, 1000));
  console.log("URL after clicking Profile:", page.url());

  console.log("Clicking Dashboard link...");
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const dashLink = links.find(a => a.textContent.includes('Dashboard'));
    if (dashLink) dashLink.click();
    else console.log("Dashboard link not found");
  });

  await new Promise(r => setTimeout(r, 1000));
  console.log("URL after clicking Dashboard:", page.url());

  await browser.close();
})();
