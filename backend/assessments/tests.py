import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User
from courses.models import Course
from assessments.models import Quiz, Question, AnswerOption, Submission, Assignment, AssignmentSubmission
from learning.models import Enrollment

class AssessmentsTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email="student@test.com", password="P@ssword1234!", role="STUDENT")
        self.instructor = User.objects.create_user(email="instructor@test.com", password="P@ssword1234!", role="INSTRUCTOR")
        
        self.course = Course.objects.create(title="Test Course", instructor=self.instructor, published=True)
        Enrollment.objects.create(
            student=self.student,
            course=self.course,
            status=Enrollment.Status.ACCEPTED,
        )
        
        self.quiz = Quiz.objects.create(course=self.course, title="Test Quiz", published=True)
        self.question = Question.objects.create(quiz=self.quiz, text="Q1", questionType="MC", points=10)
        self.option = AnswerOption.objects.create(question=self.question, text="A1", isCorrect=True)
        
        self.assignment = Assignment.objects.create(course=self.course, title="Test Assignment", published=True, points=100)

    def test_quiz_submit(self):
        """Test submitting a quiz."""
        self.client.force_authenticate(user=self.student)
        
        # Start quiz
        start_url = reverse("assessments:quiz-start", args=[self.quiz.id])
        start_res = self.client.post(start_url)
        self.assertEqual(start_res.status_code, status.HTTP_201_CREATED)
        
        # Submit quiz
        submit_url = reverse("assessments:quiz-submit", args=[self.quiz.id])
        data = {
            "answers": [
                {"questionId": self.question.id, "optionId": self.option.id}
            ]
        }
        res = self.client.post(submit_url, data, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        submission = Submission.objects.get(quiz=self.quiz, student=self.student)
        self.assertEqual(submission.score, 100)

    def test_assignment_submit_and_grade(self):
        """Test a student submitting an assignment and an instructor grading it."""
        # Submit assignment
        self.client.force_authenticate(user=self.student)
        submit_url = reverse("assessments:assignment-detail", args=[self.assignment.id])
        res = self.client.post(submit_url, {"content": "Here is my work"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        submission = AssignmentSubmission.objects.get(assignment=self.assignment, student=self.student)
        self.assertEqual(submission.content, "Here is my work")
        
        # Grade assignment
        self.client.force_authenticate(user=self.instructor)
        grade_url = reverse("assessments_instructor:instructor-assignment-grade", args=[submission.id])
        grade_res = self.client.post(grade_url, {"grade": 95, "feedback": "Great job"}, format="json")
        self.assertEqual(grade_res.status_code, status.HTTP_200_OK)
        
        submission.refresh_from_db()
        self.assertEqual(submission.grade, 95)


class AssessmentEnrollmentAccessTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="owner@test.com",
            password="P@ssword1234!",
            role="INSTRUCTOR",
        )
        self.pending = User.objects.create_user(
            email="pending@test.com", password="P@ssword1234!"
        )
        self.accepted = User.objects.create_user(
            email="accepted@test.com", password="P@ssword1234!"
        )
        self.rejected = User.objects.create_user(
            email="rejected@test.com", password="P@ssword1234!"
        )
        self.course = Course.objects.create(
            title="Assessment Access",
            instructor=self.instructor,
            published=True,
        )
        Enrollment.objects.create(
            student=self.pending,
            course=self.course,
            status=Enrollment.Status.PENDING,
        )
        Enrollment.objects.create(
            student=self.accepted,
            course=self.course,
            status=Enrollment.Status.ACCEPTED,
        )
        Enrollment.objects.create(
            student=self.rejected,
            course=self.course,
            status=Enrollment.Status.REJECTED,
        )
        self.quiz = Quiz.objects.create(
            course=self.course, title="Access Quiz", published=True
        )
        self.question = Question.objects.create(
            quiz=self.quiz, text="Q1", questionType="MC", points=10
        )
        self.option = AnswerOption.objects.create(
            question=self.question, text="A1", isCorrect=True
        )
        self.assignment = Assignment.objects.create(
            course=self.course,
            title="Access Assignment",
            published=True,
            points=100,
        )

    def test_quiz_endpoints_require_accepted_enrollment(self):
        list_url = reverse("assessments:quiz-list")
        detail_url = reverse("assessments:quiz-detail", args=[self.quiz.id])
        start_url = reverse("assessments:quiz-start", args=[self.quiz.id])

        for user in (self.pending, self.rejected):
            self.client.force_authenticate(user=user)
            self.assertEqual(
                self.client.get(list_url).data, []
            )
            self.assertEqual(
                self.client.get(detail_url).status_code,
                status.HTTP_403_FORBIDDEN,
            )
            self.assertEqual(
                self.client.post(start_url).status_code,
                status.HTTP_403_FORBIDDEN,
            )

        self.client.force_authenticate(user=self.accepted)
        self.assertEqual(
            len(self.client.get(list_url).data), 1
        )
        self.assertEqual(
            self.client.get(detail_url).status_code, status.HTTP_200_OK
        )
        self.assertEqual(
            self.client.post(start_url).status_code,
            status.HTTP_201_CREATED,
        )

    def test_quiz_submit_requires_accepted_enrollment(self):
        submit_url = reverse(
            "assessments:quiz-submit", args=[self.quiz.id]
        )
        payload = {
            "answers": [
                {
                    "questionId": self.question.id,
                    "optionId": self.option.id,
                }
            ]
        }
        for user in (self.pending, self.rejected):
            Submission.objects.create(
                student=user,
                quiz=self.quiz,
                status=Submission.Status.IN_PROGRESS,
            )
            self.client.force_authenticate(user=user)
            response = self.client.post(
                submit_url, payload, format="json"
            )
            self.assertEqual(
                response.status_code, status.HTTP_403_FORBIDDEN
            )

    def test_assignment_access_requires_accepted_enrollment(self):
        list_url = reverse("assessments:assignment-list")
        detail_url = reverse(
            "assessments:assignment-detail", args=[self.assignment.id]
        )

        for user in (self.pending, self.rejected):
            self.client.force_authenticate(user=user)
            self.assertEqual(self.client.get(list_url).data, [])
            self.assertEqual(
                self.client.get(detail_url).status_code,
                status.HTTP_403_FORBIDDEN,
            )

        self.client.force_authenticate(user=self.accepted)
        self.assertEqual(len(self.client.get(list_url).data), 1)
        self.assertEqual(
            self.client.get(detail_url).status_code, status.HTTP_200_OK
        )


class AssignmentFileAccessTests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._media_dir = tempfile.TemporaryDirectory()
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_dir.name)
        cls._media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._media_override.disable()
        cls._media_dir.cleanup()
        super().tearDownClass()

    def setUp(self):
        self.instructor = User.objects.create_user(
            email="file-owner@test.com",
            password="P@ssword1234!",
            role="INSTRUCTOR",
        )
        self.owner = User.objects.create_user(
            email="file-student@test.com", password="P@ssword1234!"
        )
        self.other = User.objects.create_user(
            email="file-other@test.com", password="P@ssword1234!"
        )
        self.admin = User.objects.create_superuser(
            email="file-admin@test.com", password="P@ssword1234!"
        )
        self.course = Course.objects.create(
            title="File Course",
            instructor=self.instructor,
            published=True,
        )
        for user in (self.owner, self.other):
            Enrollment.objects.create(
                student=user,
                course=self.course,
                status=Enrollment.Status.ACCEPTED,
            )
        self.assignment = Assignment.objects.create(
            course=self.course,
            title="File Assignment",
            published=True,
            points=100,
        )
        self.submit_url = reverse(
            "assessments:assignment-detail", args=[self.assignment.id]
        )

    def _submit(self, name="work.pdf", content=b"%PDF-1.4 test"):
        self.client.force_authenticate(user=self.owner)
        return self.client.post(
            self.submit_url,
            {
                "file": SimpleUploadedFile(
                    name, content, content_type="application/pdf"
                )
            },
            format="multipart",
        )

    def test_upload_rejects_disallowed_extension_and_oversized_file(self):
        response = self._submit(
            name="malware.exe", content=b"not really an executable"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        with self.settings(ASSIGNMENT_MAX_UPLOAD_BYTES=5):
            response = self._submit(
                name="large.txt", content=b"more than five bytes"
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_download_requires_owner_instructor_or_admin(self):
        response = self._submit()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("/media/", response.data["file"])
        self.assertEqual(
            response.data["file"],
            f"/assignment-submissions/{response.data['id']}/file/",
        )
        submission_id = response.data["id"]

        url = reverse(
            "assessments:assignment-submission-file",
            args=[submission_id],
        )
        self.client.force_authenticate(user=self.owner)
        owner_response = self.client.get(url)
        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            b"".join(owner_response.streaming_content), b"%PDF-1.4 test"
        )

        self.client.force_authenticate(user=self.other)
        self.assertEqual(
            self.client.get(url).status_code, status.HTTP_403_FORBIDDEN
        )

        self.client.force_authenticate(user=self.instructor)
        self.assertEqual(
            self.client.get(url).status_code, status.HTTP_200_OK
        )

        self.client.force_authenticate(user=self.admin)
        self.assertEqual(
            self.client.get(url).status_code, status.HTTP_200_OK
        )
