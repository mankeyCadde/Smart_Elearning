import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { Home } from './pages/public/Home';
import { Catalog } from './pages/public/Catalog';
import { CourseDetails } from './pages/public/CourseDetails';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VideoLearning } from './pages/student/VideoLearning';
import { Dashboard as StudentDashboard } from './pages/student/Dashboard';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { InstructorAttendance } from './pages/instructor/InstructorAttendance';
import { Notes as StudentNotes } from './pages/student/Notes';
import { Bookmarks as StudentBookmarks } from './pages/student/Bookmarks';
import { Quiz as StudentQuiz } from './pages/student/Quiz';
import { QuizHistory } from './pages/student/QuizHistory';
import { StudentAssignments } from './pages/student/StudentAssignments';
import { StudentAssignmentDetails } from './pages/student/StudentAssignmentDetails';
import { Profile as StudentProfile } from './pages/student/Profile';
import { Certificates as StudentCertificates } from './pages/student/Certificates';
import { CertificateDetails as StudentCertificateDetails } from './pages/student/CertificateDetails';
import { InstructorAssignments } from './pages/instructor/InstructorAssignments';
import { InstructorSubmissions } from './pages/instructor/InstructorSubmissions';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorProfile } from './pages/instructor/InstructorProfile';
import { CourseEditor } from './pages/instructor/CourseEditor';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { CourseManagement } from './pages/admin/CourseManagement';
import { ReportsDashboard } from './pages/admin/ReportsDashboard';
import { AdminProfile } from './pages/admin/AdminProfile';
import { NotificationProvider } from './context/NotificationContext';
import { Notifications } from './pages/common/Notifications';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/search" element={<PlaceholderPage title="Search Results" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/course/:id" element={<CourseDetails />} />
        </Route>

        {/* Video Learning Route (Full screen, no layout wrapping) */}
        <Route path="/student/course/:id/video" element={<VideoLearning />} />
        
        {/* Quiz Route (Full screen, no layout wrapping) */}
        <Route path="/student/quiz/:id" element={<StudentQuiz />} />

        {/* Student Routes */}
        <Route path="/student" element={<DashboardLayout role="STUDENT" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="courses" element={<StudentDashboard />} />
          <Route path="course/:id" element={<PlaceholderPage title="Course Details (Enrolled)" />} />
          <Route path="course/:id/progress" element={<PlaceholderPage title="Detailed Course Progress" />} />
          <Route path="quizzes/history" element={<QuizHistory />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="assignment/:id" element={<StudentAssignmentDetails />} />
          <Route path="notes" element={<StudentNotes />} />
          <Route path="bookmarks" element={<StudentBookmarks />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="certificates" element={<StudentCertificates />} />
          <Route path="certificate/:id" element={<StudentCertificateDetails />} />
          <Route path="attendance" element={<StudentAttendance />} />
          
          {/* Action Confirmations (Usually modals or toast, but placeholders for now) */}
          <Route path="enrollment-confirmation" element={<PlaceholderPage title="Enrollment Confirmation" />} />
          <Route path="enrollment-successful" element={<PlaceholderPage title="Enrollment Successful" />} />
          <Route path="submit-quiz-confirmation" element={<PlaceholderPage title="Submit Quiz Confirmation" />} />
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor" element={<DashboardLayout role="INSTRUCTOR" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<InstructorDashboard />} />
          <Route path="course/new" element={<CourseEditor />} />
          <Route path="course/:id/edit" element={<CourseEditor />} />
          <Route path="quiz-builder" element={<PlaceholderPage title="Quiz Builder" />} />
          <Route path="assignments" element={<InstructorAssignments />} />
          <Route path="assignment/:id/submissions" element={<InstructorSubmissions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="attendance" element={<InstructorAttendance />} />
          <Route path="profile" element={<InstructorProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout role="ADMIN" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="reports" element={<ReportsDashboard />} />
          <Route path="reports/course/:id" element={<PlaceholderPage title="Detailed Course Report" />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
