/* ============================================================
   CHECKOUT INTEGRATIE VOORBEELD
   Voeg deze code toe aan je bestaande checkout.js
============================================================ */

// Voorbeeld: Update je bestaande checkout functie
async function processCheckout(cartItems, totalAmount) {
    // Check of user is ingelogd
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Optioneel: forceer login voor checkout
        if (confirm('Je moet inloggen om te kunnen afrekenen. Naar login pagina?')) {
            // Sla cart op zodat het bewaard blijft na login
            localStorage.setItem('pendingCheckout', JSON.stringify(cartItems));
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Bereid items voor database
    const items = cartItems.map(item => ({
        type: item.type,        // 'collection', 'merchandise', of 'pass'
        id: item.id,
        name: item.name,
        price: item.price
    }));
    
    // Maak Mollie payment met metadata
    const response = await fetch('includes/checkout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: totalAmount,
            user_id: localStorage.getItem('userId'),
            items: items  // Stuur items mee voor webhook
        })
    });
    
    const data = await response.json();
    
    if (data.paymentUrl) {
        // Redirect naar Mollie
        window.location.href = data.paymentUrl;
    }
}

// Na terugkomst van Mollie (op betaald.html)
// Deze code komt op betaald.html
async function handlePaymentSuccess() {
    if (localStorage.getItem('loggedIn') === 'true') {
        // Refresh user data om nieuwe purchases te laden
        try {
            const response = await fetch('includes/auth-check.php');
            const data = await response.json();
            
            if (data.authenticated) {
                localStorage.setItem('userPurchases', JSON.stringify(data.user.purchases || []));
                localStorage.setItem('userCollections', JSON.stringify(data.user.collections || []));
            }
        } catch (error) {
            console.error('Error refreshing purchases:', error);
        }
    }
}

// Herstel cart na login
function restorePendingCheckout() {
    const pending = localStorage.getItem('pendingCheckout');
    if (pending) {
        const cartItems = JSON.parse(pending);
        localStorage.removeItem('pendingCheckout');
        
        // Herstel cart en ga door naar checkout
        // Dit is afhankelijk van je cart implementatie
        cartItems.forEach(item => {
            // Voeg item terug toe aan cart
        });
    }
}

// Run op login success
if (localStorage.getItem('loggedIn') === 'true') {
    restorePendingCheckout();
}
