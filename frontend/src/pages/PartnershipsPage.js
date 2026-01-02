import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import api, { FILES_BASE_URL } from "../utils/api";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";
import Button from "../components/ui/Button";

const mapPartnerToUi = (partner, lang) => {
	const pickByLang = (pl, en, es) => {
		switch (lang) {
			case "pl":
				return pl || en || es || "";
			case "en":
				return en || pl || es || "";
			case "es":
				return es || en || pl || "";
			default:
				return pl || en || es || "";
		}
	};

	return {
		id: partner.id,
		name: pickByLang(partner.namePl, partner.nameEn, partner.nameEs),
		description: pickByLang(
			partner.descriptionPl,
			partner.descriptionEn,
			partner.descriptionEs
		),
		country: pickByLang(
			partner.countryPl,
			partner.countryEn,
			partner.countryEs
		),
		logoUrl: partner.logoPath ? `${FILES_BASE_URL}${partner.logoPath}` : null,
	};
};

function PartnershipsPage() {
	const { t, i18n } = useTranslation("partnerships");
	const lang = i18n.language || "pl";

	const [partners, setPartners] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const fetchPartners = useCallback(() => {
		setLoading(true);
		setError(false);

		api
			.get("/partners")
			.then((res) => {
				const data = res.data || [];
				setPartners(data);
			})
			.catch((err) => {
				console.error("Failed to fetch partners:", err);
				setError(true);
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchPartners();
	}, [fetchPartners]);

	return (
		<main className="page-partners">
			<div className="p-container">
				<header className="p-hero">
					<p className="p-hero_icon">{t("badge")}</p>

					<h1 className="p-hero_title">{t("title")}</h1>

					<p className="p-hero_intro">{t("intro")}</p>
				</header>
			</div>

			{/* ===== LOADING ===== */}
			{loading && (
				<div style={{ padding: "3rem 0" }}>
					<Loader variant="center" size="md" />
				</div>
			)}

			{/* ===== ERROR ===== */}
			{!loading && error && (
				<ErrorState
					title={t("error.title")}
					message={t("error.message")}
					onRetry={fetchPartners}
				/>
			)}

			{/* ===== EMPTY ===== */}
			{!loading && !error && partners.length === 0 && (
				<div className="partners-empty">
					<p>{t("empty")}</p>
				</div>
			)}

			{/* ===== LISTA PARTNERÓW ===== */}
			{!loading && !error && partners.length > 0 && (
				<section className="partners-list">
					<div className="list-container">
						<ul className="full-list">
							{partners.map((partner) => {
								const ui = mapPartnerToUi(partner, lang);

								return (
									<li key={ui.id} className="partner">
										<div className="partners-logo-wrapper">
											{ui.logoUrl ? (
												<img
													className="partners-logo"
													src={ui.logoUrl}
													alt={ui.name}
													loading="lazy"
												/>
											) : (
												<div className="partners-logo placeholder">
													{ui.name?.charAt(0) || "?"}
												</div>
											)}
										</div>

										{/* 👇 TYLKO DOLNA CZĘŚĆ MA PADDING */}
										<div className="partner-body">
											<h3 className="partner-name">{ui.name}</h3>

											<p className="text-container">{ui.description}</p>

											{ui.country && (
												<span className="partner-country">{ui.country}</span>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					</div>
				</section>
			)}
			<section className="invitation">
				<div className="invitation-text">
					<h2>Zostań naszym partnerem</h2>
					<p>
						Fundacja Elepepe's Sanctuary działa na rzecz ratowania, leczenia i
						poprawy jakości życia szczurów. Współpracujemy z osobami oraz
						organizacjami, które podobnie jak my chcą realnie pomagać i wspierać
						nasze działania. Partnerstwo może obejmować m.in. wsparcie akcji
						pomocowych i zbiórek, udział w inicjatywach adopcyjnych, działania
						edukacyjne oraz wspólne projekty na rzecz zwierząt. Zależy nam na
						relacjach opartych na zaufaniu, empatii i wspólnym celu. Jeśli
						chcesz dowiedzieć się więcej o naszej działalności lub widzisz
						przestrzeń do współpracy, zapraszamy do kontaktu poprzez formularz.
						Razem możemy zrobić więcej dla szczurów, które tego potrzebują.
					</p>
				</div>
				<div className="invitation-button">
					<a className="invitation-link" href="/contact">
						<Button variant="primary">Skontaktuj się z nami! </Button>
					</a>
				</div>
			</section>
		</main>
	);
}

export default PartnershipsPage;
