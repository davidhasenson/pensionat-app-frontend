const API_URL = 'http://localhost:8080/api';



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

function showDeleteMessage(text, isError = true) {
    const el = document.getElementById("delete-message");
    el.innerHTML = text;
    el.className = isError ? "mt-3 text-center text-danger fw-medium" : "mt-3 text-center text-success fw-medium";
}

function showDeleteBookingMessage(text, isError = true) {
    const el = document.getElementById("delete-booking-message");
    el.innerHTML = text;
    el.className = isError ? "mt-3 text-center text-danger fw-medium" : "mt-3 text-center text-success fw-medium";
}

function showUpdateBookingMessage(text, isError = true) {
    const el = document.getElementById("update-booking-message");
    el.innerHTML = text;
    el.className = isError ? "mt-3 text-center text-danger fw-medium" : "mt-3 text-center text-success fw-medium";
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

            const successMessage = `🎉 Bokning skapad med framgång!

            VIKTIGT: Notera Boknings-ID nedan om bokningen behöver ändras eller avbokas!
            Boknings-ID: ${data.id} 

            --------------------------------------------------
            Rum: ${data.roomNumber}
            Gäst: ${data.customerFirstName} ${data.customerLastName}
            E-post: ${data.customerEmail}
            Datum: ${data.startDate} till ${data.endDate}
            ${data.extraBedIncluded ? "Extrasäng: Inkluderad" : ""}`;

            const modalBody = document.getElementById("bookingModalBody");
            modalBody.innerHTML = successMessage;

            modalBody.setAttribute("data-booking-id", data.id);

            const myModal = new bootstrap.Modal(document.getElementById('bookingModal'));
            myModal.show();

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

function copyCreatedBookingId() {
    
    const modalBody = document.getElementById("bookingModalBody");
    const bookingId = modalBody.getAttribute("data-booking-id");

    if (!bookingId) return;

    navigator.clipboard.writeText(bookingId).then(() => {
        const copyBtn = document.getElementById("copyBookingIdBtn");

        copyBtn.textContent = "Kopierat!";
        copyBtn.className = "btn btn-success fw-bold";

        setTimeout(() => {
            copyBtn.textContent = "📋 Kopiera Boknings-ID";
            copyBtn.className = "btn btn-outline-dark fw-bold";
        }, 2000);
    }).catch(err => {
        console.error("Kunde inte kopiera text: ", err);
    });
}

async function findBookingForUpdate() {
    const id = document.getElementById("searchBookingId").value.trim();
    const updateSection = document.getElementById("updateSection");

    if (!id) {
        alert("Du måste ange ett Boknings-ID!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings/${id}`);

        if (response.ok) {
            const booking = await response.json();

            updateSection.style.display = "block";

            document.getElementById("updateBookingId").value = booking.id;
            document.getElementById("updateStartDate").value = booking.startDate;
            document.getElementById("updateEndDate").value = booking.endDate;
            document.getElementById("updateExtraBedRequested").checked = booking.extraBedIncluded;

            document.getElementById("updateRoomId").value = booking.roomId || "";

            document.getElementById("displayBookingId").textContent = `#${booking.id}`;

            showUpdateBookingMessage("Bokning hittad! Ändra detaljerna nedan och spara.", false);
        } else {
            updateSection.style.display = "none";
            alert("Hittade ingen bokning med det ID:t");
        }
    } catch (error) {
        console.error("Fel vid sökning:", error);
        alert("Kunde inte ansluta till servern.");
    }
}

async function updateBooking() {
    showUpdateBookingMessage("", false);

    const bookingId = document.getElementById("updateBookingId").value.trim();
    const roomIdValue = document.getElementById("updateRoomId").value.trim();

    const updateData = {
        startDate: document.getElementById("updateStartDate").value,
        endDate: document.getElementById("updateEndDate").value,
        roomId: roomIdValue ? parseInt(roomIdValue) : null,
        extraBedRequested: document.getElementById("updateExtraBedRequested").checked
    };

    if (!bookingId || !updateData.startDate || !updateData.endDate || !updateData.roomId) {
        showUpdateBookingMessage("Fel: Boknings-ID, startdatum, slutdatum och rums-ID måste vara ifyllda!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {

            const successMessage = `🎉 Bokningen har uppdaterats med framgång!

            Boknings-ID: ${data.id} 
            --------------------------------------------------
            Nytt datum: ${data.startDate} till ${data.endDate}
            Rum: ${data.roomNumber}
            Gäst: ${data.customerFirstName || ""} ${data.customerLastName || ""}
            E-post: ${data.customerEmail}
            ${data.extraBedIncluded ? "Extrasäng: Ja" : "Extrasäng: Nej"}`;

            document.getElementById("updateBookingModalBody").innerHTML = successMessage;

            const myModal = new bootstrap.Modal(document.getElementById('updateBookingModal'));
            myModal.show();

            document.getElementById("updateBookingId").value = "";
            document.getElementById("updateRoomId").value = "";
            document.getElementById("updateStartDate").value = "";
            document.getElementById("updateEndDate").value = "";
            document.getElementById("updateExtraBedRequested").checked = false;
            document.getElementById("searchBookingId").value = "";
            document.getElementById("updateSection").style.display = "none";

            return;
        }

        showUpdateBookingMessage(`Fel: ${data.message || "Kunde inte uppdatera bokningen."}`);

    } catch (error) {
        console.error("Nätverksfel vid uppdatering av bokning:", error);
        showUpdateBookingMessage("Kunde inte ansluta till servern.");
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
            
            const data = await response.json();

            const successMessage = `Kunduppgifterna har uppdaterats!
            
            Förnamn: ${data.firstName}
            Efternamn: ${data.lastName}
            E-post: ${email}
            Telefon: ${data.phone || "Ej angivet"}`;

            document.getElementById("updateCustomerModalBody").innerHTML = successMessage;

            const myModal = new bootstrap.Modal(document.getElementById('updateCustomerModal'));
            myModal.show();
 
            document.getElementById("updateFirstName").disabled = true;
            document.getElementById("updateLastName").disabled = true;
            document.getElementById("updatePhone").disabled = true;
            document.getElementById("updateSubmitBtn").disabled = true;

            document.getElementById("updateSearchEmail").value = "";

            return;
        }

        const errorData = await response.json();
        showUpdateMessage(`Fel: ${errorData.message || "Kunde inte uppdatera uppgifterna."}`);

    } catch (error) {
        console.error("Nätverksfel:", error);
        showUpdateMessage("Kunde inte ansluta till servern.");
    }
}

let emailToDelete = "";

function deleteCustomer() {
    showDeleteMessage("", false);

    const email = document.getElementById("deleteEmail").value.trim();

    if (!email) {
        showDeleteMessage("Fel: Du måste ange en e-postadress!");
        return;
    }

    emailToDelete = email;

    document.getElementById("deleteConfirmEmailText").textContent = email;

    const confirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    confirmModal.show();
}

async function executeDeleteCustomer() {

    const confirmModalEl = document.getElementById('deleteConfirmModal');
    const modalInstance = bootstrap.Modal.getInstance(confirmModalEl);
    if (modalInstance) modalInstance.hide();

    try {
        const response = await fetch(`${API_URL}/customers/email/${emailToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showDeleteMessage("🎉 Kunden har raderats från systemet med framgång!", false);
            document.getElementById("deleteEmail").value = ""; 
            emailToDelete = ""; 
            return;
        }

        const errorData = await response.json();
        showDeleteMessage(`Fel: ${errorData.message || "Kunde inte radera kunden."}`);

    } catch (error) {
        console.error("Nätverksfel vid radering:", error);
        showDeleteMessage("Kunde inte ansluta till servern.");
    }
}

let bookingIdToDelete = "";

async function findBookingsByEmail() {
    const email = document.getElementById("searchCustomerBookingsEmail").value.trim();
    const list = document.getElementById("customerBookingsList");
    const messageEl = document.getElementById("email-search-message");

    list.innerHTML = "";
    messageEl.innerHTML = "";
    messageEl.className = "mt-2 text-center small fw-medium";

    if (!email) {
        messageEl.innerHTML = "Fel: Du måste ange en e-postadress!";
        messageEl.classList.add("text-danger");
        return;
    }

    try {
        list.innerHTML = '<li class="list-group-item text-muted py-2">Söker efter bokningar...</li>';

        const response = await fetch(`${API_URL}/bookings/by-email?email=${email}`);
        const bookings = await response.json();

        if (!response.ok) {
            messageEl.innerHTML = `Fel: ${bookings.message || "Kunde inte hämta bokningar."}`;
            messageEl.classList.add("text-danger");
            list.innerHTML = "";
            return;
        }

        if (bookings.length === 0) {
            list.innerHTML = '<li class="list-group-item text-warning py-3 fw-medium">Inga bokningar hittades på denna e-postadress.</li>';
            return;
        }

        list.innerHTML = "";
        bookings.forEach(b => {
            const li = document.createElement("li");

            const statusBadgeColor = b.status === "ACTIVE" ? "bg-success" : "bg-danger";
            const statusText = b.status === "ACTIVE" ? "Aktiv" : "Avbokad";

            const extraBedText = b.extraBedIncluded
                ? '<span class="badge bg-info text-dark ms-1">🛏️ Extrasäng: Ja</span>'
                : '<span class="badge bg-light text-muted ms-1">🛏️ Extrasäng: Nej</span>';

            const bedTypeBadge = b.bedType
                ? `<span class="badge bg-secondary text-white">${b.bedType}</span>`
                : '';

            li.className = "list-group-item d-flex justify-content-between align-items-center py-3";
            li.innerHTML = `
        <div class="text-start">
            <span class="fw-bold d-block mb-1">
                Boknings-ID: ${b.id} — <span class="text-primary">Rum ${b.roomNumber}</span>
            </span>
            <div class="mb-2">
                <small class="text-muted d-block">📅 Datum: ${b.startDate} till ${b.endDate}</small>
            </div>
            <div class="mt-2 d-flex gap-1">
                ${bedTypeBadge}
                ${extraBedText}
            </div>
        </div>
        <div class="text-end">
            <span class="badge ${statusBadgeColor} d-block mb-2">${statusText}</span>
        </div>
    `;
            list.appendChild(li);
        });

    } catch (error) {
        console.error("Nätverksfel vid sökning av bokningar:", error);
        list.innerHTML = '<li class="list-group-item text-danger py-2">Kunde inte ansluta till servern.</li>';
    }
}

function deleteBooking() {
    showDeleteBookingMessage("", false);

    const bookingId = document.getElementById("deleteBookingId").value.trim();

    if (!bookingId) {
        showDeleteBookingMessage("Fel: Du måste ange ett Boknings-ID!");
        return;
    }

    bookingIdToDelete = bookingId;
    document.getElementById("deleteConfirmBookingIdText").textContent = bookingId;

    const confirmModal = new bootstrap.Modal(document.getElementById('deleteBookingConfirmModal'));
    confirmModal.show();
}

async function executeDeleteBooking() {
    const confirmModalEl = document.getElementById('deleteBookingConfirmModal');
    const modalInstance = bootstrap.Modal.getInstance(confirmModalEl);
    if (modalInstance) modalInstance.hide();

    try {
        const response = await fetch(`${API_URL}/bookings/${bookingIdToDelete}/cancel`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showDeleteBookingMessage(`🎉 Bokningen (ID: ${data.id}) har avbokats! Status är nu: Avbokad.`, false);
            document.getElementById("deleteBookingId").value = "";
            bookingIdToDelete = "";
            return;
        }

        showDeleteBookingMessage(`Fel: ${data.message || "Kunde inte avboka."}`);

    } catch (error) {
        console.error("Nätverksfel vid avbokning:", error);
        showDeleteBookingMessage("Kunde inte ansluta till servern.");
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