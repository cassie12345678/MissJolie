/* ============================================================
   WINKELMANDJE PAGINA - CART.JS
============================================================ */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
if (!Array.isArray(cart)) {
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
}
let strings = {};
let currentLang = localStorage.getItem("lang") || "nl";

function normalizeAssetPath(path) {
    if (!path) return 'images/backgrounds/test.jpg';
    return path.replace(/^\.\.\//, '');
}

/* ============================================================
   CUSTOM MODAL HELPERS
============================================================ */
function showModal(message, type = 'info') {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(to bottom, #1b1b20, #121216);
        padding: 40px;
        border-radius: 22px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 0 50px rgba(255, 102, 196, 0.5);
        border: 2px solid ${type === 'error' ? '#ff5050' : '#ff66c4'};
    `;
    
    modalContent.innerHTML = `
        <p style="color: #fff; font-size: 18px; margin-bottom: 30px; line-height: 1.6;">${message}</p>
        <button style="
            background: linear-gradient(135deg, #ff66c4, #ff3d9a);
            border: none;
            color: white;
            padding: 15px 40px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        ">OK</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    modal.querySelector('button').onclick = () => {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        }
    };
}

function showConfirm(message, onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(to bottom, #1b1b20, #121216);
        padding: 40px;
        border-radius: 22px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 0 50px rgba(255, 102, 196, 0.5);
        border: 2px solid #ff66c4;
    `;
    
    modalContent.innerHTML = `
        <p style="color: #fff; font-size: 18px; margin-bottom: 30px; line-height: 1.6;">${message}</p>
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button class="cancel-btn" style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #666;
                color: #fff;
                padding: 15px 40px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            ">Annuleren</button>
            <button class="confirm-btn" style="
                background: linear-gradient(135deg, #ff66c4, #ff3d9a);
                border: none;
                color: white;
                padding: 15px 40px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            ">OK</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').onclick = () => {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.confirm-btn').onclick = () => {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
        onConfirm();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        }
    };
}

/* ============================================================
   INIT
============================================================ */
(async function init() {
    // Load strings
    strings = await fetch("data/strings.json").then(r => r.json());
    
    renderCart();
    updateCartBadge();
    setupEventListeners();
})();

/* ============================================================
   RENDER CART
============================================================ */
function renderCart() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const itemCount = document.getElementById('itemCount');
    
    if (cart.length === 0) {
        cartItemsList.style.display = 'none';
        emptyCart.style.display = 'block';
        itemCount.textContent = '0';
        updateSummary();
        return;
    }
    
    cartItemsList.style.display = 'block';
    emptyCart.style.display = 'none';
    itemCount.textContent = cart.length;
    
    cartItemsList.innerHTML = cart.map((item, index) => {
        // Zorg dat elke item een afbeelding heeft
        const itemImage = normalizeAssetPath(item.image);
        
        return `
        <div class="cart-item" data-index="${index}">
            <img src="${itemImage}" alt="${item.name}" class="cart-item-image" onerror="this.src='images/backgrounds/test.jpg'">
            
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>${item.description || ''}</p>
                <span class="cart-item-type">${getTypeLabel(item.type)}</span>
            </div>
            
            <div class="cart-item-actions">
                <div class="cart-item-price">€${parseFloat(item.price).toFixed(2)}</div>
                <button class="btn-remove" onclick="removeFromCart(${index})">
                    🗑️ Verwijderen
                </button>
            </div>
        </div>
    `}).join('');
    
    updateSummary();
}

/* ============================================================
   UPDATE SUMMARY
============================================================ */
function updateSummary() {
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    document.getElementById('subtotal').textContent = `€${total.toFixed(2)}`;
    document.getElementById('tax').textContent = `€0.00`;
    document.getElementById('total').textContent = `€${total.toFixed(2)}`;
    
    // Disable checkout als cart leeg is
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = cart.length === 0;
}

/* ============================================================
   UPDATE CART BADGE
============================================================ */
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

/* ============================================================
   REMOVE FROM CART
============================================================ */
function removeFromCart(index) {
    showConfirm(strings[currentLang]?.confirm_remove_item || 'Weet je zeker dat je dit item wilt verwijderen?', () => {
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
        updateCartBadge();
        
        // Toon notificatie
        showNotification(strings[currentLang]?.notification_removed_from_cart || 'Item verwijderd uit winkelmandje', 'success');
    });
}

/* ============================================================
   CLEAR CART
============================================================ */
function clearCart() {
    if (cart.length === 0) return;
    
    showConfirm(strings[currentLang]?.confirm_clear_cart || 'Weet je zeker dat je alle items wilt verwijderen?', () => {
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
        updateCartBadge();
        showNotification(strings[currentLang]?.notification_cart_cleared || 'Winkelmandje geleegd', 'success');
    });
}

/* ============================================================
   CHECKOUT
============================================================ */
async function proceedToCheckout() {
    if (cart.length === 0) return;
    
    // Check of user is ingelogd
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Sla cart op en redirect naar login
        showConfirm(strings[currentLang]?.confirm_login_checkout || 'Je moet inloggen om af te rekenen. Naar login pagina?', () => {
            window.location.href = 'login.html';
        });
        return;
    }

    // Altijd via checkout.html: daar worden klantgegevens verzameld en kan een
    // kortingscode worden toegepast voordat er naar Mollie wordt doorgestuurd.
    localStorage.setItem('pendingCheckout', 'true');
    window.location.href = 'checkout.html';
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */
function getTypeLabel(type) {
    const labels = {
        'collection': strings[currentLang]?.type_video_collection || '🎬 Video Collection',
        'merchandise': strings[currentLang]?.type_merchandise || '👕 Merchandise',
        'pass': strings[currentLang]?.type_pass || '🎫 Pass',
        'booking': strings[currentLang]?.type_booking || '📅 Boeking'
    };
    return labels[type] || type;
}

function showNotification(message, type = 'info') {
    // Maak notificatie element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#50ff96' : type === 'error' ? '#ff5050' : '#ff66c4'};
        color: #000;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Verwijder na 3 seconden
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/* ============================================================
   EVENT LISTENERS
============================================================ */
function setupEventListeners() {
    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);
    
    // Clear cart button
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    
    // Cart icon in header
    const cartIcon = document.getElementById('openCart');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
}

/* ============================================================
   MOBILE MENU (Copy van andere pagina's)
============================================================ */
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const langToggle = document.getElementById("langToggle");

if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle("active");
        mainNav.classList.toggle("active");
        if (langToggle) langToggle.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
        if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
            menuToggle.classList.remove("active");
            mainNav.classList.remove("active");
        }
    });

    mainNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menuToggle.classList.remove("active");
            mainNav.classList.remove("active");
        });
    });
}

// Language dropdown
if (langToggle) {
    const langBtn = langToggle.querySelector(".lang-btn");
    const langOptions = langToggle.querySelectorAll(".lang-option");
    
    // Toggle dropdown on button click
    if (langBtn) {
        langBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            langToggle.classList.toggle("active");
            
            // Close main menu if open
            if (menuToggle) menuToggle.classList.remove("active");
            if (mainNav) mainNav.classList.remove("active");
        });
    }

    // Handle language selection
    langOptions.forEach(option => {
        option.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = option.dataset.lang;
            
            // Remove active from all
            langOptions.forEach(opt => opt.classList.remove("active"));
            // Add active to selected
            option.classList.add("active");
            
            // Update language
            currentLang = lang;
            localStorage.setItem("lang", lang);
            if (typeof updateTexts === 'function') {
                updateTexts();
            }
            if (typeof renderCart === 'function') {
                renderCart();
            }
            
            // Close dropdown
            langToggle.classList.remove("active");
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!langToggle.contains(e.target)) {
            langToggle.classList.remove("active");
        }
    });
    
    // Set initial active language
    const currentOption = langToggle.querySelector(`[data-lang="${currentLang}"]`);
    if (currentOption) {
        currentOption.classList.add("active");
    }
}

// CSS Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
