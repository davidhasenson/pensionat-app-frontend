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

    list.innerHTML = "";

    rooms.forEach(room => {
        const li = document.createElement("li");
    
        li.textContent = `Rum ${room.roomNumber} - 
        ${room.beds} sängar -
        ${formatBedType(room.bedType)} - 
        ${room.pricePerNight} kr/natt`;

        list.appendChild(li);
    });
}

async function loadRoomsForBooking() {
    const response = await fetch(`${API_URL}/rooms`);
    const rooms = await response.json();
    const roomSelect = document.getElementById("bookingRoomId");

    roomSelect.innerHTML = "";

    rooms.forEach(room => {
        const option = document.createElement("option");
        option.value = room.id;
        option.textContent = `Rum ${room.roomNumber}`;
        roomSelect.appendChild(option);
    });
}

async function createBooking() {
    const booking = {
        customerId: document.getElementById("customerId").value,
        roomId: document.getElementById("roomId").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value
    };

    const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(booking)
    });

    showMessage(response.ok ? "Bokning skapad" : "Fel vid skapande av bokning.");
}

function formatBedType(bedType) {
    switch(bedType) {
        case "SINGLE_BED": return "Enkelrum";
        case "DOUBLE_BED": return "Dubbelrum";
        case "TWIN_ROOM": return "Tvåbäddsrum";
        default: return bedType;
    }
}