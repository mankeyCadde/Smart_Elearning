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
        Enrollment.objects.create(student=self.student, course=self.course)
        
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
