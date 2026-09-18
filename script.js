const BOOKING_API = "http://localhost:8083/api";
const CUSTOMER_API = "http://localhost:8081/api";
const REVIEW_API = "http://localhost:8082/api";
const AUTH_URL = "http://localhost:8081";

async function loginUser(username, password) {
  const body = { username: username, password: password };

  try {
    const response = await fetch(AUTH_URL + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const token = await response.text();
      sessionStorage.setItem("jwt", token);
      showLoginMessage("Du är nu inloggad", false);
      updateAuthUI();
      resumePendingBookingIfAny();
      showSearchMessage("", false);

      const modalEl = document.getElementById("loginModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    } else {
      showLoginMessage("Fel användarnamn eller lösenord");
    }
  } catch (error) {
    console.error("Nätverksfel: ", error);
    showLoginMessage("Kunde inte ansluta till servern");
  }
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("jwt");

  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
}

async function updateAuthUI() {
  const loggedIn = sessionStorage.getItem("jwt") !== null;

  document.getElementById("loginBtn").style.display = loggedIn
    ? "none"
    : "inline-block";
  document.getElementById("kunderTabItem").style.display = loggedIn
    ? "block"
    : "none";
  document.getElementById("bokningarTabItem").style.display = loggedIn
    ? "block"
    : "none";
  document.getElementById("logoutBtn").style.display = loggedIn
    ? "inline-block"
    : "none";
  document.getElementById("reviewFormFields").style.display = loggedIn
    ? "block"
    : "none";
  document.getElementById("reviewLoginPrompt").style.display = loggedIn
    ? "none"
    : "block";
}

async function logout() {
  sessionStorage.removeItem("jwt");
  updateAuthUI();
}

function showLoginMessage(text, isError = true) {
  const el = document.getElementById("login-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

function showCustomerMessage(text, isError = true) {
  const el = document.getElementById("customer-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

function showBookingMessage(text, isError = true) {
  const el = document.getElementById("booking-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

function showSearchMessage(text, isError = true) {
  const el = document.getElementById("search-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-2 text-center small fw-medium text-danger"
    : "mt-2 text-center small fw-medium text-success";
}

function showDeleteMessage(text, isError = true) {
  const el = document.getElementById("delete-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

function showDeleteBookingMessage(text, isError = true) {
  const el = document.getElementById("delete-booking-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

function showUpdateBookingMessage(text, isError = true) {
  const el = document.getElementById("update-booking-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

function showReviewMessage(text, isError = true) {
  const el = document.getElementById("review-message");
  el.innerHTML = text;
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

async function createCustomer() {
  showCustomerMessage("", false);

  const customer = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    username: document.getElementById("newUsername").value.trim(),
    password: document.getElementById("newPassword").value,
  };

  const confirmPassword = document.getElementById("confirmPassword").value;

  if (
    !customer.firstName ||
    !customer.lastName ||
    !customer.email ||
    !customer.phone ||
    !customer.username ||
    !customer.password
  ) {
    showCustomerMessage("Fel: Alla fält måste fyllas i!");
    return;
  }

  if (customer.password !== confirmPassword) {
    showCustomerMessage("Fel: Lösenorden matchar inte!");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(customer.email)) {
    showCustomerMessage("Fel: Ogiltig e-postadress. (t.ex. namn@test.com).");
    return;
  }

  const phonePattern = /^[0-9+\s-]+$/;
  if (!phonePattern.test(customer.phone)) {
    showCustomerMessage(
      "Fel: Telefonnumret får bara innehålla siffror, +, - eller mellanslag.",
    );
    return;
  }

  try {
    const response = await fetch(`${CUSTOMER_API}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });

    const data = await response.json();

    if (response.ok) {
      const successMessage = `Kunden har registrerats med framgång!
            
            Förnamn: ${data.firstName} 
            Efternamn: ${data.lastName}
            E-post: ${data.email}
            Telefon: ${data.phone}`;

      document.getElementById("customerModalBody").innerHTML = successMessage;

      const myModal = new bootstrap.Modal(
        document.getElementById("customerModal"),
      );
      myModal.show();

      document.getElementById("firstName").value = "";
      document.getElementById("lastName").value = "";
      document.getElementById("email").value = "";
      document.getElementById("phone").value = "";
      document.getElementById("newUsername").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";

      const modalEl = document.getElementById("registerModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      if (sessionStorage.getItem("pendingRoom")) {
        const pendingRoom = JSON.parse(sessionStorage.getItem("pendingRoom"));
        pendingRoom.customerEmail = customer.email;
        sessionStorage.setItem("pendingRoom", JSON.stringify(pendingRoom));
      }

      await loginUser(customer.username, customer.password);

      return;
    }

    showCustomerMessage(`Fel: ${data.message || "Ogiltig data inskickad."}`);
  } catch (error) {
    console.error("Nätverksfel:", error);
    showCustomerMessage("Kunde inte ansluta till servern. Försök igen senare.");
  }
}

function resumePendingBookingIfAny() {
  const pendingRoomData = sessionStorage.getItem("pendingRoom");

  if (!pendingRoomData) {
    return;
  }

  const { roomId, startDate, endDate, customerEmail } =
    JSON.parse(pendingRoomData);

  sessionStorage.removeItem("pendingRoom");

  document.getElementById("roomId").value = roomId;
  document.getElementById("startDate").value = startDate;
  document.getElementById("endDate").value = endDate;

  if (customerEmail) {
    document.getElementById("customerEmail").value = customerEmail;
  }

  showBookingMessage(
    "Rum och datum har fyllts i! Skriv in kundens e-post och klicka på 'Skapa bokning'.",
    false,
  );

  const bokningarTabTrigger = document.querySelector('a[href="#bokningar"]');
  const tab = new bootstrap.Tab(bokningarTabTrigger);
  tab.show();
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
    list.innerHTML =
      '<li class="list-group-item text-muted py-3">Letar efter lediga rum...</li>';

    const response = await fetch(
      `${BOOKING_API}/rooms/available?startDate=${startEl.value}&endDate=${endEl.value}`,
    );
    const data = await response.json();

    if (!response.ok) {
      showSearchMessage(`Fel: ${data.message || "Kunde inte hämta rum."}`);
      list.innerHTML = `<li class="list-group-item text-danger py-3">${data.message || "Ett fel uppstod."}</li>`;
      return;
    }

    if (data.length === 0) {
      list.innerHTML =
        '<li class="list-group-item text-warning py-3">Det finns inga lediga rum under denna period.</li>';
      return;
    }

    list.innerHTML = "";
    data.forEach((room) => {
      const li = document.createElement("li");
      li.className = "list-group-item fw-medium py-3 ps-4 pe-3";

      li.innerHTML = `
    <div class="d-flex justify-content-between align-items-center fw-medium">
        <div class="text-start">
            <span class="d-block text-dark fw-bold">Rum ${room.roomNumber} (${formatBedType(room.bedType)})</span>
            <small class="text-muted">${room.beds} sängar — <span class="text-success fw-bold">${room.pricePerNight} kr</span>/natt</small>
        </div>
        <div>
            <button onclick="toggleRoomReviews(${room.id})" class="btn btn-sm btn-outline-info fw-bold">⭐ Visa recensioner</button>
            <button class="btn btn-sm btn-outline-success fw-bold" onclick="selectRoomForBooking(${room.id}, '${startEl.value}', '${endEl.value}')">Välj</button>
        </div>
    </div>
    <div id="room-reviews-${room.id}" style="display:none" class="mt-3"></div>
`;
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Nätverksfel vid sökning:", error);
    list.innerHTML = `<li class="list-group-item text-danger py-3">Kunde inte ansluta till servern.</li>`;
  }
}

function selectRoomForBooking(roomId, startDate, endDate) {
  const loggedIn = sessionStorage.getItem("jwt") !== null;

  if (!loggedIn) {
    sessionStorage.setItem(
      "pendingRoom",
      JSON.stringify({ roomId, startDate, endDate }),
    );

    showSearchMessage(
      `Du måste vara inloggad för att boka.
      <br>
      <button class="btn btn-sm btn-primary mt-2 me-2" onclick="openLoginModal()">Logga in</button>
      <button class="btn btn-sm btn-outline-primary mt-2" onclick="openRegisterModal()">Skapa konto</button>`,
    );

    return;
  }

  const roomSelect = document.getElementById("roomId");
  roomSelect.value = roomId;

  document.getElementById("startDate").value = startDate;
  document.getElementById("endDate").value = endDate;

  roomSelect.focus();
  showBookingMessage(
    "Rum och datum har fyllts i! Skriv in kundens e-post och klicka på 'Skapa bokning'.",
    false,
  );

  const bokningarTabTrigger = document.querySelector('a[href="#bokningar"]');
  const tab = new bootstrap.Tab(bokningarTabTrigger);
  tab.show();
}

function openLoginModal() {
  const modal = new bootstrap.Modal(document.getElementById("loginModal"));
  modal.show();
}

function openRegisterModal() {
  const modal = new bootstrap.Modal(document.getElementById("registerModal"));
  modal.show();
}

async function createBooking() {
  showBookingMessage("", false);

  const booking = {
    customerEmail: document.getElementById("customerEmail").value.trim(),
    roomId: document.getElementById("roomId").value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    extraBedRequested: document.getElementById("extraBedRequested").checked,
  };

  if (
    !booking.customerEmail ||
    !booking.roomId ||
    !booking.startDate ||
    !booking.endDate
  ) {
    showBookingMessage(
      "Fel: Du måste fylla i alla fält (E-post, Rum, Start- och Slutdatum)!",
    );
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(booking.customerEmail)) {
    showBookingMessage("Fel: Ange en giltig e-postadress för kunden.");
    return;
  }

  try {
    const response = await fetch(`${BOOKING_API}/bookings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(booking),
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

      const myModal = new bootstrap.Modal(
        document.getElementById("bookingModal"),
      );
      myModal.show();

      showBookingMessage("", false);

      document.getElementById("customerEmail").value = "";
      document.getElementById("startDate").value = "";
      document.getElementById("endDate").value = "";
      document.getElementById("roomId").value = "";

      const extraBedCheckbox = document.getElementById("extraBedRequested");
      if (extraBedCheckbox) extraBedCheckbox.checked = false;

      document.getElementById("rooms").innerHTML =
        '<li class="list-group-item text-muted py-3">Bokning slutförd. Sök på nytt för att se tillgängliga rum!</li>';
      return;
    }

    if (response.status === 404) {
      showBookingMessage(
        `Fel: ${data.message} Kontrollera att du skrivit samma e-post som du registrerade dig med.`,
      );
    } else {
      showBookingMessage(`Fel: ${data.message || "Kunde inte skapa bokning."}`);
    }
  } catch (error) {
    console.error("Det uppstod ett fel i JavaScript-exekveringen:", error);
    showBookingMessage("Kunde inte ansluta till servern.");
  }
}

function copyCreatedBookingId() {
  const modalBody = document.getElementById("bookingModalBody");
  const bookingId = modalBody.getAttribute("data-booking-id");

  if (!bookingId) return;

  navigator.clipboard
    .writeText(bookingId)
    .then(() => {
      const copyBtn = document.getElementById("copyBookingIdBtn");

      copyBtn.textContent = "Kopierat!";
      copyBtn.className = "btn btn-success fw-bold";

      setTimeout(() => {
        copyBtn.textContent = "📋 Kopiera Boknings-ID";
        copyBtn.className = "btn btn-outline-dark fw-bold";
      }, 2000);
    })
    .catch((err) => {
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
    const response = await fetch(`${BOOKING_API}/bookings/${id}`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const booking = await response.json();
      updateSection.style.display = "block";

      document.getElementById("updateBookingId").value = booking.id;
      document.getElementById("updateStartDate").value = booking.startDate;
      document.getElementById("updateEndDate").value = booking.endDate;
      document.getElementById("updateExtraBedRequested").checked =
        booking.extraBedIncluded;
      document.getElementById("updateRoomId").value = booking.roomId || "";
      document.getElementById("displayBookingId").textContent =
        `#${booking.id}`;

      showUpdateBookingMessage(
        "Bokning hittad! Ändra detaljerna nedan och spara.",
        false,
      );
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
    extraBedRequested: document.getElementById("updateExtraBedRequested")
      .checked,
  };

  if (
    !bookingId ||
    !updateData.startDate ||
    !updateData.endDate ||
    !updateData.roomId
  ) {
    showUpdateBookingMessage(
      "Fel: Boknings-ID, startdatum, slutdatum och rums-ID måste vara ifyllda!",
    );
    return;
  }

  try {
    const response = await fetch(`${BOOKING_API}/bookings/${bookingId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
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

      document.getElementById("updateBookingModalBody").innerHTML =
        successMessage;

      const myModal = new bootstrap.Modal(
        document.getElementById("updateBookingModal"),
      );
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

    showUpdateBookingMessage(
      `Fel: ${data.message || "Kunde inte uppdatera bokningen."}`,
    );
  } catch (error) {
    console.error("Nätverksfel vid uppdatering av bokning:", error);
    showUpdateBookingMessage("Kunde inte ansluta till servern.");
  }
}

async function loadRoomsForBooking() {
  try {
    const response = await fetch(`${BOOKING_API}/rooms`);
    const rooms = await response.json();
    const select = document.getElementById("roomId");

    select.innerHTML = '<option value="">-- Välj rum --</option>';
    rooms.forEach((r) => {
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
  el.className = isError
    ? "mt-3 text-center text-danger fw-medium"
    : "mt-3 text-center text-success fw-medium";
}

async function fetchCustomerForUpdate() {
  showUpdateMessage("", false);
  const email = document.getElementById("updateSearchEmail").value.trim();

  if (!email) {
    showUpdateMessage("Fel: Ange en e-postadress att söka efter!");
    return;
  }

  try {
    const response = await fetch(
      `${CUSTOMER_API}/customers/by-email?email=${email}`,
      {
        headers: getAuthHeaders(),
      },
    );

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

    showUpdateMessage(
      "Kunduppgifter hämtade! Du kan nu redigera fälten nedan.",
      false,
    );
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
    phone: document.getElementById("updatePhone").value.trim(),
  };

  if (!updateRequest.firstName || !updateRequest.lastName) {
    showUpdateMessage("Fel: Förnamn och efternamn måste anges!");
    return;
  }

  try {
    const response = await fetch(`${CUSTOMER_API}/customers/email/${email}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateRequest),
    });

    if (response.ok) {
      const data = await response.json();

      const successMessage = `Kunduppgifterna har uppdaterats!
            
            Förnamn: ${data.firstName}
            Efternamn: ${data.lastName}
            E-post: ${email}
            Telefon: ${data.phone || "Ej angivet"}`;

      document.getElementById("updateCustomerModalBody").innerHTML =
        successMessage;

      const myModal = new bootstrap.Modal(
        document.getElementById("updateCustomerModal"),
      );
      myModal.show();

      document.getElementById("updateFirstName").disabled = true;
      document.getElementById("updateLastName").disabled = true;
      document.getElementById("updatePhone").disabled = true;
      document.getElementById("updateSubmitBtn").disabled = true;

      document.getElementById("updateSearchEmail").value = "";

      return;
    }

    const errorData = await response.json();
    showUpdateMessage(
      `Fel: ${errorData.message || "Kunde inte uppdatera uppgifterna."}`,
    );
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

  const confirmModal = new bootstrap.Modal(
    document.getElementById("deleteConfirmModal"),
  );
  confirmModal.show();
}

async function executeDeleteCustomer() {
  const confirmModalEl = document.getElementById("deleteConfirmModal");
  const modalInstance = bootstrap.Modal.getInstance(confirmModalEl);
  if (modalInstance) modalInstance.hide();

  try {
    const response = await fetch(
      `${CUSTOMER_API}/customers/email/${emailToDelete}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (response.ok) {
      showDeleteMessage(
        "🎉 Kunden har raderats från systemet med framgång!",
        false,
      );
      document.getElementById("deleteEmail").value = "";
      emailToDelete = "";
      logout();
      return;
    }

    const errorData = await response.json();
    showDeleteMessage(
      `Fel: ${errorData.message || "Kunde inte radera kunden."}`,
    );
  } catch (error) {
    console.error("Nätverksfel vid radering:", error);
    showDeleteMessage("Kunde inte ansluta till servern.");
  }
}

let bookingIdToDelete = "";

async function findBookingsByEmail() {
  const email = document
    .getElementById("searchCustomerBookingsEmail")
    .value.trim();
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
    list.innerHTML =
      '<li class="list-group-item text-muted py-2">Söker efter bokningar...</li>';

    const response = await fetch(
      `${BOOKING_API}/bookings/by-email?email=${email}`,
      {
        headers: getAuthHeaders(),
      },
    );
    const bookings = await response.json();

    if (!response.ok) {
      messageEl.innerHTML = `Fel: ${bookings.message || "Kunde inte hämta bokningar."}`;
      messageEl.classList.add("text-danger");
      list.innerHTML = "";
      return;
    }

    if (bookings.length === 0) {
      list.innerHTML =
        '<li class="list-group-item text-warning py-3 fw-medium">Inga bokningar hittades på denna e-postadress.</li>';
      return;
    }

    list.innerHTML = "";
    bookings.forEach((b) => {
      const li = document.createElement("li");

      const statusBadgeColor =
        b.status === "ACTIVE" ? "bg-success" : "bg-danger";
      const statusText = b.status === "ACTIVE" ? "Aktiv" : "Avbokad";

      const extraBedText = b.extraBedIncluded
        ? '<span class="badge bg-info text-dark ms-1">🛏️ Extrasäng: Ja</span>'
        : '<span class="badge bg-light text-muted ms-1">🛏️ Extrasäng: Nej</span>';

      const bedTypeBadge = b.bedType
        ? `<span class="badge bg-secondary text-white">${b.bedType}</span>`
        : "";

      li.className =
        "list-group-item d-flex justify-content-between align-items-center py-3";
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
    list.innerHTML =
      '<li class="list-group-item text-danger py-2">Kunde inte ansluta till servern.</li>';
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

  const confirmModal = new bootstrap.Modal(
    document.getElementById("deleteBookingConfirmModal"),
  );
  confirmModal.show();
}

async function executeDeleteBooking() {
  const confirmModalEl = document.getElementById("deleteBookingConfirmModal");
  const modalInstance = bootstrap.Modal.getInstance(confirmModalEl);
  if (modalInstance) modalInstance.hide();

  try {
    const response = await fetch(
      `${BOOKING_API}/bookings/${bookingIdToDelete}/cancel`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (response.ok) {
      showDeleteBookingMessage(
        `🎉 Bokningen (ID: ${data.id}) har avbokats! Status är nu: Avbokad.`,
        false,
      );
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

async function submitReview() {
  showReviewMessage("", false);

  const roomId = document.getElementById("reviewRoomId").value;
  const reviewerName = document.getElementById("reviewerName").value.trim();
  const rating = document.getElementById("reviewRating").value;
  const reviewText = document.getElementById("reviewComment").value.trim();
  const reviewDate = new Date().toISOString().split("T")[0];

  if (!roomId || !rating) {
    showReviewMessage("Fel: Välj ett rum och ange ett betyg");
    return;
  }

  try {
    const response = await fetch(REVIEW_API + "/reviews", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        roomId: parseInt(roomId),
        reviewerName,
        rating: parseInt(rating),
        reviewText,
        reviewDate,
      }),
    });

    if (response.status === 401 || response.status === 403) {
      showReviewMessage("Du måste vara inloggad för att skriva en recension.");
      return;
    }

    const data = await response.json();

    if (response.ok) {
      showReviewMessage("🎉 Tack för din recension!", false);

      document.getElementById("reviewerName").value = "";
      document.getElementById("reviewRating").value = "";
      document.getElementById("reviewComment").value = "";

      loadReviewsForRoom(roomId);
      return;
    }

    showReviewMessage(
      `Fel: ${data.message || "Kunde inte skicka recensionen."}`,
    );
  } catch (error) {
    console.error("Nätverksfel vid recension:", error);
    showReviewMessage("Kunde inte ansluta till servern.");
  }
}

async function loadReviewsForRoom(
  roomId,
  container = document.getElementById("reviewsList"),
) {
  container.innerHTML = "Laddar recensioner...";

  try {
    const response = await fetch(REVIEW_API + "/reviews/room/" + roomId);

    if (!response.ok) {
      container.innerHTML = "Kunde inte hämta recensioner.";
      return;
    }

    const reviews = await response.json();

    if (reviews.length === 0) {
      container.innerHTML = "Inga recensioner än för det här rummet.";
      return;
    }

    const html = reviews
      .map(
        (review) => `
      <div class="review-card">
        👤 ${review.reviewerName || "Anonym"} 
        ⭐ ${review.rating}/5
        📅 ${review.reviewDate}
        💬 ${review.reviewText}
      </div>
    `,
      )
      .join("");

    container.innerHTML = html;
  } catch (error) {
    console.error("Nätverksfel kunde inte hämta recensioner");
    container.innerHTML = "Något gick fel vid hämtning av recensioner";
  }
}

async function toggleRoomReviews(roomId) {
  const container = document.getElementById("room-reviews-" + roomId);

  if (container.style.display === "none") {
    container.style.display = "block";
    await loadReviewsForRoom(roomId, container);
  } else {
    container.style.display = "none";
  }
}

async function loadRoomsForReview() {
  try {
    const response = await fetch(BOOKING_API + "/rooms");
    const rooms = await response.json();
    const select = document.getElementById("reviewRoomId");

    select.innerHTML = '<option value="">--Välj Rum--</option>';

    rooms.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `Rum ${r.roomNumber} (${formatBedType(r.bedType)})`;

      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Kunde inte ladda rum till recensionslistan", error);
  }
}

function formatBedType(bedType) {
  switch (bedType) {
    case "SINGLE_BED":
      return "Enkelrum";
    case "DOUBLE_BED":
      return "Dubbelrum";
    case "TWIN_ROOM":
      return "Tvåbäddsrum";
    default:
      return bedType;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  loadRoomsForBooking();
  loadRoomsForReview();

  document
    .getElementById("loginModal")
    .addEventListener("show.bs.modal", () => {
      showLoginMessage("", false);
    });

  document
    .getElementById("registerModal")
    .addEventListener("show.bs.modal", () => {
      showCustomerMessage("", false);
    });
});
