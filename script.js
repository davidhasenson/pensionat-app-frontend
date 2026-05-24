const API_URL = 'http://localhost:8080/api'

async function createCustomer() {

    showMessage("");

    const customer = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value

    };

    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
        showMessage("Fel: Alla fält måste fyllas i!");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showMessage("Fel: E-postadressen är ogiltig. Kontrollera att du har med '@' och en punkt (t.ex. namn@test.com).");
        return;
    }

    const phonePattern = /^[0-9+\s-]+$/;
    if (!phonePattern.test(phone)) {
        showMessage("Fel: Telefonnumret får bara innehålla siffror, mellanslag, eller tecken som + och -.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customer)
        });

        if (response.ok) {
            showMessage("Kund skapad med framgång!");
            clearForm();
            return;
        }

        if (response.status === 400) {
            const errorData = await response.json();

            if (errorData.errors) {
                const serverErrors = Object.values(errorData.errors).join(", ");
                showMessage(`Fel: Ogiltig data inskickad. Kontrollera dina inmatningar.<br><strong>Detaljer:</strong> ${serverErrors}`);
            }

            else if (errorData.error) {
                showMessage(`Fel: Ogiltig data inskickad. Kontrollera dina inmatningar.<br><strong>Detaljer:</strong> ${errorData.error}`);
            }
            else {
                showMessage("Fel: Ogiltig data inskickad. Kontrollera dina inmatningar.");
            }
        }

    } catch (error) {
        console.error("Nätverksfel:", error);
        showMessage("Kunde inte ansluta till servern. Försök igen senare.");
    }
}

function showMessage(text) {
    document.getElementById("message").innerHTML = text;
}