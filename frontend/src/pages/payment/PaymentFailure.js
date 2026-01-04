import React from "react";
import { CircleX } from "lucide-react";
import Button from "../../components/ui/Button";
import { NavLink } from "react-router-dom";

function PaymentFailure() {
	return (
		<div className="last-payment-page">
			<div className="payment-container">
				<CircleX className="failure-icon" />
				<h1 className="last-payment-title">Płatność nieudana</h1>
				<p>
					Podczas przetwarzania twojej płatności został napotkany nieoczekiwany
					błąd. Jeżeli twoje konto zostało obciążone, pieniądze zostaną zwrócone
					na ten sam rachunek w przeciągu 3 dni roboczych
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

export default PaymentFailure;
