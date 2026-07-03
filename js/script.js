/* ============================================================
   BASIS STATE
============================================================ */
let strings = {};
let collections = {};
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let currentLang = localStorage.getItem("lang") || "nl";
let currentMode = localStorage.getItem("mode") || "miss";

localStorage.setItem("lang", currentLang);
localStorage.setItem("mode", currentMode);

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
        // Close language dropdown if open
        if (langToggle) langToggle.classList.remove("active");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
            menuToggle.classList.remove("active");
            mainNav.classList.remove("active");
        }
    });

    // Close menu when clicking nav link
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
    const data = await fetch("includes/collections.json").then(r => r.json());
    collections = data.collections;

    setupModeToggle();
    updateTexts();
    renderCollections();
    updateCartBadge();
})();

/* ============================================================
   DOM ELEMENTS
============================================================ */
const openAccount = document.getElementById("openAccount");
const cartPanel = document.getElementById("cartPanel");

// Account button: redirect naar account.html of login.html
if (openAccount) {
    openAccount.addEventListener('click', () => {
        const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
        window.location.href = isLoggedIn ? 'account.html' : 'login.html';
    });
}
const openCart = document.getElementById("openCart");

/* ============================================================
   TAAL (Vlaggetjes)
============================================================ */
document.querySelectorAll(".lang-select img").forEach(flag => {
    flag.addEventListener("click", () => {
        currentLang = flag.dataset.lang;
        localStorage.setItem("lang", currentLang);
        updateTexts();
        renderCollections();
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
                element.innerHTML = strings[currentLang][key];
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
    
    // Update logo based on mode
    const logo = document.querySelector(".logo");
    if (logo) {
        logo.textContent = currentMode === "mistress" ? "Meesteres Jolie" : "Miss Jolie";
    }

    // Backward compatibility: Update specific elements if they exist and don't have data-text
    if (accountEmail && !accountEmail.hasAttribute('data-text')) {
        accountEmail.placeholder = strings[currentLang].placeholder_email || strings[currentLang].email;
    }
    if (accountPassword && !accountPassword.hasAttribute('data-text')) {
        accountPassword.placeholder = strings[currentLang].placeholder_password || strings[currentLang].password;
    }
    if (loginBtn && !loginBtn.hasAttribute('data-text')) {
        loginBtn.textContent = strings[currentLang].button_login || strings[currentLang].login;
    }
    if (registerBtn && !registerBtn.hasAttribute('data-text')) {
        registerBtn.textContent = strings[currentLang].button_register || strings[currentLang].register;
    }
    if (logoutBtn && !logoutBtn.hasAttribute('data-text')) {
        logoutBtn.textContent = strings[currentLang].button_logout || strings[currentLang].logout;
    }
    if (checkoutBtn && !checkoutBtn.hasAttribute('data-text')) {
        checkoutBtn.textContent = strings[currentLang].button_checkout || strings[currentLang].checkout;
    }
    if (closeCart && !closeCart.hasAttribute('data-text')) {
        closeCart.textContent = strings[currentLang].close;
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
            updateTexts();
            if (typeof renderCollections === 'function') {
                renderCollections();
            }
        };
        updateModeIcon();
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
    showNotification(strings[currentLang]?.notification_added_to_cart || '✅ Item toegevoegd aan winkelmandje', 'success');
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
   COLLECTIES
============================================================ */
function renderCollections() {
    const container = document.getElementById("collections");
    if (!container) return;

    container.innerHTML = "";

    Object.keys(collections).forEach(key => {
        const col = collections[key];
        if (!col.active || col.mode !== currentMode) return;

        const tiers = Object.keys(col.tiers).filter(t => col.tiers[t]);
        const defaultTier = tiers[0];
        const defaultPrice = col.prices[defaultTier];

        container.innerHTML += `
            <div class="product-card">
                <img src="${col.image}">
                <h3>${col.title}</h3>
                <p class="product-desc">${col.description}</p>

                <div class="tier-selector">
                    ${tiers.map((t,i)=>`
                        <button class="tier ${i===0?'active':''}" data-tier="${t}">${t}</button>
                    `).join("")}
                </div>

                <p class="product-price">€${defaultPrice}</p>
                <p class="product-sub">${strings[currentLang].one_time}</p>

                <button class="buy-btn" data-collection="${key}">
                    ${strings[currentLang].buy_now}
                </button>
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

            const collection = card.querySelector(".buy-btn").dataset.collection;
            const price = collections[collection].prices[btn.dataset.tier];
            card.querySelector(".product-price").textContent = "€" + price;
        };
    });
}

function enableBuyButtons() {
    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            const tier = card.querySelector(".tier.active").dataset.tier;
            const collectionKey = btn.dataset.collection;
            const price = collections[collectionKey].prices[tier];

            addToCart({ 
                name: collections[collectionKey].title,
                tier: tier,
                price: price,
                type: 'collection'
            });
        };
    });
}

/* ============================================================
   CHECKOUT
============================================================ */
if (checkoutBtn) checkoutBtn.onclick = async () => {
    if (!cartTotal) return;
    const total = parseFloat(cartTotal.textContent);
    if (cart.length === 0) return; // Check cart heeft items

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
        localStorage.setItem("pendingCheckout", "true");
        window.location.href = "checkout.html";
    } else {
        window.location.href = "betaald.html";
    }
};
