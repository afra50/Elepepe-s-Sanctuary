import Banner from "../components/Banner";
import Button from "../components/ui/Button";
function AboutPage() {
	return (
		<main className="page-about">
			<Banner
				image="/about-us-banner.jpg"
				title={"Elepepe's Sanctuary"}
				text={"Jesteśmy, by pomagać najmniejszym"}
				ctaLabel={"Dołącz do nas!"}
				ctaLink="/"
			/>
			<section className="first-section">
				<div className="left-side">
					<h2 className="left-title">O nas</h2>
					<div className="about-text">
						<p>
							Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem
							possimus iste ad facilis neque expedita. Ad magni veniam
							cupiditate quos.
						</p>
						<p>
							Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem
							possimus iste ad facilis neque expedita. Ad magni veniam
							cupiditate quos.
						</p>
						<p>
							Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem
							possimus iste ad facilis neque expedita. Ad magni veniam
							cupiditate quos.
						</p>
					</div>
				</div>
				<div
					className="right-side right-img"
					style={{ backgroundImage: "url('/elepepe-photo.jpg')" }}></div>
			</section>

			<section className="second-section">
				<div className="right-side">
					<div className="text-container">
						<h2 className="right-title">
							To nie jest tylko historia. To realna pomoc.
						</h2>
						<div className="right-text">
							<p>
								Od chwili powstania fundacji nasza codzienność to konkretne
								działania: ratowanie, leczenie i opieka nad szczurami, które
								znalazły się w trudnej sytuacji. Trafiają do nas zwierzęta
								chore, porzucone, odebrane z nieodpowiednich warunków lub takie,
								którym nikt wcześniej nie dał szansy. Każdy przypadek to osobna
								historia, inne potrzeby i często długa droga do zdrowia.
								Zapewniamy opiekę weterynaryjną, bezpieczne warunki,
								rehabilitację i gdy to możliwe nowy, odpowiedzialny dom.
								Działamy spokojnie, uważnie i z myślą o dobru zwierząt, a nie o
								statystykach. Efekty tej pracy widać najlepiej w historiach
								szczurów, którym udało się pomóc- tych, którzy odzyskali
								zdrowie, zaufanie i szansę na normalne życie.
							</p>
						</div>
					</div>
					<div
						className="left-img"
						style={{ backgroundImage: "url(/1-sample.jpg)" }}></div>
				</div>
				<Button variant="primary" size="lg" className="succes-stories">
					Nasze sukcesy
				</Button>
			</section>

			<section className="third-section">
				<div className="text-container">
					<h2 className="tile-title"> Więcej o nas </h2>
				</div>
				<div className="titles">
					<a
						href="/partnership"
						className="tile first"
						style={{ backgroundImage: "url(/3-sample.jpg)" }}>
						<span className="text">Partnerzy</span>
					</a>
					<a
						href="/contact"
						className="tile second"
						style={{ backgroundImage: "url(/2-sample.jpg)" }}>
						<span className="text">Kontakt</span>
					</a>
					<a
						href="/partnership"
						className="tile third"
						style={{ backgroundImage: "url(/1-sample.jpg)" }}>
						<span className="text">Nasza grupa</span>
					</a>
				</div>
			</section>
		</main>
	);
}

export default AboutPage;
