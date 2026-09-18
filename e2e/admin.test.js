import {
  login, goto, assertPageHas, assertNoFatalErrors, DEMO, waitFor,
} from './helpers.js';

export const suite = 'admin';

export const tests = [
  {
    name: 'dashboard shows platform stats and modules',
    run: async (page) => {
      await login(page, DEMO.admin.email, DEMO.admin.password);
      await assertPageHas(page, 'Admin Dashboard');
      await assertPageHas(page, 'Management Modules');
      assertNoFatalErrors(page, 'admin-dashboard');
    },
  },
  {
    name: 'user management lists users',
    run: async (page) => {
      await login(page, DEMO.admin.email, DEMO.admin.password);
      await goto(page, '/admin/users');
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return /student@test\.com|instructor@test\.com/i.test(body);
      }, { label: 'user list contains demo users' });
      assertNoFatalErrors(page, 'admin-users');
    },
  },
  {
    name: 'course management lists courses',
    run: async (page) => {
      await login(page, DEMO.admin.email, DEMO.admin.password);
      await goto(page, '/admin/courses');
      await assertPageHas(page, 'Complete Python Bootcamp');
      assertNoFatalErrors(page, 'admin-courses');
    },
  },
  {
    name: 'course report page shows engagement data',
    run: async (page) => {
      await login(page, DEMO.admin.email, DEMO.admin.password);
      await goto(page, '/admin/reports/course/1');
      await assertPageHas(page, 'Course Report');
      await assertPageHas(page, 'Student Engagement');
      await waitFor(page, async () => {
        const body = await page.evaluate(() => document.body.innerText);
        return body.includes('Enrolled Students');
      }, { label: 'report summary loaded' });
      assertNoFatalErrors(page, 'admin-course-report');
    },
  },
  {
    name: 'reports dashboard loads platform analytics',
    run: async (page) => {
      await login(page, DEMO.admin.email, DEMO.admin.password);
      await goto(page, '/admin/reports');
      await assertPageHas(page, 'Reports');
      assertNoFatalErrors(page, 'admin-reports');
    },
  },
];