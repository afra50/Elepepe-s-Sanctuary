import React from "react";
// Importy stron publicznych
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import RequestSupportPage from "./pages/RequestSupportPage";
import NotFoundPage from "./pages/NotFoundPage";

// Importy Admina
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";

// Import ochrony
import ProtectedRoute from "./components/ProtectedRoute";

const routes = [
  // --- CZĘŚĆ PUBLICZNA ---
  { path: "/", element: <HomePage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/request-support", element: <RequestSupportPage /> },

  // --- LOGOWANIE ADMINA (Dostępne publicznie) ---
  { path: "/admin/login", element: <LoginPage /> },

  // --- PANEL ADMINA (Chroniony) ---
  {
    path: "/admin",
    element: <ProtectedRoute>{<AdminLayout />}</ProtectedRoute>,
    children: [{ index: true, element: <AdminDashboard /> }],
  },

  // --- 404 ---
  { path: "*", element: <NotFoundPage /> },
];

export default routes;
