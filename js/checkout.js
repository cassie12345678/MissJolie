/* ============================================================
   CHECKOUT PAGE
============================================================ */
const cart = JSON.parse(localStorage.getItem("cart")) || [];

// Je moet ingelogd zijn om af te rekenen
if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
}

// Check if checkout is valid
if (!localStorage.getItem("pendingCheckout") || cart.length === 0) {
    window.location.href = "home.html";
}

// Pre-fill email from account
const userEmail = localStorage.getItem("userEmail");
if (userEmail) {
    document.getElementById("customerEmail").value = userEmail;
}

/* ============================================================
   DISPLAY CART SUMMARY
============================================================ */
function displayCartSummary() {
    const summaryDiv = document.getElementById("cartSummary");
    let html = '<h3>Jouw Bestelling</h3>';
    let total = 0;
    let hasPass = false;
    let hasBooking = false;

    cart.forEach(item => {
        total += item.price;
        const displayName = item.tier ? `${item.name} (${item.tier})` : item.name;

        html += `
            <div class="summary-item">
                <span>${displayName}${item.description ? ` — ${item.description}` : ''}</span>
                <span>€${item.price.toFixed(2)}</span>
            </div>
        `;

        if (item.type === 'pass') {
            hasPass = true;
        }
        if (item.type === 'booking') {
            hasBooking = true;
        }
    });

    html += `
        <div class="summary-total">
            <div class="summary-item">
                <span>Totaal:</span>
                <span>€${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    summaryDiv.innerHTML = html;

    // Show Snapchat username field if cart contains passes
    if (hasPass) {
        document.getElementById("snapchatGroup").style.display = "flex";
        document.getElementById("snapchatUsername").required = true;
    }

    // Show booking notes field if cart contains bookings
    if (hasBooking) {
        document.getElementById("bookingNotesGroup").style.display = "flex";
    }
}

displayCartSummary();

/* ============================================================
   FORM SUBMISSION
============================================================ */
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const customerData = {
        name: document.getElementById("customerName").value,
        email: document.getElementById("customerEmail").value,
        phone: document.getElementById("customerPhone").value,
        snapchatUsername: document.getElementById("snapchatUsername").value || null
    };
    const bookingNotes = document.getElementById("bookingNotes").value.trim() || null;

    localStorage.setItem("customerData", JSON.stringify(customerData));
    localStorage.removeItem("pendingCheckout");

    const submitBtn = document.querySelector("#checkoutForm button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Bezig met verwerken...";

    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const userId = localStorage.getItem("userId");

    try {
        const response = await fetch("includes/checkout.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: total.toFixed(2),
                user_id: userId,
                customer_data: customerData,
                items: cart.map(item => ({
                    type: item.type,
                    id: item.id,
                    name: item.name,
                    tier: item.tier || null,
                    description: item.description || null,
                    price: item.price,
                    date: item.date || null,
                    time: item.time || null,
                    notes: item.type === 'booking' ? bookingNotes : null
                }))
            })
        });

        const data = await response.json();

        if (data.paymentUrl) {
            if (data.paymentId) {
                localStorage.setItem("pendingPaymentId", data.paymentId);
            }
            // Redirect naar Mollie om de betaling af te ronden
            window.location.href = data.paymentUrl;
        } else {
            throw new Error(data.error || "Geen payment URL ontvangen");
        }
    } catch (error) {
        console.error("Checkout error:", error);
        alert("Er ging iets fout bij het afrekenen. Probeer het opnieuw.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Bevestig en ga verder";
    }
});
