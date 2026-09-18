import {
  login, goto, assertPageHas, assertNoFatalErrors, DEMO, waitFor,
} from './helpers.js';

export const suite = 'student';

export const tests = [
  {
    name: 'dashboard shows enrolled courses and stats',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await assertPageHas(page, 'My Courses');
      await assertPageHas(page, 'Complete Python Bootcamp');
      assertNoFatalErrors(page, 'student-dashboard');
    },
  },
  {
    name: 'enrolled course page loads curriculum with lesson progress',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/course/1');
      await assertPageHas(page, 'Complete Python Bootcamp');
      await assertPageHas(page, 'Continue Learning');
      await assertPageHas(page, 'Detailed Progress');
      assertNoFatalErrors(page, 'enrolled-course');
    },
  },
  {
    name: 'video learning page opens a lesson',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/course/1/video');
      await waitFor(page, () => page.url().includes('/video'), { label: 'video url' });
      await assertPageHas(page, 'Complete Python Bootcamp');
      assertNoFatalErrors(page, 'video-learning');
    },
  },
  {
    name: 'course progress page shows completion breakdown',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/course/1/progress');
      await assertPageHas(page, 'Course Progress');
      await assertPageHas(page, 'By Section');
      assertNoFatalErrors(page, 'course-progress');
    },
  },
  {
    name: 'quiz history page shows past submissions',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/quizzes/history');
      await assertPageHas(page, 'Quiz History');
      assertNoFatalErrors(page, 'quiz-history');
    },
  },
  {
    name: 'certificates page lists issued certificates',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/certificates');
      await assertPageHas(page, 'My Certificates');
      assertNoFatalErrors(page, 'certificates');
    },
  },
  {
    name: 'enrollment confirmation page loads course summary',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/enrollment-confirmation?courseId=2');
      await assertPageHas(page, 'Confirm Enrollment');
      await assertPageHas(page, 'Confirm & Enroll');
      assertNoFatalErrors(page, 'enrollment-confirm');
    },
  },
  {
    name: 'assignments page lists course assignments',
    run: async (page) => {
      await login(page, DEMO.student.email, DEMO.student.password);
      await goto(page, '/student/assignments');
      await waitFor(page, () => page.url().includes('/assignments'), { label: 'assignments url' });
      assertNoFatalErrors(page, 'student-assignments');
    },
  },
];