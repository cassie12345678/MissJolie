/* ============================================================
   AUTH HELPER - Gebruik deze in alle pagina's
   Voeg toe: <script src="js/auth-helper.js"></script>
============================================================ */

// Check login status en redirect account button
function setupAccountButton() {
    const accountBtn = document.getElementById('openAccount');
    
    if (accountBtn) {
        // Verwijder oude event listeners door te clonen
        const newAccountBtn = accountBtn.cloneNode(true);
        accountBtn.parentNode.replaceChild(newAccountBtn, accountBtn);
        
        // Voeg nieuwe click handler toe
        newAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
            
            if (isLoggedIn) {
                window.location.href = 'account.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
}

function setupCartButton() {
    const cartBtn = document.getElementById('openCart');

    if (cartBtn) {
        const newCartBtn = cartBtn.cloneNode(true);
        cartBtn.parentNode.replaceChild(newCartBtn, cartBtn);

        newCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'cart.html';
        });
    }
}

// Logout functie
function logout() {
    fetch('includes/auth-logout.php')
        .then(() => {
            localStorage.clear();
            window.location.href = 'login.html';
        })
        .catch(() => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupAccountButton();
        setupCartButton();
    });
} else {
    setupAccountButton();
    setupCartButton();
}

// Voeg ook toe aan window voor globale toegang
window.logout = logout;
window.setupAccountButton = setupAccountButton;
window.setupCartButton = setupCartButton;
