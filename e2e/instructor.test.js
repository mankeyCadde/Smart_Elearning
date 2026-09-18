import {
  login, goto, assertPageHas, assertNoFatalErrors, DEMO,
  waitFor, sleep, clickInCard,
} from './helpers.js';

export const suite = 'instructor';

export const tests = [
  {
    name: 'dashboard shows stats and quick actions',
    run: async (page) => {
      await login(page, DEMO.instructor.email, DEMO.instructor.password);
      await assertPageHas(page, 'Instructor Dashboard');
      await assertPageHas(page, 'Quick Actions');
      assertNoFatalErrors(page, 'instructor-dashboard');
    },
  },
  {
    name: 'course editor opens an existing course',
    run: async (page) => {
      await login(page, DEMO.instructor.email, DEMO.instructor.password);
      await goto(page, '/instructor/course/1/edit');
      await assertPageHas(page, 'Editing: Complete Python Bootcamp');
      await assertPageHas(page, 'Save Course');
      assertNoFatalErrors(page, 'course-editor');
    },
  },
  {
    name: 'quiz builder loads existing quizzes',
    run: async (page) => {
      await login(page, DEMO.instructor.email, DEMO.instructor.password);
      await goto(page, '/instructor/quiz-builder');
      await assertPageHas(page, 'Quiz Builder');
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return body.includes('New Quiz');
      }, { label: 'quiz builder ready' });
      assertNoFatalErrors(page, 'quiz-builder-list');
    },
  },
  {
    name: 'quiz builder creates, edits, and deletes a quiz end-to-end',
    run: async (page) => {
      // Always auto-accept window.confirm (used for quiz deletion)
      page.on('dialog', dialog => dialog.accept());

      await login(page, DEMO.instructor.email, DEMO.instructor.password);
      await goto(page, '/instructor/quiz-builder');
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Quiz'));
        btn.click();
      });

      // --- Create ---
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return body.includes('Questions (1)');
      }, { label: 'quiz editor form open' });

      await page.type('#qt', 'E2E Smoke Quiz');
      await page.type('#qd', 'Created by the E2E suite.');
      await page.type('#qtext-0', 'What is 2+2?');

      // Fill both MC options for question 1
      const optionInputs = await page.$$('input[placeholder^="Option"]');
      if (optionInputs.length >= 2) {
        await optionInputs[0].click({ clickCount: 3 });
        await optionInputs[0].type('4');
        await optionInputs[1].click({ clickCount: 3 });
        await optionInputs[1].type('5');
      } else {
        throw new Error('Quiz builder option inputs not found');
      }

      // Mark the first option as correct
      await page.evaluate(() => {
        const circles = Array.from(document.querySelectorAll('button[title="Mark as correct"]'));
        circles[0].click();
      });

      await sleep(300);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Quiz'));
        btn.click();
      });

      // List view returns with the new quiz
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return body.includes('E2E Smoke Quiz') && body.includes('New Quiz');
      }, { label: 'created quiz appears in list' });

      // --- Edit (target the row containing the created quiz) ---
      await clickInCard(page, 'E2E Smoke Quiz', 'Edit');
      await waitFor(page, async () => {
        const vals = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.value));
        return vals.includes('E2E Smoke Quiz');
      }, { label: 'quiz editor reopened for editing' });

      await page.evaluate(() => {
        const input = Array.from(document.querySelectorAll('input')).find(i => i.value === 'E2E Smoke Quiz');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'E2E Smoke Quiz v2');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await sleep(200);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Quiz'));
        btn.click();
      });

      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return body.includes('E2E Smoke Quiz v2') && body.includes('New Quiz');
      }, { label: 'edited quiz title appears in list' });

      // --- Delete (accept window.confirm, target the edited row) ---
      await clickInCard(page, 'E2E Smoke Quiz v2', 'Delete');
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return !body.includes('E2E Smoke Quiz v2');
      }, { label: 'quiz deleted from list' });

      assertNoFatalErrors(page, 'quiz-builder-crud');
    },
  },
  {
    name: 'attendance page loads course selector',
    run: async (page) => {
      await login(page, DEMO.instructor.email, DEMO.instructor.password);
      await goto(page, '/instructor/attendance');
      await waitFor(page, () => page.url().includes('/attendance'), { label: 'attendance url' });
      assertNoFatalErrors(page, 'instructor-attendance');
    },
  },
];