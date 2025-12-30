function PartnershipsPage() {
	return (
		<main className="page-partners">
			<div className="p-container">
				<header className="p-hero">
					<p className="p-hero_icon">Wasze wsparcie jest bezcenne</p>
					<h1 className="p-hero_title">Nasi partnerzy</h1>
					<p className="p-hero_intro">
						Dzięki Wam i wsparciu naszych partnerów możemy każdego dnia pomagać
						szczurzym podopiecznym. To ludzie i organizacje, które rozumieją,
						jak ważna jest empatia, cierpliwość i odpowiedzialność wobec
						najsłabszych.
					</p>
				</header>
			</div>
			<section className="partners-list">
				<div className="list-container">
					<ul className="full-list">
						<li className="first partner">
							<img
								className="partners-logo"
								src="https://img.redro.pl/obrazy/wektor-fitness-ciala-z-glowa-szczur-twarza-do-logo-retro-emblematy-odznaki-szablonu-etykiety-i-t-shirt-vintage-element-projektu-samodzielnie-na-bialym-tle-400-103457403.jpg"
								alt="animowany szczur pręży muskuły"
							/>
							<p className="text-container">
								Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis
								fugit excepturi libero aspernatur neque voluptatem.
							</p>
						</li>

						<li className="second partner">
							<img
								className="partners-logo"
								src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxRByqI4P7RfCaeb6eGFTM03qD16wRjgqkCg&s"
								alt="animowany szczur robi groźną mine"
							/>
							<p className="text-container">
								Lorem ipsum dolor, sit amet consectetur adipisicing elit. Non,
								corporis? Neque adipisci cumque blanditiis sit?
							</p>
						</li>
						<li className="third partner">
							<img
								className="partners-logo"
								src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoTA68ssYzfvkMiuiCOAEEFvMb8W_UqNMzA&s"
								alt="animowany szczur"
							/>
							<p className="text-container">
								Lorem ipsum dolor, sit amet consectetur adipisicing elit.
								Aliquam quibusdam tempore architecto quam cum ratione?
							</p>
						</li>
						<li className="fourth partner">
							<img
								className="partners-logo"
								src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaB9FxSnsBV-Vyw3QZs3DI9pY5tplc_OH5sQ&s"
								alt="animowany szczur prosi rączkami"
							/>
							<p className="text-container">
								Lorem ipsum, dolor sit amet consectetur adipisicing elit.
								Eveniet dicta error quia provident vero reiciendis.
							</p>
						</li>
					</ul>
				</div>
			</section>
		</main>
	);
}
export default PartnershipsPage;
