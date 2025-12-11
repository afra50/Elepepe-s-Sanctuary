import Banner from "../components/Banner";
function AboutPage() {
	return (
		<main className="page-about">
			<Banner
				image="/about-us-banner.jpg"
				title={"Tytuł"}
				text={"lorem ipsum"}
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
		</main>
	);
}

export default AboutPage;

// 4. Sekcja zobacz komu pomogliśmy + przycisk do /success-stories

// 5. Sekcja więcej o nas z 2 kafelkami - 1 odnośnik na współpraca, 2 odnośnik na kontakt

// Sekcje mogą mieć naprzemienne kolory. Komponent Baner masz zrobiony i jest do wykorzystania
