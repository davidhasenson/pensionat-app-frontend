const API_URL = 'http://localhost:8080/api';

let allRooms = [];


function showCustomerMessage(text, isError = true) {
    const el = document.getElementById("customer-message");
    el.innerHTML = text;
    el.className = isError ? "mt-3 text-center text-danger fw-medium" : "mt-3 text-center text-success fw-medium";
}

function showBookingMessage(text, isError = true) {
    const el = document.getElementById("booking-message");
    el.innerHTML = text;
    el.className = isError ? "mt-3 text-center text-danger fw-medium" : "mt-3 text-center text-success fw-medium";
}

function showSearchMessage(text, isError = true) {
    const el = document.getElementById("search-message");
    el.innerHTML = text;
    el.className = isError ? "mt-2 text-center small fw-medium text-danger" : "mt-2 text-center small fw-medium text-success";
}

async function createCustomer() {
    showCustomerMessage("", false);

    const customer = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim()
    };

    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
        showCustomerMessage("Fel: Alla fält måste fyllas i!");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(customer.email)) {
        showCustomerMessage("Fel: Ogiltig e-postadress. (t.ex. namn@test.com).");
        return;
    }

    const phonePattern = /^[0-9+\s-]+$/;
    if (!phonePattern.test(customer.phone)) {
        showCustomerMessage("Fel: Telefonnumret får bara innehålla siffror, +, - eller mellanslag.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
        });

        const data = await response.json();

        if (response.ok) {
            const successMessage = `Kunden har registrerats med framgång!
            
            Förnamn: ${data.firstName} 
            Efternamn: ${data.lastName}
            E-post: ${data.email}
            Telefon: ${data.phone}`;

            document.getElementById("customerModalBody").innerHTML = successMessage;

            const myModal = new bootstrap.Modal(document.getElementById('customerModal'));
            myModal.show();

            document.getElementById("firstName").value = "";
            document.getElementById("lastName").value = "";
            document.getElementById("email").value = "";
            document.getElementById("phone").value = "";

            loadCustomersForBooking();
            return;
        }

        showCustomerMessage(`Fel: ${data.message || "Ogiltig data inskickad."}`);

    } catch (error) {
        console.error("Nätverksfel:", error);
        showCustomerMessage("Kunde inte ansluta till servern. Försök igen senare.");
    }
}

async function searchAvailableRooms() {
    const startEl = document.getElementById("searchStartDate");
    const endEl = document.getElementById("searchEndDate");
    const list = document.getElementById("rooms");

    showSearchMessage("", false);

    if (!startEl.value || !endEl.value) {
        showSearchMessage("Fel: Du måste fylla i både in- och utcheckningsdatum!");
        return;
    }

    try {
        list.innerHTML = '<li class="list-group-item text-muted py-3">Letar efter lediga rum...</li>';

        const response = await fetch(`${API_URL}/rooms/available?startDate=${startEl.value}&endDate=${endEl.value}`);
        const data = await response.json();

        if (!response.ok) {
            showSearchMessage(`Fel: ${data.message || "Kunde inte hämta rum."}`);
            list.innerHTML = `<li class="list-group-item text-danger py-3">${data.message || "Ett fel uppstod."}</li>`;
            return;
        }

        if (data.length === 0) {
            list.innerHTML = '<li class="list-group-item text-warning py-3">Det finns inga lediga rum under denna period.</li>';
            return;
        }

        list.innerHTML = "";
        data.forEach(room => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center fw-medium py-3 ps-4 pe-3";

            li.innerHTML = `
                <div class="text-start">
                    <span class="d-block text-dark fw-bold">Rum ${room.roomNumber} (${formatBedType(room.bedType)})</span>
                    <small class="text-muted">${room.beds} sängar — <span class="text-success fw-bold">${room.pricePerNight} kr</span>/natt</small>
                </div>
                <button class="btn btn-sm btn-outline-success fw-bold" onclick="selectRoomForBooking(${room.id}, '${startEl.value}', '${endEl.value}')">
                    Välj
                </button>
            `;
            list.appendChild(li);
        });

    } catch (error) {
        console.error("Nätverksfel vid sökning:", error);
        list.innerHTML = `<li class="list-group-item text-danger py-3">Kunde inte ansluta till servern.</li>`;
    }
}

function selectRoomForBooking(roomId, startDate, endDate) {
    const roomSelect = document.getElementById("roomId");
    roomSelect.value = roomId;

    document.getElementById("startDate").value = startDate;
    document.getElementById("endDate").value = endDate;

    roomSelect.focus();
    showBookingMessage("Rum och datum har fyllts i! Skriv in kundens e-post och klicka på 'Skapa bokning'.", false);
}

async function createBooking() {
    showBookingMessage("", false);

    const booking = {
        customerEmail: document.getElementById("customerEmail").value.trim(),
        roomId: document.getElementById("roomId").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        extraBedRequested: document.getElementById("extraBedRequested").checked
    };

    if (!booking.customerEmail || !booking.roomId || !booking.startDate || !booking.endDate) {
        showBookingMessage("Fel: Du måste fylla i alla fält (E-post, Rum, Start- och Slutdatum)!");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(booking.customerEmail)) {
        showBookingMessage("Fel: Ange en giltig e-postadress för kunden.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });

        const data = await response.json();

        if (response.ok) {
            // 1. Bygg texten till popupen

            const successMessage = `🎉 Bokning skapad med framgång!

            Boknings-ID: ${data.id}
            Rum: ${data.roomNumber}
            Gäst: ${data.customerFirstName} ${data.customerLastName}
            E-post: ${data.customerEmail}
            Datum: ${data.startDate} till ${data.endDate}
            ${data.extraBedIncluded ? "• Extrasäng: Inkluderad" : ""}`;


            // 2. Tryck in texten i popupens body
            document.getElementById("bookingModalBody").innerHTML = successMessage;

            // 3. Öppna popupen (Bootstrap 5 syntax)
            const myModal = new bootstrap.Modal(document.getElementById('bookingModal'));
            myModal.show();

            // Nollställ formulärfält (din befintliga kod)
            document.getElementById("customerEmail").value = "";
            document.getElementById("startDate").value = "";
            document.getElementById("endDate").value = "";
            document.getElementById("roomId").value = "";

            const extraBedCheckbox = document.getElementById("extraBedRequested");
            if (extraBedCheckbox) extraBedCheckbox.checked = false;

            document.getElementById("rooms").innerHTML = '<li class="list-group-item text-muted py-3">Bokning slutförd. Sök på nytt för att se tillgängliga rum!</li>';
            return;
        }

        showBookingMessage(`Fel: ${data.message || "Kunde inte skapa bokning."}`);

    } catch (error) {
        console.error("Det uppstod ett fel i JavaScript-exekveringen:", error);
        showBookingMessage("Kunde inte ansluta till servern.");
    }
}

async function loadCustomersForBooking() {
    try {
        const response = await fetch(`${API_URL}/customers`);
        const customers = await response.json();
        const select = document.getElementById("customerId");

        select.innerHTML = '<option value="">-- Välj kund --</option>';
        customers.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `${c.firstName} ${c.lastName}`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Kunde inte ladda kunder till bokningslistan", e);
    }
}

async function loadRoomsForBooking() {
    try {
        const response = await fetch(`${API_URL}/rooms`);
        const rooms = await response.json();
        const select = document.getElementById("roomId");

        select.innerHTML = '<option value="">-- Välj rum --</option>';
        rooms.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = `Rum ${r.roomNumber} (${formatBedType(r.bedType)})`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Kunde inte ladda rum till bokningslistan", e);
    }
}

function showUpdateMessage(text, isError = true) {
    const el = document.getElementById("update-message");
    el.innerHTML = text;
    el.className = isError ? "mt-3 text-center text-danger fw-medium" : "mt-3 text-center text-success fw-medium";
}


async function fetchCustomerForUpdate() {
    showUpdateMessage("", false);
    const email = document.getElementById("updateSearchEmail").value.trim();

    if (!email) {
        showUpdateMessage("Fel: Ange en e-postadress att söka efter!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/customers/by-email?email=${email}`);

        if (!response.ok) {
            const errorData = await response.json();
            showUpdateMessage(`Fel: ${errorData.message || "Kunden hittades inte."}`);
            return;
        }

        const data = await response.json();

        document.getElementById("updateFirstName").value = data.firstName;
        document.getElementById("updateLastName").value = data.lastName;
        document.getElementById("updatePhone").value = data.phone || "";

        document.getElementById("updateFirstName").disabled = false;
        document.getElementById("updateLastName").disabled = false;
        document.getElementById("updatePhone").disabled = false;
        document.getElementById("updateSubmitBtn").disabled = false;

        showUpdateMessage("Kunduppgifter hämtade! Du kan nu redigera fälten nedan.", false);

    } catch (error) {
        console.error("Nätverksfel:", error);
        showUpdateMessage("Kunde inte ansluta till servern.");
    }
}


async function updateCustomer() {
    showUpdateMessage("", false);

    const email = document.getElementById("updateSearchEmail").value.trim();
    const updateRequest = {
        firstName: document.getElementById("updateFirstName").value.trim(),
        lastName: document.getElementById("updateLastName").value.trim(),
        phone: document.getElementById("updatePhone").value.trim()
    };

    if (!updateRequest.firstName || !updateRequest.lastName) {
        showUpdateMessage("Fel: Förnamn och efternamn måste anges!");
        return;
    }

    try {

        const response = await fetch(`${API_URL}/customers/email/${email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateRequest)
        });

        if (response.ok) {
            showUpdateMessage("🎉 Kunduppgifterna har uppdaterats med framgång!", false);


            document.getElementById("updateFirstName").disabled = true;
            document.getElementById("updateLastName").disabled = true;
            document.getElementById("updatePhone").disabled = true;
            document.getElementById("updateSubmitBtn").disabled = true;

            return;
        }

        const errorData = await response.json();
        showUpdateMessage(`Fel: ${errorData.message || "Kunde inte uppdatera uppgifterna."}`);

    } catch (error) {
        console.error("Nätverksfel:", error);
        showUpdateMessage("Kunde inte ansluta till servern.");
    }
}

function formatBedType(bedType) {
    switch (bedType) {
        case "SINGLE_BED": return "Enkelrum";
        case "DOUBLE_BED": return "Dubbelrum";
        case "TWIN_ROOM": return "Tvåbäddsrum";
        default: return bedType;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadRoomsForBooking();
});