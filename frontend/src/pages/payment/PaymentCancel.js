import React from "react";
import { CircleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import { NavLink } from "react-router-dom";

function PaymentCancel() {
	return (
		<div className="last-payment-page">
			<div className="payment-container">
				<CircleAlert className="cancel-icon" />
				<h1 className="last-payment-title">Płatność anulowana</h1>
				<p>
					Płatność została anulowana. Jeśli to nie Ty anulowałeś, skontaktuj się
					z nami.
				</p>
				<div className="buttons-container">
					<NavLink to="/contact">
						<Button variant="primary" size="lg">
							Skontaktuj się z nami
						</Button>
					</NavLink>
					<NavLink to="/">
						<Button variant="secondary" size="lg">
							Wróć do strony głównej
						</Button>
					</NavLink>
				</div>
			</div>
		</div>
	);
}

export default PaymentCancel;
