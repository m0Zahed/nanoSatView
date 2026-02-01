import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { LandingPage } from '@/app/components/LandingPage';
import { LoginPage } from '@/app/components/LoginPage';
import { SignUpPage } from '@/app/components/SignUpPage';
import { CompleteProfilePage } from '@/app/components/CompleteProfilePage';
import { Dashboard } from '@/app/components/Dashboard';
import { Documentation } from '@/app/components/Documentation';
import { ViewPage } from '@/app/components/ViewPage';
import { ProtectedRoute } from '@/app/auth/ProtectedRoute';
import { VerifyEmailPage } from '@/app/components/VerifyEmailPage';
import { ForgotPasswordPage } from '@/app/components/ForgotPasswordPage';
import { ResetPasswordPage } from '@/app/components/ResetPasswordPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/complete-profile',
    element: (
      <ProtectedRoute allowIncomplete>
        <CompleteProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/documentation',
    element: (
      <ProtectedRoute>
        <Documentation />
      </ProtectedRoute>
    ),
  },
  {
    path: '/view',
    element: <ViewPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
