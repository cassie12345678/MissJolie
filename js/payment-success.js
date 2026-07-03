localStorage.removeItem("pendingCheckout");
localStorage.removeItem("pendingBooking");
localStorage.removeItem("customerData");
localStorage.setItem("cart", "[]");

const paymentBadge = document.getElementById("cartBadge");
if (paymentBadge) {
    paymentBadge.textContent = "0";
    paymentBadge.style.display = "none";
}

// Fallback: als de Mollie webhook gefaald heeft, sla aankoop alsnog op
(async function verifyAndSavePurchase() {
    const paymentId = localStorage.getItem("pendingPaymentId");
    if (!paymentId || !localStorage.getItem("loggedIn")) {
        return;
    }

    localStorage.removeItem("pendingPaymentId");

    try {
        const response = await fetch("includes/verify-payment.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_id: paymentId })
        });

        const data = await response.json();

        if (data.success && !data.alreadySaved) {
            console.log("Aankoop alsnog opgeslagen via fallback:", data.message);
        }
    } catch (error) {
        console.error("Fout bij fallback verificatie:", error);
    }
})();
