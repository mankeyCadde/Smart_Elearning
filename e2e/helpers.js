import puppeteer from 'puppeteer';

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
export const API_URL = process.env.E2E_API_URL || 'http://127.0.0.1:8000/api';

export const DEMO = {
  student: { email: 'student@test.com', password: 'StudentPass1' },
  instructor: { email: 'instructor@test.com', password: 'InstructorPass1' },
  admin: { email: 'admin@test.com', password: 'AdminPass1' },
};

let _browser = null;

export async function startBrowser() {
  _browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return _browser;
}

export async function stopBrowser() {
  if (_browser) await _browser.close();
  _browser = null;
}

export async function newPage() {
  const context = await _browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1360, height: 900 });
  page._context = context;
  page._issues = { pageErrors: [], http500: [], failedRequests: [] };
  page.on('pageerror', err => page._issues.pageErrors.push(err.message));
  page.on('response', res => {
    if (res.status() >= 500) page._issues.http500.push(`HTTP ${res.status()} ${res.url()}`);
  });
  page.on('requestfailed', req => page._issues.failedRequests.push(`${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
  return page;
}

export async function closePage(page) {
  await page._context.close().catch(() => {});
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function waitFor(page, predicate, { timeout = 20000, interval = 200, label = 'condition' } = {}) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeout) {
    try {
      if (await predicate()) return;
    } catch (err) {
      lastErr = err;
    }
    await sleep(interval);
  }
  throw new Error(`Timed out waiting for ${label}${lastErr ? ` (last error: ${lastErr.message})` : ''}`);
}

export async function waitForText(page, text, opts) {
  return waitFor(page, async () => (await page.evaluate(t => document.body.innerText.includes(t), text)), {
    ...opts,
    label: `text "${text}"`,
  });
}

export async function waitForUrl(page, part, opts) {
  return waitFor(page, () => page.url().includes(part), { ...opts, label: `url containing "${part}"` });
}

export async function goto(page, path) {
  await page.goto(BASE_URL + path, { waitUntil: 'networkidle0', timeout: 30000 });
}

export async function login(page, email, password) {
  await goto(page, '/login');
  await page.type('#email', email);
  await page.type('#password', password);
  await page.evaluate(() => {
    const btn = document.querySelector('.auth-form button[type="submit"]');
    if (btn) btn.click();
  });
  await waitFor(page, async () => !page.url().includes('/login'), { label: 'login redirect' });
  await waitFor(page, async () => !!(await page.$('.user-chip')), { label: 'user chip visible' });
}

export async function clickByText(page, text) {
  await page.evaluate((t) => {
    const el = Array.from(document.querySelectorAll('button, a'))
      .find(e => e.textContent.trim().includes(t));
    if (!el) throw new Error(`Click target "${t}" not found`);
    el.click();
  }, text);
}

/**
 * Click a button inside the card (`.stitch-card`) whose text includes both
 * `cardText` and `buttonText`. Used for row-scoped actions in list pages.
 */
export async function clickInCard(page, cardText, buttonText) {
  await page.evaluate((t, b) => {
    const cards = Array.from(document.querySelectorAll('.stitch-card'));
    const card = cards.find(c => c.innerText.includes(t));
    if (!card) throw new Error(`Card containing "${t}" not found`);
    const btn = Array.from(card.querySelectorAll('button')).find(x => x.textContent.trim().includes(b));
    if (!btn) throw new Error(`Button "${b}" not found inside card containing "${t}"`);
    btn.click();
  }, cardText, buttonText);
}

export function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

export async function assertPageHas(page, text) {
  await waitForText(page, text);
  assert(true, `page contains "${text}"`);
}

export function assertNoFatalErrors(page, testName) {
  const issues = page._issues;
  const fatal = [...issues.pageErrors, ...issues.http500];
  assert(fatal.length === 0, `${testName}: page had fatal errors: ${fatal.join(' | ')}`);
}

export function reportIssues(page) {
  const issues = page._issues;
  const out = [];
  if (issues.pageErrors.length) out.push(`page errors: ${issues.pageErrors.join(' | ')}`);
  if (issues.http500.length) out.push(`HTTP 5xx: ${issues.http500.join(' | ')}`);
  return out.length ? ` [${out.join(' ;; ')}]` : '';
}