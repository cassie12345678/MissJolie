/* ============================================================
   FOOI FUNCTIONALITEIT - TIP.JS
============================================================ */

// Open de fooi modal
function openTipModal() {
    const modal = document.getElementById('tipModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('customTipAmount').value = '';
    }
}

// Sluit de fooi modal
function closeTipModal() {
    const modal = document.getElementById('tipModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Selecteer een voorgedefinieerd bedrag
function selectTipAmount(amount) {
    document.getElementById('customTipAmount').value = amount;
}

// Voeg fooi toe aan winkelmand
function addTipToCart() {
    const customAmount = parseFloat(document.getElementById('customTipAmount').value);
    
    if (!customAmount || customAmount <= 0) {
        alert('Voer een geldig bedrag in.');
        return;
    }
    
    // Haal de huidige cart op
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Maak een fooi item
    const tipItem = {
        id: 'tip-' + Date.now(),
        name: '💝 Fooi',
        description: 'Bedankt voor je waardering!',
        price: customAmount.toFixed(2),
        type: 'tip',
        image: 'images/logo/miss-jolie-logo.jpeg'
    };
    
    // Voeg toe aan cart
    cart.push(tipItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart badge als die bestaat
    updateCartBadge();
    
    // Sluit modal
    closeTipModal();
    
    // Toon bevestiging
    alert(`Fooi van €${customAmount.toFixed(2)} toegevoegd aan winkelmand!`);
}

// Update cart badge (helper functie)
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

// Sluit modal bij klikken buiten de modal content
window.addEventListener('click', function(event) {
    const modal = document.getElementById('tipModal');
    if (modal && event.target === modal) {
        closeTipModal();
    }
});

// Sluit modal bij ESC toets
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeTipModal();
    }
});
