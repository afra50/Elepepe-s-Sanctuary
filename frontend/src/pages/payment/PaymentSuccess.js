import React from "react";
import { CircleCheckBig } from "lucide-react";
import Button from "../../components/ui/Button";
import { NavLink } from "react-router-dom";

function PaymentSuccess() {
	return (
		<div className="last-payment-page">
			<div className="payment-container">
				<CircleCheckBig className="success-icon" />
				<h1 className="last-payment-title">Płatność udana</h1>
				<p>
					Dziękujemy za dokonanie płatności. Sprawdź naszą zbiórkę lub wróć na
					stronę główną.
				</p>
				<div className="buttons-container">
					<NavLink to="/">
						<Button variant="primary" size="lg">
							Zobacz zbiórkę
						</Button>
					</NavLink>
					<NavLink to="/">
						<Button variant="secondary" size="lg">
							Strona główna
						</Button>
					</NavLink>
				</div>
			</div>
		</div>
	);
}

export default PaymentSuccess;
