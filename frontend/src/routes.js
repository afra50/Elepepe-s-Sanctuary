import React from "react";
// Importy stron publicznych
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import RequestSupportPage from "./pages/RequestSupportPage";
import NotFoundPage from "./pages/NotFoundPage";
import ActiveProjectsPage from "./pages/ActiveProjectsPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";

// Importy Admina
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminRequests from "./components/admin/AdminRequests";
import AdminPartnerships from "./components/admin/AdminPartnerships";
import AdminProjects from "./components/admin/AdminProjects";
import AdminProjectDetails from "./components/admin/AdminProjectDetails";
import AdminInternalSupport from "./components/admin/AdminInternalSupport";
import AdminPayouts from "./components/admin/AdminPayouts";

// Import ochrony
import ProtectedRoute from "./components/ProtectedRoute";

const routes = [
  // --- CZĘŚĆ PUBLICZNA ---
  { path: "/", element: <HomePage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/request-support", element: <RequestSupportPage /> },
  { path: "/projects", element: <ActiveProjectsPage /> },
  { path: "/partnerships", element: <PartnershipsPage /> },
  { path: "/projects/:slug", element: <ProjectDetailsPage /> },

  // --- LOGOWANIE ADMINA (Dostępne publicznie) ---
  { path: "/admin/login", element: <LoginPage /> },

  // --- PANEL ADMINA (Chroniony) ---
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "requests", element: <AdminRequests /> },
      { path: "partnerships", element: <AdminPartnerships /> },
      { path: "projects", element: <AdminProjects /> },
      { path: "projects/:id", element: <AdminProjectDetails /> },
      { path: "internal-support", element: <AdminInternalSupport /> },
      { path: "payouts", element: <AdminPayouts /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },

  // --- 404 ---
  { path: "*", element: <NotFoundPage /> },
];

export default routes;
