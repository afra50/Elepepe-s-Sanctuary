import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // ZMIANA: Przekazujemy nazwę komponentu (bez < >), a nie wyrenderowany JSX
  // Używamy dużej litery 'Icon', aby React wiedział, że to komponent
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
                  {/* TUTAJ RENDERUJEMY IKONĘ */}
                  <item.Icon size={20} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar__footer">
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
