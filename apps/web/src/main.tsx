
import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import StoryDetail from "./pages/StoryDetail";
import ResearcherProfile from "./pages/ResearcherProfile";
import ResearcherNetwork from "./pages/ResearcherNetwork";
import Messages from "./pages/Messages";
import Mentorship from "./pages/Mentorship";
import Communities from "./pages/Communities";
import CredibilityProfile from "./pages/CredibilityProfile";
import "./styles/design-system.css";
import "./styles/notifications.css";
import "./styles/brand-identity.css";

function ProtectedRoute() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return <main><p>Restoring your Citeface session...</p></main>;
  }

  if (error) {
    return (
      <main>
        <h1>Unable to connect to Citeface</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main><p>Loading Citeface...</p></main>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Password recovery routes remain accessible to signed-in users. */}
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route path="/stories/:slug" element={<StoryDetail />} />
          <Route path="/researchers/:username" element={<ResearcherProfile />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/network" element={<ResearcherNetwork />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/mentorship" element={<Mentorship />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/profile/edit" element={<CredibilityProfile />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/drafts/:draftId" element={<Dashboard />} />
          </Route>

          <Route
          path="/"
          element={<Dashboard publicView />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
