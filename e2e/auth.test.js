import {
  goto, waitForText, assertPageHas, assertNoFatalErrors, clickByText,
  login, DEMO, waitFor,
} from './helpers.js';

export const suite = 'auth';

export const tests = [
  {
    name: 'unauthenticated student route redirects to login',
    run: async (page) => {
      await goto(page, '/student/dashboard');
      await waitForText(page, 'Welcome Back');
      await waitFor(page, () => page.url().includes('/login'), { label: 'redirect to /login' });
      assertNoFatalErrors(page, 'auth-redirect');
    },
  },
  {
    name: 'invalid login shows an error',
    run: async (page) => {
      await goto(page, '/login');
      await page.type('#email', 'student@test.com');
      await page.type('#password', 'wrong-password');
      await page.evaluate(() => {
        const btn = document.querySelector('.auth-form button[type="submit"]');
        btn.click();
      });
      await waitFor(page, async () => !!(await page.$('[role="alert"]')), { label: 'login error alert' });
      await assertPageHas(page, 'No active account');
      assertNoFatalErrors(page, 'invalid-login');
    },
  },
  {
    name: 'student can log in and reach dashboard',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await waitFor(page, () => page.url().includes('/student/dashboard'), { label: 'student dashboard url' });
      await assertPageHas(page, 'My Courses');
      assertNoFatalErrors(page, 'student-login');
    },
  },
  {
    name: 'instructor can log in and reach dashboard',
    run: async (page) => {
      await login(page, DEMO.instructor.email, DEMO.instructor.password);
      await waitFor(page, () => page.url().includes('/instructor/dashboard'), { label: 'instructor dashboard url' });
      await assertPageHas(page, 'Instructor Dashboard');
      assertNoFatalErrors(page, 'instructor-login');
    },
  },
  {
    name: 'admin can log in and reach dashboard',
    run: async (page) => {
      await login(page, DEMO.admin.email, DEMO.admin.password);
      await waitFor(page, () => page.url().includes('/admin/dashboard'), { label: 'admin dashboard url' });
      await assertPageHas(page, 'Admin Dashboard');
      assertNoFatalErrors(page, 'admin-login');
    },
  },
  {
    name: 'student can log out back to login page',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await assertPageHas(page, 'My Courses');
      await page.evaluate(() => {
        const chip = Array.from(document.querySelectorAll('button')).find(b => b.className.includes('user-chip'));
        if (chip) chip.click();
      });
      await waitFor(page, async () => {
        const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent));
        return btns.some(t => t.trim() === 'Log Out');
      }, { label: 'logout button in dropdown' });
      await clickByText(page, 'Log Out');
      await waitForText(page, 'Welcome Back');
      await waitFor(page, () => page.url().includes('/login'), { label: 'logout redirect' });
      assertNoFatalErrors(page, 'logout');
    },
  },
  {
    name: 'register page validates required fields',
    run: async (page) => {
      await goto(page, '/register');
      await page.evaluate(() => {
        const btn = document.querySelector('.auth-form button[type="submit"]');
        btn.click();
      });
      await waitForText(page, 'is required');
      assertNoFatalErrors(page, 'register-validation');
    },
  },
  {
    name: 'forgot password shows success message for valid email',
    run: async (page) => {
      await goto(page, '/forgot-password');
      await page.type('#email', DEMO.student.email);
      await page.evaluate(() => {
        const btn = document.querySelector('.auth-form button[type="submit"]');
        if (btn) btn.click();
      });
      await waitForText(page, 'We have sent a password reset link');
      assertNoFatalErrors(page, 'forgot-password');
    },
  },
];