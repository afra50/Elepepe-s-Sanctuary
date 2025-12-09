import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  BriefcaseMedical,
  Heart,
  DollarSign,
  CreditCard,
  Handshake,
} from "lucide-react";

const AdminDashboard = () => {
  const { t } = useTranslation("admin");

  // Konfiguracja kart nawigacyjnych z opisami
  const sections = [
    {
      id: "requests",
      title: t("menu.requests"),
      desc: t("dashboard.requestsDesc"), // Opis zgłoszeń
      icon: <FileText className="card-icon" />,
      link: "/admin/requests",
    },
    {
      id: "projects",
      title: t("menu.projects"),
      desc: t("dashboard.projectsDesc"), // Opis zbiórek
      icon: <BriefcaseMedical className="card-icon" />,
      link: "/admin/projects",
    },
    {
      id: "donations",
      title: t("menu.donations"),
      desc: t("dashboard.donationsDesc"), // Opis darowizn
      icon: <Heart className="card-icon" />,
      link: "/admin/donations",
    },
    {
      id: "internal",
      title: t("menu.foundationSupport"),
      desc: t("dashboard.foundationSupportDesc"), // Opis wpłat własnych
      icon: <DollarSign className="card-icon" />,
      link: "/admin/internal-support",
    },
    {
      id: "payouts",
      title: t("menu.payouts"),
      desc: t("dashboard.payoutsDesc"), // Opis wypłat
      icon: <CreditCard className="card-icon" />,
      link: "/admin/payouts",
    },
    {
      id: "partnerships",
      title: t("menu.partnerships"),
      desc: t("dashboard.partnershipsDesc"),
      icon: <Handshake className="card-icon" />,
      link: "/admin/partnerships",
    },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-intro">
        <h1 className="page-title">{t("dashboard.title")}</h1>
        <p className="page-subtitle">{t("dashboard.subtitle")}</p>
      </header>

      {/* Grid z opisami zakładek */}
      <div className="description-grid">
        {sections.map((section) => (
          <Link to={section.link} key={section.id} className="description-card">
            <div className="card-header">
              <div className="icon-wrapper">{section.icon}</div>
              <h2 className="card-title">{section.title}</h2>
            </div>
            <p className="card-text">{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
