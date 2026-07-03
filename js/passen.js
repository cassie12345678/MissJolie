/* ============================================================
   PASSEN PAGE - ALL SNAPCHAT PASSES
============================================================ */
let strings = {};
let passes = {};
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let currentLang = localStorage.getItem("lang") || "nl";
let currentMode = localStorage.getItem("mode") || "miss";

localStorage.setItem("lang", currentLang);
localStorage.setItem("mode", currentMode);

/* ============================================================
   DOM ELEMENTS
============================================================ */
const openAccount = document.getElementById("openAccount");

// Account button: redirect naar account.html of login.html
if (openAccount) {
    openAccount.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
        window.location.href = isLoggedIn ? 'account.html' : 'login.html';
    });
}
const openCart = document.getElementById("openCart");
const accountModal = document.getElementById("accountModal");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");
const cartPanel = document.getElementById("cartPanel");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

/* ============================================================
   MOBILE MENU TOGGLE
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
            if (typeof renderPasses === 'function') {
                renderPasses();
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

/* ============================================================
   INIT
============================================================ */
(async function init() {
    strings = await fetch("data/strings.json").then(r => r.json());
    const data = await fetch("includes/passes.json").then(r => r.json());
    passes = data.passes;

    setupModeToggle();
    updateTexts();
    renderPasses();
    updateCartBadge();
})();

/* ============================================================
   TAAL (Vlaggetjes)
============================================================ */
document.querySelectorAll(".lang-select img").forEach(flag => {
    flag.addEventListener("click", () => {
        currentLang = flag.dataset.lang;
        localStorage.setItem("lang", currentLang);
        updateTexts();
        renderPasses();
    });
});

/* ============================================================
   TEKSTEN
============================================================ */
function updateTexts() {
    // Update all elements with data-text attribute
    document.querySelectorAll('[data-text]').forEach(element => {
        const key = element.getAttribute('data-text');
        if (strings[currentLang] && strings[currentLang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = strings[currentLang][key];
            } else {
                element.textContent = strings[currentLang][key];
            }
        }
    });

    // Update page title if it has data-text
    const titleElement = document.querySelector('title[data-text]');
    if (titleElement) {
        const key = titleElement.getAttribute('data-text');
        if (strings[currentLang] && strings[currentLang][key]) {
            document.title = strings[currentLang][key];
        }
    }
}

/* ============================================================
   MODE SWITCH
============================================================ */
function updateModeIcon() {
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    if (modeToggleBtn) {
        const icon = modeToggleBtn.querySelector(".mode-icon");
        if (icon) {
            // Toon het icoon van de ANDERE modus (waar je naartoe gaat)
            // Als je in mistress zit, toon kusje (om naar Miss te gaan)
            // Als je in miss zit, toon kroontje (om naar Meesteres te gaan)
            icon.textContent = currentMode === "mistress" ? "💋" : "👑";
            modeToggleBtn.title = currentMode === "mistress" 
                ? "Switch naar Miss Jolie" 
                : "Switch naar Meesteres Jolie";
        }
    }
    
    // Update logo text
    const logo = document.querySelector(".logo");
    if (logo) {
        logo.textContent = currentMode === "mistress" ? "Meesteres Jolie" : "Miss Jolie";
    }
}

function setupModeToggle() {
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    
    if (modeToggleBtn) {
        modeToggleBtn.onclick = (e) => {
            e.preventDefault();
            currentMode = currentMode === "miss" ? "mistress" : "miss";
            localStorage.setItem("mode", currentMode);
            updateModeIcon();
        };
        updateModeIcon();
    }
}

/* ============================================================
   RENDER PASSES
============================================================ */
function renderPasses() {
    const container = document.getElementById("passesGrid");
    if (!container) return;
    
    container.innerHTML = "";

    Object.keys(passes).forEach(key => {
        const pass = passes[key];
        if (!pass.active) return;

        const tiers = Object.keys(pass.tiers).filter(t => pass.tiers[t]);
        const defaultTier = tiers[0];
        const defaultPrice = pass.prices[defaultTier];

        // Get translated title, description and duration
        const title = typeof pass.title === 'object' ? (pass.title[currentLang] || pass.title.nl) : pass.title;
        const description = typeof pass.description === 'object' ? (pass.description[currentLang] || pass.description.nl) : pass.description;
        const defaultDuration = typeof pass.durations[defaultTier] === 'object' 
            ? (pass.durations[defaultTier][currentLang] || pass.durations[defaultTier].nl)
            : pass.durations[defaultTier];

        // Maak 2 rijen van knoppen: 3 boven, 2 onder
        const firstRowTiers = tiers.slice(0, 3);
        const secondRowTiers = tiers.slice(3);

        container.innerHTML += `
            <div class="product-card">
                <div class="product-card-media">
                    <img src="${pass.image}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='images/backgrounds/test.jpg'">
                </div>
                <div class="product-card-content">
                    <h3>${title}</h3>
                    <p class="product-desc">${description}</p>

                <div class="tier-selector-wrapper">
                    <div class="tier-selector">
                        ${firstRowTiers.map((t,i)=>`
                            <button class="tier ${i===0?'active':''}" data-tier="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>
                        `).join("")}
                    </div>
                    ${secondRowTiers.length > 0 ? `
                        <div class="tier-selector">
                            ${secondRowTiers.map(t=>`
                                <button class="tier" data-tier="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>
                            `).join("")}
                        </div>
                    ` : ''}
                </div>

                <p class="product-price">€${defaultPrice.toFixed(2)}</p>
                <p class="product-sub">${defaultDuration}</p>

                    <button class="buy-btn" data-pass="${key}">
                        ${strings[currentLang]?.buy_now || "Koop Nu"}
                    </button>
                </div>
            </div>
        `;
    });

    enableTierSwitching();
    enableBuyButtons();
}

function enableTierSwitching() {
    document.querySelectorAll(".tier").forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            card.querySelectorAll(".tier").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const passKey = card.querySelector(".buy-btn").dataset.pass;
            const tier = btn.dataset.tier;
            const price = passes[passKey].prices[tier];
            const durationObj = passes[passKey].durations[tier];
            const duration = typeof durationObj === 'object' 
                ? (durationObj[currentLang] || durationObj.nl)
                : durationObj;
            
            card.querySelector(".product-price").textContent = "€" + price.toFixed(2);
            card.querySelector(".product-sub").textContent = duration;
        };
    });
}

function enableBuyButtons() {
    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            const tier = card.querySelector(".tier.active").dataset.tier;
            const passKey = btn.dataset.pass;
            const pass = passes[passKey];
            const price = pass.prices[tier];

            const title = typeof pass.title === 'object' ? (pass.title[currentLang] || pass.title.nl) : pass.title;
            const durationObj = pass.durations[tier];
            const duration = typeof durationObj === 'object'
                ? (durationObj[currentLang] || durationObj.nl)
                : durationObj;
            const img = card.querySelector("img");
            
            addToCart({ 
                name: title,
                tier: tier,
                price: price,
                duration: duration,
                image: img ? img.src : 'images/backgrounds/test.jpg',
                type: 'pass'
            });
        };
    });
}

function addToCart(item) {
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Update cart badge
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
    
    // Toon notificatie
    showNotification('✅ Item toegevoegd aan winkelmandje', 'success');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#50ff96' : '#ff5050'};
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

/* ============================================================
   ACCOUNT
============================================================ */
// Account button handler is defined earlier in the file

if (registerBtn) registerBtn.onclick = () => {
    if (!accountEmail.value || !accountPassword.value) {
        alert(strings[currentLang]?.alert_fill_all || "Vul alles in.");
        return;
    }
    localStorage.setItem("account", JSON.stringify({
        email: accountEmail.value,
        password: accountPassword.value,
        purchases: []
    }));
    alert(strings[currentLang]?.alert_account_created || "Account aangemaakt");
};

if (loginBtn) loginBtn.onclick = () => {
    const acc = JSON.parse(localStorage.getItem("account"));
    if (!acc) return alert(strings[currentLang]?.alert_no_account || "Geen account gevonden");

    if (acc.email === accountEmail.value && acc.password === accountPassword.value) {
        localStorage.setItem("loggedIn", "true");
        logoutBtn.classList.remove("hidden");
        accountModal.classList.add("hidden");
        
        if (confirm(strings[currentLang]?.confirm_view_purchases || "Ingelogd! Wil je je gekochte content bekijken?")) {
            window.location.href = "account.html";
        }
    } else {
        alert(strings[currentLang]?.alert_wrong_credentials || "Onjuiste gegevens");
    }
};

if (logoutBtn) logoutBtn.onclick = () => {
    localStorage.removeItem("loggedIn");
    logoutBtn.classList.add("hidden");
    alert(strings[currentLang]?.alert_logged_out || "Uitgelogd");
};

/* ============================================================
   WINKELMAND
============================================================ */
if (openCart) openCart.onclick = () => {
    window.location.href = 'cart.html';
};

if (closeCart) closeCart.onclick = () => {
    if (cartPanel) {
        cartPanel.classList.remove("show");
        setTimeout(() => cartPanel.classList.add("hidden"), 300);
    }
};

const clearCartBtn = document.getElementById("clearCartBtn");
if (clearCartBtn) clearCartBtn.onclick = () => {
    if (confirm(strings[currentLang]?.confirm_clear_cart || "Weet je zeker dat je de winkelmandje wilt legen?")) {
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
    }
};

function renderCart() {
    if (!cartItems || !cartTotal) return;
    
    cartItems.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p class="small-text">${strings[currentLang]?.cart_empty || 'Nog geen items toegevoegd.'}</p>`;
        cartTotal.textContent = "0.00";
        return;
    }

    cart.forEach(item => {
        total += item.price;
        const displayName = item.tier ? `${item.name} (${item.tier})` : item.name;
        cartItems.innerHTML += `
            <div class="cart-row">
                <p>${displayName}</p>
                <p>€${item.price.toFixed(2)}</p>
            </div>
        `;
    });

    cartTotal.textContent = total.toFixed(2);
}

/* ============================================================
   CHECKOUT
============================================================ */
if (checkoutBtn) checkoutBtn.onclick = async () => {
    if (!cartTotal) return;
    
    const total = parseFloat(cartTotal.textContent);
    if (cart.length === 0) return;

    // Check if user is logged in
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
        alert(strings[currentLang]?.login_required || "Je moet eerst inloggen om af te rekenen.");
        accountModal.classList.remove("hidden");
        return;
    }

    // Check if cart contains passes - need extra info
    const hasPass = cart.some(item => item.type === 'pass');
    
    if (hasPass) {
        // Redirect to checkout page with form
        localStorage.setItem("pendingCheckout", "true");
        window.location.href = "checkout.html";
    } else {
        // Direct checkout for non-pass items
        window.location.href = "betaald.html";
    }
};
