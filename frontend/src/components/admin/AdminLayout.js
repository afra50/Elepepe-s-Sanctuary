import React from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"; // Dodano useLocation
import { useTranslation } from "react-i18next";
import api from "../../utils/api";
import {
  LayoutDashboard,
  FileText,
  BriefcaseMedical,
  Heart,
  DollarSign,
  CreditCard,
  LogOut,
  Handshake,
  ArrowLeft, // Dodano ikonę
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Potrzebne do sprawdzenia czy jesteśmy na dashboardzie
  const { t } = useTranslation("admin");

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    {
      path: "/admin",
      Icon: LayoutDashboard,
      label: t("menu.dashboard"),
      end: true,
    },
    {
      path: "/admin/requests",
      Icon: FileText,
      label: t("menu.requests"),
    },
    {
      path: "/admin/projects",
      Icon: BriefcaseMedical,
      label: t("menu.projects"),
    },
    {
      path: "/admin/donations",
      Icon: Heart,
      label: t("menu.donations"),
    },
    {
      path: "/admin/internal-support",
      Icon: DollarSign,
      label: t("menu.foundationSupport"),
    },
    {
      path: "/admin/payouts",
      Icon: CreditCard,
      label: t("menu.payouts"),
    },
    {
      path: "/admin/partnerships",
      Icon: Handshake,
      label: t("menu.partnerships"),
    },
  ];

  // Sprawdzamy, czy jesteśmy na głównej stronie admina
  const isDashboard = location.pathname === "/admin";

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <h2>
            Elepepe's Sanctuary <span>Admin</span>
          </h2>
        </div>

        <nav className="admin-sidebar__nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <item.Icon size={20} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar__footer">
          {/* NOWOŚĆ: Przycisk Wstecz na mobile (jeśli nie jesteśmy na dashboardzie) */}
          {!isDashboard && (
            <button
              onClick={() => navigate("/admin")}
              className="mobile-back-btn"
              title="Wróć do Dashboardu"
            >
              <ArrowLeft size={20} className="nav-icon" />
            </button>
          )}

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} className="nav-icon" />
            <span>{t("menu.logout")}</span>
          </button>
        </div>
      </aside>

      {/* GŁÓWNA TREŚĆ */}
      <main className="admin-content">
        <div className="admin-page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
