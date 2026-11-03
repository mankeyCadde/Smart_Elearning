# Smart Elearning Final Audit and Production Readiness Report

**Project:** Smart Elearning Platform  
**Root:** `/home/abdi/Desktop/smartElearning/Smart_Elearning`  
**Date:** November 3, 2026  
**Report status:** Final audit draft for approval  
**Supersedes:** `AUDIT_REPORT.md` and `VERIFICATION_REPORT.md` (both are stale and contain incorrect “production-ready” conclusions)

---

## 1. Executive Summary

The application is a substantial React/Vite + Django/DRF e-learning platform with student, instructor, and admin roles. It includes course authoring, enrollment, lessons, quizzes, assignments, discussions, notes/bookmarks, attendance, certificates, gamification, messaging, notifications, coupons, and analytics.

The codebase is organized and builds successfully. Django checks, migration checks, backend tests, and the frontend production build pass. Production security configuration is materially better than the stale reports claim: `DEBUG` defaults to false, production `SECRET_KEY` and `ALLOWED_HOSTS` are required, HTTPS redirects/cookies/HSTS are enabled when `DEBUG=False`, WhiteNoise is configured, and `check --deploy` with production-like environment variables reports only `security.W021` (`SECURE_HSTS_PRELOAD`).

However, the application is **not production-ready**. The most serious issues are authorization and business-logic failures, not build failures:

1. **Pending or rejected enrollments grant access to full course content, quizzes, discussions, and notes/bookmarks.** This bypasses the instructor-approval and payment gates.
2. **Paid courses can be enrolled through the free enrollment endpoint without payment.** The checkout page exists but is orphaned; the course-detail UI always requests enrollment regardless of price. The order endpoint is also a mock that marks orders completed without a payment provider.
3. **Password reset is non-functional in production.** Email uses the console backend unconditionally, so reset mail is not delivered and reset links/tokens are emitted into server logs.
4. **Assignment file submissions are not production-safe.** Files use local filesystem storage, media is served only when `DEBUG=True`, Render storage is ephemeral, and if `/media/` is later exposed by a proxy it is unauthenticated. Uploads also have no size or content-type limits.

Additional high-priority issues include missing quiz time-limit and due-date enforcement, known vulnerable backend dependencies, unrestricted instructor self-registration plus arbitrary iframe content, no auth throttling, weak password-reset token invalidation, and assessment grade-integrity gaps.

**Verdict:** **NOT PRODUCTION-READY.** Do not expose this deployment publicly until all P0 findings and the selected P1 findings in this report are fixed and retested.

---

## 2. Scope, Method, and Limitations

### Scope

- Backend Django apps: `users`, `courses`, `learning`, `assessments`, `commerce`, `certificates`, `discussions`, `messaging`, `notifications`, `gamification`, `analytics`, `config`.
- Frontend: routing, authentication, API client, public pages, student pages, instructor pages, admin pages.
- Deployment: `render.yaml`, `netlify.toml`, environment configuration, static/media handling.
- Tests and build: Django tests, migrations, system checks, deployment checks, frontend build/lint, dependency audits.

### Method

- Static source inspection with line-level verification.
- Non-destructive Django checks: `check`, `makemigrations --check --dry-run`, `migrate --check`, `collectstatic --dry-run`.
- Backend test suite execution.
- Frontend production build and lint execution.
- Dependency audit using `npm audit` and `pip-audit`.
- Git and secret-hygiene inspection without printing secret values.

### Limitations

- Full browser E2E was not run because it can mutate the local database; `e2e/run-with-servers.sh` also points to `backend/venv`, which currently has no Django installed.
- No live payment gateway, SMTP provider, S3/object storage, or reverse proxy was available for runtime testing.
- No dynamic penetration test, browser exploit, load test, or fuzzing was performed.
- Findings are based on the code as currently present in the working tree, including uncommitted changes.

### Git state at audit time

Modified:

- `backend/assessments/tests.py`
- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/learning/tests.py`
- `backend/requirements.txt`
- `backend/users/tests.py`
- `backend/users/views.py`
- `package-lock.json`
- `src/App.jsx`
- `src/services/api.js`

Untracked:

- `.nvmrc`
- `AUDIT_REPORT.md`
- `VERIFICATION_REPORT.md`
- `backend/.env.example`
- `backend/.python-version`
- `netlify.toml`
- `render.yaml`

No source files were modified during this audit.

---

## 3. Architecture and Deployment Topology

### Frontend

- React 19.2.8, React Router DOM 7.18.3, Vite 8.2.2.
- Client-side SPA with role-gated route trees.
- Custom API client in `src/services/api.js`.
- JWT access/refresh tokens and cached user profile stored in `localStorage`.
- Production build output in `dist/`; current bundle is approximately 487 kB minified / 123 kB gzip.

### Backend

- Django 6.1.1, DRF 3.18.1, SimpleJWT 5.5.1, PyJWT 2.14.0.
- API under `/api/`; Django admin under `/admin/`.
- SQLite fallback locally; PostgreSQL via `DATABASE_URL`.
- Gunicorn + WhiteNoise for production static files.
- Local filesystem storage for uploaded assignment files.

### Deployment files

- `render.yaml` provisions PostgreSQL, a Django web service, and a static frontend service.
- `netlify.toml` provides an SPA fallback for Netlify.
- `backend/.env.example` documents backend environment variables.
- `.env.example` documents `VITE_API_URL`.

### Main trust boundaries

- Public catalog and course preview.
- Authenticated student enrollment/content/assessment boundary.
- Instructor course-ownership boundary.
- Admin platform-management boundary.
- Uploaded-file storage boundary.
- Password-reset email boundary.
- Third-party dependency boundary.

---

## 4. Production Readiness Verdict

### Verdict: NOT PRODUCTION-READY

**Production-blocking issues:** 4 P0 findings, plus conditional payment/product blockers.

**High-priority issues:** 6 P1 findings.

**Medium/low issues:** Functional, privacy, deployment, and performance issues that should be scheduled but are not all launch blockers.

### What is already good

- `DEBUG` defaults to false.
- Production `SECRET_KEY` and explicit `ALLOWED_HOSTS` are required.
- HTTPS redirect, secure cookies, HSTS, and proxy SSL header are enabled when `DEBUG=False`.
- CORS/CSRF origins are environment-driven.
- WhiteNoise and `collectstatic` are configured.
- JWT refresh rotation and blacklist support are enabled.
- Most instructor/admin endpoints enforce ownership or role checks.
- Public course preview excludes lesson content and video sources.
- Quiz student serializers hide correct answers.
- Reviews require an accepted enrollment.
- Django tests and the frontend build pass.
- No tracked secrets were found in the repository scan.

### What blocks launch

- Enrollment-status authorization bypass.
- Paid-course/payment bypass.
- Broken production password reset and reset-token logging.
- Broken/non-persistent/unrestricted assignment file handling.
- Quiz time-limit and due-date enforcement gaps.
- Known vulnerable backend dependencies.
- Unrestricted instructor self-registration and arbitrary iframe content.
- Missing auth abuse controls.

---

## 5. Critical Findings (P0)

### P0-01: Pending or rejected enrollments grant access to protected course content

**Severity:** Critical  
**Production-blocking:** Yes

**Exact locations:**

- `backend/courses/views.py:159-165` — `CourseContentView.get()` checks only that an `Enrollment` exists.
- `backend/assessments/views.py:53-59` — `_enrolled_quiz_qs()` filters only on `course__enrollments__student`, not `status=ACCEPTED`.
- `backend/assessments/views.py:281-284` — `QuizSubmitView.post()` repeats the status-blind enrollment lookup.
- `backend/assessments/views.py:516-520` — `AssignmentListView.get()` lists assignments for any enrollment status.
- `backend/discussions/views.py:22-45` — `_can_access()` and `_can_post()` accept any enrollment.
- `backend/learning/views.py:324-334` — `NoteListView.post()` accepts any lesson ID without enrollment validation.
- `backend/learning/views.py:389-401` — `BookmarkListView.post()` accepts any lesson ID without enrollment validation.

**Explanation:**  
The application is designed to require instructor approval before a student becomes `ACCEPTED`. Several authorization checks only verify that a row exists in `learning_enrollment`. Because enrollment defaults to `PENDING`, a student can request enrollment and immediately access course content. Rejected students retain the enrollment row and therefore also retain access.

`LessonProgressView` correctly requires `status="ACCEPTED"` at `backend/learning/views.py:204-206`; the inconsistency confirms that the other checks are omissions rather than intended behavior.

**Impact:**

- Pending/rejected students can read full lesson content, including video sources.
- Pending/rejected students can list/detail/start/submit quizzes.
- Pending/rejected students can read and post discussions.
- Pending/rejected students can see assignment titles/descriptions.
- Paid-course gating is defeated when combined with the free enrollment endpoint.
- Notes/bookmarks can reference any lesson, leaking section/course/lesson metadata and creating junk data.

**Fix:**

- Add a single shared helper, for example `accepted_enrollment_or_403(user, course)`.
- Replace every status-blind enrollment check with the helper.
- Permit `PENDING` users to see only the public course-detail page and their enrollment status.
- Deny `REJECTED` users entirely.
- Add tests for pending, accepted, and rejected access to content, quizzes, assignments, discussions, notes, and bookmarks.

**Verification after fix:**  
Create three students with `PENDING`, `ACCEPTED`, and `REJECTED` enrollments. Confirm only `ACCEPTED` can access protected endpoints.

---

### P0-02: Paid courses can be enrolled without payment; checkout is orphaned and mock-completed

**Severity:** Critical if paid courses are a real product feature; conditional otherwise  
**Production-blocking:** Yes, if any course is intended to require payment

**Exact locations:**

- `src/pages/public/CourseDetails.jsx:76-102` — `handleEnrollClick()` always calls `requestEnrollment()` regardless of `course.price`.
- `src/pages/public/CourseDetails.jsx:296-313` — the primary button always says “Request Enrollment”.
- `src/pages/student/EnrollmentConfirm.jsx:31-41` — `confirmEnroll()` always posts to `/enrollments/`.
- `src/pages/student/EnrollmentConfirm.jsx:107` — UI claims paid courses go through checkout, but code does not branch.
- `backend/learning/views.py:72-99` — `EnrollView.post()` creates a `PENDING` enrollment without checking price or payment.
- `backend/commerce/views.py:72-120` — `OrderCreateView.post()` marks an order `COMPLETED` without contacting a payment provider and creates a `PENDING` enrollment.
- `backend/commerce/views.py:113-119` — notification says “You are now enrolled” even though the enrollment is pending.
- `src/pages/student/Checkout.jsx:203` — checkout explicitly says it is a demo and processes no payment.
- `src/App.jsx:96` — `/student/checkout/:id` exists, but no frontend link navigates to it.

**Explanation:**  
There are two competing enrollment paths:

1. Free/pending enrollment through `/enrollments/`.
2. Demo checkout through `/orders/`.

The course-detail page always uses path 1, even for paid courses. The checkout route is reachable only by manually typing the URL. The order endpoint then simulates success and does not charge anything. Because pending enrollment grants content access under P0-01, paid content is effectively free.

**Impact:**

- No revenue enforcement for paid courses.
- Users can create “completed” orders without payment.
- Enrollment records show a price but no money was collected.
- Instructors may accept requests believing payment occurred.
- The UI contradicts the actual behavior, creating support and refund risk.

**Fix:**

- Decide explicitly whether the product supports paid courses.
- For free courses: allow direct acceptance or approval as intended.
- For paid courses:
  - Route the course-detail button to checkout.
  - Create a `PENDING` order first.
  - Integrate a real payment provider/webhook.
  - Mark the order `PAID/COMPLETED` only after verified payment.
  - Create or update the enrollment to `ACCEPTED` only after payment success.
  - Remove mock completion from production code.
- Block `/enrollments/` for paid courses or require an existing paid order.
- Add end-to-end tests for free, paid, coupon, failed payment, refund, and duplicate purchase.

**Verification after fix:**  
A user must not receive accepted enrollment or course content for a paid course without a verified successful payment.

---

### P0-03: Production password reset is undeliverable and exposes reset links in logs

**Severity:** Critical  
**Production-blocking:** Yes

**Exact locations:**

- `backend/config/settings.py:374` — `EMAIL_BACKEND` is hardcoded to `django.core.mail.backends.console.EmailBackend`.
- `backend/users/views.py:145-173` — `ForgotPasswordView.post()` builds a reset link and calls `send_mail()`.
- `backend/users/views.py:176-196` — `ResetPasswordView` validates the token and changes the password.

**Explanation:**  
The console email backend writes the full email body to stdout/server logs instead of delivering it. In production, users will never receive reset emails. The reset link, including uid and token, will be written to server logs where it may be retained, forwarded, or accessed by operators or log aggregators.

**Impact:**

- Account recovery is broken for all users.
- Users cannot regain access after forgetting a password.
- Reset tokens are exposed to log readers.
- Log retention/compliance risk.

**Fix:**

- Configure a real email backend through environment variables: SMTP or a transactional API.
- Add `DEFAULT_FROM_EMAIL` and provider settings.
- Fail deployment if production email is still console-backed.
- Add a test that asserts a production-safe backend is configured.
- Ensure logs never contain reset tokens; scrub existing logs if this was deployed.

**Verification after fix:**  
Trigger forgot-password in staging and confirm delivery, valid link domain, successful reset, and no token in logs.

---

### P0-04: Assignment files are not reliably served, not persistent, and not upload-limited

**Severity:** Critical for assignment functionality and storage availability  
**Production-blocking:** Yes, if file submissions are a launch feature

**Exact locations:**

- `backend/config/urls.py:42-44` — media files are served only when `DEBUG=True`.
- `backend/config/settings.py:227-234` — default storage is `FileSystemStorage`.
- `backend/config/settings.py:240-241` — `MEDIA_ROOT` points to local `backend/media`.
- `backend/assessments/models.py:167-169` — `AssignmentSubmission.file` uses local `upload_to`.
- `backend/assessments/serializers.py:524-526` — `AssignmentSubmitSerializer` accepts any file with no size/type validation.
- `backend/assessments/serializers.py:436-438` — serializer returns `submission.file.url`.
- `src/pages/student/StudentAssignmentDetails.jsx:9-12,224-229` — download URL is built from the API host plus `/media/...`.
- `src/pages/instructor/InstructorSubmissions.jsx:11-14,97-102` — instructor download uses the same `/media/...` path.
- `render.yaml:22-55` — no persistent disk or object storage is configured.

**Explanation:**  
In production, Django does not serve `/media/` because `config/urls.py` only adds the static media route when `DEBUG=True`. The frontend nevertheless constructs a URL such as `https://api.example.com/media/assignment_submissions/file.pdf`. That path will return 404 unless an external proxy/CDN is separately configured. Render’s filesystem is ephemeral, so files can also disappear on redeploy or instance replacement. If a proxy does serve `/media/`, files are public and can be downloaded by anyone who guesses or obtains the URL.

Additionally, there is no maximum upload size or content-type validation. An accepted student can upload arbitrarily large files and exhaust disk or object-storage quota.

**Impact:**

- Students cannot reliably download their own submissions.
- Instructors cannot reliably download files for grading.
- Files can be lost on deploy/restart.
- Uploaded files may be publicly accessible if media is exposed.
- Storage exhaustion and denial-of-service risk.

**Fix:**

- Use S3-compatible object storage, Cloudinary, or another durable media backend.
- Store files privately.
- Serve downloads through an authenticated, permission-checked endpoint or short-lived signed URLs.
- Add file size limits at Django, proxy, and storage layers.
- Validate content type and extension; reject executables and unexpected formats.
- Add tests for student-own-file access, instructor-course-file access, and unauthorized access.
- Configure a persistent disk only if object storage is not possible.

**Verification after fix:**  
Upload as student, download as that student and as course instructor, verify another student gets 403/404, and verify files survive a redeploy.

---

## 6. High Findings (P1)

### P1-01: Quiz time limits and due dates are not enforced server-side

**Severity:** High  
**Production-blocking:** No, but assessment integrity is compromised

**Exact locations:**

- `backend/assessments/views.py:45-50` — `_time_limit_expired()` is defined but never used.
- `backend/assessments/views.py:232-272` — `QuizStartView` checks due date at start.
- `backend/assessments/views.py:275-309` — `QuizSubmitView` does not check time limit or due date.

**Explanation:**  
A student can start a quiz before the due date, keep the in-progress submission open indefinitely, and submit after the due date or after the configured time limit. The helper that would detect expiry exists but is dead code.

**Impact:**

- Timed exams can be completed without time pressure.
- Late submissions are accepted.
- Quiz scores and certificates may be based on invalid attempts.

**Fix:**

- At submit, load the quiz and submission inside a transaction.
- Reject if `dueDate` has passed.
- Reject if `_time_limit_expired(submission)` is true, with a grace period if desired.
- Add an explicit “expired” submission status or auto-finalize behavior.
- Add tests for on-time, late, over-time, and no-time-limit cases.

---

### P1-02: Backend dependencies contain known vulnerabilities

**Severity:** High  
**Production-blocking:** Yes until upgraded and retested

**Exact locations:**

- `backend/requirements.txt:5` — `djangorestframework==3.18.1`
- `backend/requirements.txt:7` — `PyJWT==2.14.0`

**Audit evidence (`pip-audit` against `.venv`):**

- `djangorestframework 3.18.1`
  - `CVE-2026-114138` — Accept-header CPU denial of service.
  - `CVE-2026-114136` — JSON parser codec memory denial of service.
  - `CVE-2026-114137` — `TokenProxy.delete()` is a no-op, so credential revocation may fail.
  - Fix: `3.18.2`.
- `pyjwt 2.14.0`
  - `PYSEC-2026-4141` — recursion DoS during pre-verification payload parsing.
  - `PYSEC-2026-4183`.
  - Fix: `2.15.0`.
- `pip 26.1.2` (environment tool, not application runtime)
  - `PYSEC-2026-3721`; fix `26.2`.

**Impact:**

- Remote denial-of-service against API endpoints.
- Token revocation may not behave as expected.
- Known vulnerability scanners will flag the deployment.

**Fix:**

- Upgrade DRF to `3.18.2`, PyJWT to `2.15.0`, and pip to `26.2`.
- Run `pip check`, Django tests, `check --deploy`, and authentication/enrollment smoke tests.
- Re-run `pip-audit`.
- Add dependency audit to CI.

---

### P1-03: Self-service instructor registration plus arbitrary iframe content

**Severity:** High, policy-dependent  
**Production-blocking:** No, but should be decided before public launch

**Exact locations:**

- `src/pages/auth/Register.jsx` — the registration UI exposes a student/instructor role switch.
- `backend/users/views.py:32-62` — `RegisterView` accepts `?role=instructor` and creates an instructor immediately.
- `backend/courses/views.py:70-87` — any instructor can create a course.
- `backend/courses/serializers.py:168-182` — `CourseCreateUpdateSerializer` allows `published=True`.
- `backend/courses/serializers.py:19-37` — `LessonSerializer` accepts `youtubeId` and `videoUrl`.
- `src/pages/student/VideoLearning.jsx:10-14` — `youtubeEmbed()` returns the raw string when the YouTube regex does not match.
- `src/pages/student/VideoLearning.jsx:172-182` — that raw string is used as an `<iframe src>`.

**Explanation:**  
Instructor registration is intentionally open: any public user can become an instructor without approval, email-domain verification, or admin review. A new instructor can create and publish a course immediately.

Lesson video fields are not restricted to YouTube. `youtubeId` is a free-text field, and `youtubeEmbed()` falls back to using the raw value as the iframe URL. An instructor can therefore embed arbitrary external pages. If a same-origin path is used, the iframe can also frame internal application pages that do not set frame protections.

This report does not claim a confirmed arbitrary JavaScript execution. It does confirm arbitrary content embedding, which enables phishing, misleading course content, clickjacking-style UI deception, and reputational abuse.

**Impact:**

- Anyone can present themselves as an instructor.
- Malicious or low-quality courses can be published without review.
- Arbitrary third-party iframes can be shown inside the learning experience.
- Users may be phished or redirected to untrusted content.

**Fix:**

- Decide whether instructor self-registration is an intended marketplace feature.
- If not, require admin approval before instructor role activation.
- If yes, add instructor verification, course review, reporting, and rate limits.
- Restrict video sources to an allowlist of trusted domains.
- Validate `youtubeId` as an 11-character YouTube ID only.
- Reject non-YouTube `videoUrl` values or render them as a warning/link rather than an iframe.
- Add CSP `frame-src` restrictions for trusted video providers only.

---

### P1-04: JWT storage, no password-reset token revocation, and no CSP

**Severity:** High  
**Production-blocking:** No, but account-security hardening is required before public use

**Exact locations:**

- `src/services/api.js:1-20` — access, refresh, and cached user are stored in `localStorage`.
- `src/services/api.js:62-73` — refresh tokens are rotated and rewritten to `localStorage`.
- `backend/config/settings.py:354-368` — access token lifetime 30 minutes, refresh token lifetime 7 days, rotation and blacklist enabled.
- `backend/users/views.py:176-196` — password reset calls `set_password()` but does not revoke existing refresh tokens.
- `backend/config/settings.py:109-119` — no CSP middleware/header configuration.

**Explanation:**  
Any successful XSS can read both access and refresh tokens from `localStorage`. The application does not currently have a confirmed XSS, but it also has no CSP and embeds iframe content. After a password reset, existing JWTs remain valid because password changes do not invalidate stateless tokens. A stolen refresh token can continue rotating for up to seven days.

**Impact:**

- Token theft gives long-lived account access.
- Password reset does not reliably remove an attacker.
- No defense-in-depth against future script injection.

**Fix:**

- Prefer an httpOnly, Secure, SameSite refresh cookie and keep access tokens in memory.
- Add a per-user token version or password-changed timestamp and reject tokens issued before it.
- On password change/reset, blacklist all outstanding refresh tokens for that user.
- Add CSP with explicit `script-src`, `frame-src`, and `connect-src`.
- Add `Referrer-Policy`, `Permissions-Policy`, and `X-Content-Type-Options` where appropriate.

---

### P1-05: No rate limiting on authentication or messaging

**Severity:** High  
**Production-blocking:** No, but required before public exposure

**Exact locations:**

- `backend/config/settings.py:329-348` — `REST_FRAMEWORK` defines no `DEFAULT_THROTTLE_CLASSES` or rates.
- `backend/users/views.py` — login, registration, forgot-password, and reset-password have no endpoint throttles.
- `backend/messaging/views.py:20-57` — `SendMessageView` accepts any recipient and creates notifications with no rate limit.
- `backend/messaging/serializers.py:83-94` — recipient is any user ID.

**Explanation:**  
There is no protection against credential stuffing, password brute force, registration abuse, forgot-password email flooding, or message spam. Messaging any user also creates notification spam.

**Impact:**

- Account takeover via automated password guessing.
- Email/SMS provider abuse and cost.
- Messaging/notification spam.
- Resource exhaustion.

**Fix:**

- Add DRF throttling for anonymous and authenticated users.
- Add stricter scoped throttles for login, registration, forgot-password, reset-password, and messaging.
- Use a shared cache/Redis backend for throttles in multi-instance deployments.
- Add recipient blocking/reporting and message rate limits.
- Consider CAPTCHA or email verification for registration.

---

### P1-06: Assessment grade-integrity gaps

**Severity:** High  
**Production-blocking:** No, but grading integrity is compromised

**Exact locations:**

- `backend/assessments/views.py:169-188` — `_recompute_score()` does not clamp awarded points.
- `backend/assessments/views.py:459-503` — `InstructorSubmissionGradeView` accepts arbitrary `points` values.
- `backend/assessments/serializers.py:384-387` — `SubmissionGradeSerializer` has no per-item validation.
- `backend/assessments/serializers.py:529-531` — `AssignmentGradeSerializer` has no `min_value`.
- `backend/assessments/views.py:730-742` — assignment grading checks only the upper bound.
- `backend/assessments/views.py:598-608` — resubmission clears grade, feedback, and graded timestamp.
- `backend/assessments/views.py:578-616` — assignment submission has no due-date or closed-state check.

**Explanation:**  
Instructors can assign negative short-answer points or more points than a question is worth. Assignment grades can be negative. Students can resubmit after grading through the API, which erases the existing grade and feedback and requires regrading. Assignments remain open after their due date.

The frontend hides some of these actions, but the API does not enforce them.

**Impact:**

- Scores can fall below 0% or exceed 100%.
- Grades can be unintentionally destroyed by resubmission.
- Late assignments can be submitted.
- Reporting, certificates, and analytics may use invalid scores.

**Fix:**

- Clamp question points to `[0, question.points]`.
- Require assignment grades in `[0, assignment.points]`.
- Define whether resubmission after grading is allowed; if not, reject it server-side.
- Enforce due dates and optional late-submission policy.
- Add tests for negative, over-max, post-deadline, and post-grade resubmission cases.

---

## 7. Medium Findings (P2)

### P2-01: Any instructor can delete any discussion topic they can access

**Severity:** Medium  
**Exact locations:** `backend/discussions/views.py:137-146`  
**Explanation:** `TopicDetailView.delete()` permits any user with `is_instructor`, not just the course instructor.  
**Impact:** An instructor can delete topics in other instructors’ courses if they have any access path. This is especially dangerous when combined with self-registration and pending-enrollment access.  
**Fix:** Require `request.user.is_admin` or `course.instructor_id == request.user.id` or topic author.  
**Production-blocking:** No.

### P2-02: Certificates can be earned by self-reporting lesson completion

**Severity:** Medium  
**Exact locations:**

- `backend/learning/views.py:196-236` — `LessonProgressView` accepts `completed=True` via API.
- `backend/certificates/services.py:22-50` — `course_completed()` and `issue_certificate_if_eligible()` count only `LessonProgress.completed`.
- `backend/certificates/serializers.py:30-47` — public verification returns the student’s full name.

**Explanation:** Any accepted student can mark every lesson complete without watching or reading it, immediately triggering certificate issuance. Certificate verification is public by code and returns personally identifiable information.  
**Impact:** Certificates do not prove learning. Public verification leaks student names to anyone with a code.  
**Fix:** Add completion evidence (watch time, quiz pass, assignment pass, instructor sign-off). Require quizzes/assignments for certificate eligibility. On public verification, show only necessary fields or require a verification secret.  
**Production-blocking:** No.

### P2-03: Leaderboard exposes user email addresses

**Severity:** Medium  
**Exact locations:** `backend/gamification/serializers.py:124-145`  
**Explanation:** `LeaderboardEntrySerializer` includes `email`, and `LeaderboardView` is available to every authenticated user.  
**Impact:** Email harvesting and privacy exposure.  
**Fix:** Remove email from leaderboard output. Use display name/avatar only.  
**Production-blocking:** No.

### P2-04: Notes/bookmarks can be created for arbitrary lessons

**Severity:** Medium  
**Exact locations:** `backend/learning/views.py:324-334`, `backend/learning/views.py:389-401`  
**Explanation:** Note and bookmark creation loads a `Lesson` by ID without checking acceptable enrollment. Serializers then expose lesson, section, and course titles.  
**Impact:** Authenticated users can enumerate lesson metadata across the platform and create junk records.  
**Fix:** Require an accepted enrollment in the lesson’s course. Return 404/403 otherwise.  
**Production-blocking:** No.

### P2-05: Admin/instructor endpoint and staff-state inconsistencies

**Severity:** Medium/Low  
**Exact locations:**

- `backend/courses/views.py:78-84` — `InstructorCourseListView` filters `instructor=request.user` even for admins.
- `backend/courses/views.py:98-99` — `InstructorCourseDetailView` same.
- `backend/users/models.py:75-78` — `User.save()` sets `is_staff=True` for admins but never unsets it on demotion.
- `backend/analytics/views.py:416` — `AdminActivityView` calls `int()` without validation.

**Explanation:** Admin users can access instructor endpoints by permission but receive empty/404 responses because the querysets are still instructor-scoped. Demoting an admin leaves `is_staff=True`. A non-numeric `limit` query parameter raises an unhandled `ValueError`.  
**Impact:** Broken admin workflows, stale staff access, and avoidable 500 errors.  
**Fix:** Use admin-aware querysets consistently. Explicitly synchronize `is_staff` with role. Validate/parse `limit` with a serializer or safe helper.  
**Production-blocking:** No.

### P2-06: Dashboard and analytics queries are N+1-heavy

**Severity:** Medium (performance/scalability)  
**Exact locations:**

- `backend/analytics/views.py:80-120` — per-enrollment lesson counts, quiz submissions, attendance, section counts.
- `backend/analytics/views.py:189-246` — per-course enrollment lists, per-enrollment progress, per-course quiz/attendance queries.
- `backend/analytics/views.py:290-321` — per-student quiz, attendance, and last-activity queries.
- `backend/messaging/views.py:65-96` — loads all messages for all conversations into Python.

**Impact:** Large courses or busy users cause many database queries and slow dashboards.  
**Fix:** Use aggregate/annotate queries, prefetch related objects, paginate, and compute conversation previews/unread counts in SQL. Add query-count tests.  
**Production-blocking:** No.

### P2-07: Production silently falls back to SQLite if `DATABASE_URL` is missing

**Severity:** Medium (deployment)  
**Exact locations:** `backend/config/settings.py:148-168`  
**Explanation:** Production startup requires `SECRET_KEY` and `ALLOWED_HOSTS` but does not require `DATABASE_URL`. A misconfigured deploy can start on local, ephemeral SQLite.  
**Impact:** Data loss on restart/redeploy, weak multi-instance behavior, and difficult recovery.  
**Fix:** When `DEBUG=False`, require `DATABASE_URL` or explicitly opt into SQLite. Add a startup check and deployment documentation.  
**Production-blocking:** No, but strongly recommended before production.

### P2-08: Frontend API fallback breaks silently on misconfigured static hosting

**Severity:** Medium (deployment)  
**Exact locations:**

- `src/services/api.js:1-2` — production fallback is `/api`.
- `netlify.toml:9-12` — all unknown paths rewrite to `index.html`.
- `render.yaml:67-68` — Render sets `VITE_API_URL`, but Netlify does not define it in this file.

**Explanation:** If `VITE_API_URL` is missing during a Netlify build, API requests go to `https://frontend.example/api/...`. The SPA fallback returns `index.html` with HTTP 200, so the client tries to parse HTML as JSON and fails in confusing ways.  
**Impact:** A deployment with one missing environment variable appears “up” but has no working API.  
**Fix:** Fail the production build if `VITE_API_URL` is missing or not an absolute URL. Add a runtime health/config check. Avoid the `/api` fallback in production.  
**Production-blocking:** No, but it is a deployment trap.

### P2-09: Coupon usage count is race-prone

**Severity:** Medium/Low  
**Exact locations:** `backend/commerce/views.py:90-96`  
**Explanation:** `coupon.usedCount += 1; coupon.save()` is not protected by `select_for_update()` or a conditional update. Concurrent checkouts can exceed `maxUses`.  
**Impact:** Coupon overuse and revenue leakage.  
**Fix:** Lock the coupon row in the transaction or use an atomic conditional `F()` update with a `usedCount < maxUses` check.  
**Production-blocking:** No.

### P2-10: Any authenticated user can message any other user

**Severity:** Medium/Low  
**Exact locations:** `backend/messaging/serializers.py:83-94`, `backend/messaging/views.py:20-57`  
**Explanation:** `recipientId` accepts any user ID; there is no block list, relationship check, or rate limit.  
**Impact:** Harassment and spam, especially if user IDs are enumerable.  
**Fix:** Add block/report features, restrict messaging to course relationships or explicit connections, and add throttles.  
**Production-blocking:** No.

### P2-11: Profile email changes are not re-verified

**Severity:** Low/Medium  
**Exact locations:** `backend/users/serializers.py:158-176`  
**Explanation:** A user can change their login email without proving ownership of the new address. Uniqueness is checked, but ownership is not.  
**Impact:** Mistyped emails can lock users out; an attacker with a session can change the email and then use password reset on a controlled address.  
**Fix:** Send a verification link to the new address and require confirmation before changing the login identifier.  
**Production-blocking:** No.

### P2-12: Missing CSP and other browser hardening headers

**Severity:** Medium (defense in depth)  
**Exact locations:** `backend/config/settings.py:109-119` (middleware) and absence of CSP configuration.  
**Explanation:** No Content-Security-Policy is set. `X_FRAME_OPTIONS` defaults to `DENY` for Django responses, but the SPA/API hosting layer may not set equivalent headers.  
**Impact:** If an injection is found later, CSP will not limit script execution or frame sources.  
**Fix:** Add CSP with a nonce/hash strategy, `frame-src` allowlist, `object-src 'none'`, and `base-uri 'self'`. Add `Referrer-Policy` and `Permissions-Policy`.  
**Production-blocking:** No.

---

## 8. Low Findings (P3)

### P3-01: `AdminActivityView` crashes on invalid `limit`

**Exact location:** `backend/analytics/views.py:416`  
**Issue:** `int(request.query_params.get("limit", 10))` raises `ValueError` for non-numeric input.  
**Fix:** Use a serializer or try/except and clamp to a valid range.

### P3-02: Home category count uses the wrong field name

**Exact location:** `src/pages/public/Home.jsx:109` uses `category._courses_count`.  
**Issue:** `CategorySerializer` exposes `coursesCount` (`backend/courses/serializers.py:8-16`). The home page therefore renders `undefined Courses`.  
**Fix:** Use `category.coursesCount`.

### P3-03: Public enrollment counts include pending/rejected enrollments

**Exact locations:** `backend/courses/views.py:123-129`, `backend/courses/views.py:135-140`, `backend/learning/views.py:36-51`.  
**Issue:** `_enrolled_count` and dashboard counts include all statuses.  
**Impact:** Inflated student counts and inaccurate analytics.  
**Fix:** Count only `status=ACCEPTED` where the metric means “students.”

### P3-04: E2E runner points at an empty virtualenv

**Exact location:** `e2e/run-with-servers.sh:18` uses `backend/venv/bin/python`.  
**Evidence:** `backend/venv/bin/python` exists but `import django` fails; `backend/.venv` is the working environment.  
**Impact:** `npm run test:e2e:all` cannot start the backend.  
**Fix:** Use `backend/.venv/bin/python` or make the runner detect a working venv.

### P3-05: HSTS preload is disabled

**Exact location:** `backend/config/settings.py:311` and deployment check `security.W021`.  
**Issue:** HSTS is enabled for one year with subdomains, but preload is false.  
**Impact:** Browsers are not eligible for the preload list. This is a hardening gap, not a blocker.  
**Fix:** Enable only after confirming all subdomains are HTTPS-only and the domain is ready for preload.

### P3-06: No structured logging or monitoring configuration

**Exact location:** `backend/config/settings.py` has no `LOGGING` configuration.  
**Impact:** Production errors are harder to detect and correlate; security events are not centrally recorded.  
**Fix:** Add structured JSON logging, request IDs, error tracking, and alerting. Ensure secrets/tokens are redacted.

### P3-07: Test coverage is thin relative to the authorization surface

**Exact locations:** `backend/users/tests.py`, `backend/learning/tests.py`, `backend/assessments/tests.py`.  
**Evidence:** 15 tests total; no tests for enrollment-status bypass, quiz time limits, file authorization, certificates, commerce, discussions, messaging, or gamification.  
**Impact:** Regressions in critical authorization logic are likely to go unnoticed.  
**Fix:** Add API-level tests for every role/status boundary and every critical business flow.

---

## 9. Positive Controls and What Works

- Production defaults are safer than the stale audit claimed: `DEBUG` defaults false; missing production secret/hosts raise `ImproperlyConfigured` (`backend/config/settings.py:46-69`).
- HTTPS redirect, secure session/CSRF cookies, HSTS, and proxy SSL header are enabled when `DEBUG=False` (`backend/config/settings.py:300-323`).
- CORS and CSRF origins are explicit and environment-driven (`backend/config/settings.py:262-275`).
- WhiteNoise and compressed manifest static storage are configured (`backend/config/settings.py:227-234`).
- JWT access tokens are short-lived (30 minutes) and refresh rotation/blacklist is enabled (`backend/config/settings.py:354-368`).
- Logout blacklists the provided refresh token (`backend/users/views.py:88-101`).
- Public course detail returns only lesson preview metadata, not content or video sources (`backend/courses/serializers.py:97-117`).
- Student quiz serializers hide correct answers (`backend/assessments/serializers.py:20-89`).
- Reviews require an accepted enrollment (`backend/courses/views.py:314-317`).
- Lesson progress and attendance correctly require accepted enrollment (`backend/learning/views.py:204-206`, `backend/learning/views.py:245-251`).
- Most instructor endpoints enforce course ownership, and most admin endpoints enforce `IsAdmin`.
- Quiz question editing is blocked after submissions exist (`backend/assessments/serializers.py:291-300`).
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, or `document.write` usage was found in `src`.
- Backend secrets are environment-driven; `backend/.env` is ignored; no tracked `.env` was found.
- Frontend production dependencies audit clean.
- The app builds and the backend test suite passes.

---

## 10. Verification Evidence

### Backend checks

- `./.venv/bin/python manage.py check` — PASS, no issues.
- `./.venv/bin/python manage.py makemigrations --check --dry-run` — PASS, `No changes detected`.
- `./.venv/bin/python manage.py migrate --check` — PASS, exit status 0.
- `./.venv/bin/python manage.py collectstatic --noinput --dry-run` — PASS, `0 static files copied, 157 unmodified`.
- `./.venv/bin/python -m pip check` — PASS, `No broken requirements found`.
- `./.venv/bin/python manage.py test` — PASS, `Ran 15 tests in 55.288s`, `OK`.

### Deployment check

- With production-like environment:
  - `DJANGO_DEBUG=False`
  - valid long `DJANGO_SECRET_KEY`
  - explicit `DJANGO_ALLOWED_HOSTS`
  - explicit CORS/CSRF/frontend origins
- Result: only `security.W021` — `SECURE_HSTS_PRELOAD` is not true.
- Bare local environment without production variables produces six expected development warnings, including `DEBUG=True`, insecure secret, no SSL redirect, no HSTS, and insecure cookies. These do not represent the production configuration.

### Frontend checks

- `npm run build` — PASS, `1923 modules transformed`.
- Main bundle: `dist/assets/index-CQTqACiW.js` — `486.97 kB`, gzip `122.86 kB`.
- `npm run lint` (`oxlint`) — warnings only, including:
  - `src/context/NotificationContext.jsx:76:14`
  - `src/context/NotificationContext.jsx:46:7`
  - `src/context/AuthContext.jsx:91:14`
  - `src/pages/student/EnrollmentConfirm.jsx:20:7`

### Dependency audits

- `npm audit` — 5 high-severity development vulnerabilities:
  - `vite` 8.2.0–8.2.2
  - `zod <4.6.6` via `chromium-bidi`/`puppeteer`
- `npm audit --omit=dev` — `found 0 vulnerabilities` in production dependencies.
- `pip-audit` against `.venv` — 7 vulnerabilities in 3 packages:
  - `djangorestframework 3.18.1` (3 CVEs)
  - `pyjwt 2.14.0` (2 PYSEC IDs)
  - `pip 26.1.2` (1 PYSEC ID)
- `npm outdated` — newer `@types/react`, `@types/react-dom`, and `@vitejs/plugin-react` available.

### Not executed

- Full E2E browser suite: deferred to avoid local DB mutation; runner currently points at a non-working venv.
- Live SMTP/password-reset delivery.
- Live payment provider flow.
- Object storage/media download in production.
- Load/performance testing.
- Dynamic security scanning or penetration testing.

---

## 11. Remediation Plan and Deployment Checklist

### Phase 0: Freeze and protect

- Do not deploy publicly or announce production readiness until P0 is fixed.
- Preserve a database backup before any migration or data cleanup.
- Rotate any production secrets that may have been exposed during testing.
- Treat existing console logs as potentially containing password-reset tokens.

### Phase 1: P0 blockers

1. **Fix enrollment authorization**
   - Add a shared `accepted_enrollment_or_403` helper.
   - Apply it to course content, quizzes, assignments, discussions, notes, and bookmarks.
   - Add status-matrix tests for pending, accepted, rejected, instructor owner, and admin.

2. **Fix paid-course flow**
   - Decide free vs paid behavior.
   - Route paid courses to checkout.
   - Remove mock order completion from production.
   - Integrate a real payment provider and webhook.
   - Create accepted enrollment only after verified payment.
   - Block free `/enrollments/` for paid courses.
   - Test free, paid, coupon, failed, duplicate, and refunded flows.

3. **Fix email and password reset**
   - Configure SMTP/transactional email via environment.
   - Add `DEFAULT_FROM_EMAIL`.
   - Add a production guard against console email.
   - Verify delivery and token redaction.
   - Invalidate outstanding refresh tokens on password reset.

4. **Fix assignment file handling**
   - Move media to durable private object storage.
   - Add authenticated or signed download endpoints.
   - Add size and content-type limits.
   - Verify student/instructor/unauthorized access.
   - Verify persistence across redeploy.

### Phase 2: P1 hardening

1. Enforce quiz time limits and due dates at submit.
2. Enforce assignment due dates, grade bounds, and resubmission policy.
3. Upgrade DRF, PyJWT, and pip; rerun all tests and audits.
4. Add auth, registration, reset, and messaging throttles.
5. Add CSP and browser security headers.
6. Decide instructor vetting and restrict iframe sources to an allowlist.
7. Add token invalidation on password change/reset.
8. Add dependency and security checks to CI.

### Phase 3: P2/P3 cleanup

1. Fix discussion deletion authorization.
2. Fix certificate eligibility evidence and public verification privacy.
3. Remove emails from leaderboard.
4. Add enrollment checks to notes/bookmarks.
5. Fix admin/instructor endpoint consistency and staff-state synchronization.
6. Optimize dashboard N+1 queries.
7. Require `DATABASE_URL` in production.
8. Fail frontend production builds when `VITE_API_URL` is missing.
9. Fix coupon race with row locking/atomic update.
10. Fix home category count, E2E venv path, `AdminActivityView` parsing, and HSTS decisions.
11. Add structured logging, monitoring, alerting, and error tracking.
12. Expand backend tests and run E2E against a disposable database.

### Deployment checklist

Before deploy:

- [ ] All P0 findings fixed and retested.
- [ ] Payment flow verified or paid courses disabled.
- [ ] SMTP/transactional email verified.
- [ ] Object storage and authenticated downloads verified.
- [ ] `DATABASE_URL` required and PostgreSQL provisioned.
- [ ] Production dependencies upgraded and audited.
- [ ] `VITE_API_URL` set to the absolute production API URL.
- [ ] CORS, CSRF, allowed hosts, and frontend base URL match the real domains.
- [ ] Auth throttles enabled.
- [ ] CSP/security headers configured.
- [ ] Database backup and rollback plan prepared.
- [ ] Logs configured with token/secret redaction.

After deploy:

- [ ] Health endpoint returns 200.
- [ ] Register/login/logout/refresh work.
- [ ] Free enrollment approval flow works.
- [ ] Paid checkout works or is disabled.
- [ ] Pending/rejected users cannot access content.
- [ ] Student/instructor media download authorization works.
- [ ] Password reset email arrives and resets the account.
- [ ] Quizzes enforce due date and time limit.
- [ ] Assignment upload/download survives a redeploy.
- [ ] Admin and instructor dashboards load without 500s.
- [ ] Dependency and security scans are clean enough to document.
- [ ] Monitor 4xx/5xx, auth failures, and storage usage.

---

## 12. Residual Risks and Sign-Off

### Residual risks after the recommended fixes

- Payment-provider integration, email delivery, and object storage must be validated in staging; static analysis cannot prove them.
- Browser-level XSS/clickjacking behavior was not dynamically tested.
- No load testing was performed; N+1 issues may still appear under real traffic.
- No fuzzing or dynamic application security testing was performed.
- The local SQLite database was not migrated or inspected for sensitive data beyond metadata.
- The existing `AUDIT_REPORT.md` and `VERIFICATION_REPORT.md` should be removed or clearly marked superseded to prevent teams from following their stale “ready” conclusions.
- The working tree contains uncommitted changes that must be reviewed and committed intentionally before deployment.

### Sign-off

**Audit conclusion:** The project is structurally sound and has several good security controls, but it is **not approved for production deployment** in its current state.

**Minimum launch gate:** Resolve P0-01 through P0-04, P1-01, P1-02, and the payment/product decision in P0-02. Then complete the Phase 1 and Phase 2 verification checklist.

**No source code was changed during this audit.**
