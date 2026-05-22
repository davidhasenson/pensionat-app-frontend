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

async function loadRooms() {
    const response = await fetch(`${API_URL}/rooms`);
    const rooms = await response.json();
    const list = document.getElementById("rooms");

    rooms.forEach(room => {
        const li = document.createElement("li");
    
        li.textContent = `Rum ${room.roomNumber} - 
        ${room.beds} sängar -
        ${formatBedType(room.bedType)} - 
        ${room.pricePerNight} kr/natt`;

        list.appendChild(li);
    });
}

function formatBedType(bedType) {
    switch(bedType) {
        case "SINGLE_BED": return "Enkelrum";
        case "DOUBLE_BED": return "Dubbelrum";
        case "TWIN_ROOM": return "Tvåbäddsrum";
        default: return bedType;
    }
}