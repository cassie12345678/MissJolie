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
   DISCOUNT CODE
============================================================ */
let appliedDiscount = null; // { code, type, value, categories, products, amount }

function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
}

function itemMatchesDiscount(item, discount) {
    const categories = discount.categories || [];
    const products = discount.products || [];
    if (categories.includes('all')) return true;
    if (categories.includes(item.type)) return true;
    if (products.includes(item.id)) return true;
    return false;
}

function computeDiscountAmount(discount) {
    const applicableItems = cart.filter(item => itemMatchesDiscount(item, discount));
    const applicableSubtotal = applicableItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

    if (applicableSubtotal <= 0) return 0;

    if (discount.type === 'percentage') {
        return applicableSubtotal * (discount.value / 100);
    }
    // fixed amount, capped at the applicable subtotal
    return Math.min(discount.value, applicableSubtotal);
}

async function applyDiscountCode(rawCode) {
    const messageEl = document.getElementById("discountCodeMessage");
    const code = (rawCode || "").trim().toUpperCase();

    messageEl.className = "";
    messageEl.textContent = "";

    if (!code) {
        appliedDiscount = null;
        displayCartSummary();
        return;
    }

    try {
        const res = await fetch("includes/discount-codes.json");
        const data = await res.json();
        const codes = data.codes || [];
        const match = codes.find(c => (c.code || "").toUpperCase() === code);

        if (!match || !match.active) {
            throw new Error("Deze kortingscode bestaat niet of is niet meer geldig.");
        }
        if (match.expiryDate && new Date(match.expiryDate) < new Date()) {
            throw new Error("Deze kortingscode is verlopen.");
        }
        if (match.maxUses !== null && match.usedCount >= match.maxUses) {
            throw new Error("Deze kortingscode is al te vaak gebruikt.");
        }
        const subtotal = getCartSubtotal();
        if (match.minAmount && subtotal < match.minAmount) {
            throw new Error(`Deze kortingscode is pas geldig vanaf €${match.minAmount.toFixed(2)}.`);
        }

        const discountAmount = computeDiscountAmount(match);
        if (discountAmount <= 0) {
            throw new Error("Deze kortingscode is niet van toepassing op je winkelmandje.");
        }

        appliedDiscount = {
            code: match.code,
            type: match.type,
            value: match.value,
            categories: match.categories,
            products: match.products,
            amount: discountAmount
        };

        messageEl.textContent = `Kortingscode "${match.code}" toegepast!`;
        messageEl.className = "success";
    } catch (error) {
        appliedDiscount = null;
        messageEl.textContent = error.message || "Kon kortingscode niet toepassen.";
        messageEl.className = "error";
    }

    displayCartSummary();
}

document.getElementById("applyDiscountBtn").addEventListener("click", () => {
    applyDiscountCode(document.getElementById("discountCodeInput").value);
});

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

    let finalTotal = total;

    if (appliedDiscount) {
        finalTotal = Math.max(0, total - appliedDiscount.amount);
        html += `
            <div class="summary-item discount-row">
                <span>Korting (${appliedDiscount.code}):</span>
                <span>-€${appliedDiscount.amount.toFixed(2)}</span>
            </div>
        `;
    }

    html += `
        <div class="summary-total">
            <div class="summary-item">
                <span>Totaal:</span>
                <span>€${finalTotal.toFixed(2)}</span>
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

    const total = getCartSubtotal();
    const finalAmount = appliedDiscount ? Math.max(0, total - appliedDiscount.amount) : total;
    const userId = localStorage.getItem("userId");

    try {
        const response = await fetch("includes/checkout.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: finalAmount.toFixed(2),
                discount_code: appliedDiscount ? appliedDiscount.code : null,
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
