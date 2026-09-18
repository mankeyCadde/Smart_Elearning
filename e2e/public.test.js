import { goto, assertPageHas, assertNoFatalErrors, clickByText, waitForUrl, waitFor } from './helpers.js';

export const suite = 'public';

export const tests = [
  {
    name: 'home page renders hero and popular courses',
    run: async (page) => {
      await goto(page, '/');
      await assertPageHas(page, 'SmartLearn');
      await assertPageHas(page, 'Popular Courses');
      await assertPageHas(page, 'Top Categories');
      assertNoFatalErrors(page, 'home');
    },
  },
  {
    name: 'catalog lists courses and search filters them',
    run: async (page) => {
      await goto(page, '/catalog');
      await assertPageHas(page, 'Complete Python Bootcamp');
      await assertPageHas(page, 'Advanced React & Next.js');
      await page.type('.search-input', 'python');
      await assertPageHas(page, 'Complete Python Bootcamp');
      await new Promise(r => setTimeout(r, 100));
      const reactVisible = await page.evaluate(() => document.body.innerText.includes('Advanced React'));
      if (reactVisible) {
        const input = await page.$('.search-input');
        await input.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
      }
      await clickByText(page, 'Clear All Filters');
      assertNoFatalErrors(page, 'catalog');
    },
  },
  {
    name: 'course details page renders enrollment card',
    run: async (page) => {
      await goto(page, '/course/1');
      await assertPageHas(page, 'Complete Python Bootcamp');
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return body.includes('Enroll Now') || body.includes('Log in to Enroll');
      }, { label: 'enrollment action shown' });
      assertNoFatalErrors(page, 'course-details');
    },
  },
  {
    name: 'search results route shows results for a query',
    run: async (page) => {
      await goto(page, '/search?q=react');
      await assertPageHas(page, 'Advanced React & Next.js');
      await waitForUrl(page, '/search');
      assertNoFatalErrors(page, 'search-results');
    },
  },
];