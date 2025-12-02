import React from "react";
import { NavLink } from "react-router-dom";

function Footer() {
	return (
		<footer className="site-footer">
			<div className="top-footer">
				<div className="footer-column">
					<h4 className="brand-name">Elepepe's Sanctuary</h4>
					<img className="logo" alt="rat's face" src="/logo.jpg"></img>
				</div>
				<div className="footer-column">
					<h4>Information</h4>
					<ul>
						<li className="menu-item">
							<NavLink to="/about">About Us</NavLink>
						</li>
						<li className="menu-item">
							<NavLink to="/partnerships">Partnerships</NavLink>
						</li>
						<li className="menu-item">
							<NavLink to="/contact">Conctact</NavLink>
						</li>
					</ul>
				</div>
				<div className="footer-column">
					<h4>Fundation Info</h4>
					<p>Elepepe's Sanctuary</p>
					<p>NIP</p>
					<p>Adress</p>
					<p>Phone</p>
				</div>
			</div>
			<div className="bottom-footer">
				<p>© 2025 fundacja zebrane. Wszelkie prawa zastrzeżone.</p>
				<a href="/regulamin.pdf" target="_blank">
					Regulamin
				</a>

				<a href="/polityka.pdf" target="_blank">
					Polityka
				</a>
			</div>
		</footer>
	);
}

export default Footer;
