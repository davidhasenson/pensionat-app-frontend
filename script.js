const API_URL = 'http://localhost:8080/api'

async function createCustomer() {
    const customer = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value

    };

    const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
    });

    showMessage(response.ok ? "Kund skapad" : "Fel vid skapande av kund.");


}

function showMessage(text) {
    document.getElementById("message").textContent = text;
}