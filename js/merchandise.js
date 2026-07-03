/* ============================================================
   MERCHANDISE PAGE - ALL MERCHANDISE ITEMS
============================================================ */
let strings = {};
let merchandise = {};
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let currentLang = localStorage.getItem("lang") || "nl";
let currentMode = localStorage.getItem("mode") || "miss";
let currentCategory = "lingerie";

localStorage.setItem("lang", currentLang);
localStorage.setItem("mode", currentMode);

const CATEGORY_MAP = {
    personal_items: "gedragen_lingerie",
    collars: "halsbanden",
    cages: "kooitjes"
};

/* ============================================================
   DOM ELEMENTS
============================================================ */
const accountModal = document.getElementById("accountModal");
const openAccount = document.getElementById("openAccount");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");
const openCart = document.getElementById("openCart");
const cartPanel = document.getElementById("cartPanel");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

/* ============================================================
   HELPERS
============================================================ */
function normalizeAssetPath(path) {
    if (!path) return "images/backgrounds/test.jpg";
    return path.replace(/^\.\.\//, "");
}

function normalizeCategory(category) {
    return CATEGORY_MAP[category] || category;
}

function getString(key, fallback = "") {
    const langStrings = strings[currentLang] || strings.nl || {};
    return langStrings[key] || fallback;
}

function translateValue(value, fallback = "") {
    if (value && typeof value === "object") {
        return value[currentLang] || value.nl || Object.values(value)[0] || fallback;
    }

    return value || fallback;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPrice(value) {
    return `\u20ac${Number.parseFloat(value || 0).toFixed(2)}`;
}

function toLabel(id) {
    if (!id) return "";

    return String(id)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getColorOptions(item) {
    if (Array.isArray(item.colorOptions)) {
        return item.colorOptions;
    }

    if (item.images && typeof item.images === "object") {
        return Object.entries(item.images).map(([id, image]) => ({
            id,
            label: {
                nl: toLabel(id),
                en: toLabel(id),
                fr: toLabel(id),
                de: toLabel(id)
            },
            image
        }));
    }

    if (item.colors && typeof item.colors === "object") {
        return Object.entries(item.colors)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([id]) => ({
                id,
                label: {
                    nl: toLabel(id),
                    en: toLabel(id),
                    fr: toLabel(id),
                    de: toLabel(id)
                },
                image: item.images && item.images[id] ? item.images[id] : ""
            }));
    }

    return [];
}

function getChoiceOptions(item) {
    if (!Array.isArray(item.options)) {
        return [];
    }

    const hasPricedExtras = item.options.some((option) => Number(option.price || 0) > 0);
    return hasPricedExtras ? [] : item.options;
}

function getExtraOptions(item) {
    if (!Array.isArray(item.options)) {
        return [];
    }

    return item.options.some((option) => Number(option.price || 0) > 0) ? item.options : [];
}

function getDefaultImage(item) {
    const colorOptions = getColorOptions(item);
    const firstColorImage = colorOptions[0] && colorOptions[0].image ? colorOptions[0].image : "";
    const firstGalleryImage = Array.isArray(item.gallery) && item.gallery.length ? item.gallery[0] : "";

    return normalizeAssetPath(firstColorImage || firstGalleryImage || item.image);
}

function getSelectedOption(card, item, group) {
    const activeButton = card.querySelector(`.tier[data-group="${group}"].active`);
    if (!activeButton) {
        return null;
    }

    if (group === "color") {
        return getColorOptions(item).find((option) => String(option.id) === activeButton.dataset.optionId) || null;
    }

    if (group === "size") {
        return (Array.isArray(item.sizeOptions) ? item.sizeOptions : [])
            .find((option) => String(option.id) === activeButton.dataset.optionId) || null;
    }

    if (group === "choice") {
        return getChoiceOptions(item).find((option) => String(option.id) === activeButton.dataset.optionId) || null;
    }

    return null;
}

function getSelectedExtras(card, item) {
    const extraOptions = getExtraOptions(item);

    return Array.from(card.querySelectorAll('.tier[data-group="extras"].active'))
        .map((button) => extraOptions.find((option) => String(option.id) === button.dataset.optionId))
        .filter(Boolean);
}

function renderSelectorBlock(label, options, group, mode = "single") {
    if (!options.length) {
        return "";
    }

    return `
        <div class="tier-selector-wrapper">
            <p class="selector-label">${escapeHtml(label)}</p>
            <div class="tier-selector tier-selector-fluid" data-group="${escapeHtml(group)}">
                ${options.map((option, index) => {
                    const optionLabel = translateValue(option.label, toLabel(option.id));
                    const optionPrice = Number(option.price || 0);
                    const optionImage = option.image ? normalizeAssetPath(option.image) : "";
                    const classes = [
                        "tier",
                        mode === "multi" ? "is-multi" : "",
                        mode === "single" && index === 0 ? "active" : ""
                    ].filter(Boolean).join(" ");

                    return `
                        <button
                            type="button"
                            class="${classes}"
                            data-group="${escapeHtml(group)}"
                            data-selection-mode="${escapeHtml(mode)}"
                            data-option-id="${escapeHtml(option.id || "")}"
                            data-option-label="${escapeHtml(optionLabel)}"
                            data-option-price="${escapeHtml(optionPrice)}"
                            data-option-image="${escapeHtml(optionImage)}"
                        >
                            ${escapeHtml(optionLabel)}
                        </button>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

function syncProductCard(card) {
    const itemKey = card.dataset.item;
    const item = merchandise[itemKey];
    if (!item) return;

    const title = translateValue(item.title);
    const description = translateValue(item.description);
    const selectedColor = getSelectedOption(card, item, "color");
    const selectedSize = getSelectedOption(card, item, "size");
    const selectedChoice = getSelectedOption(card, item, "choice");
    const selectedExtras = getSelectedExtras(card, item);

    let price = Number.parseFloat(item.price || 0);
    if (selectedSize && selectedSize.price != null) {
        price = Number.parseFloat(selectedSize.price);
    }
    if (selectedColor && selectedColor.price != null) {
        price += Number.parseFloat(selectedColor.price);
    }
    if (selectedChoice && selectedChoice.price != null) {
        price += Number.parseFloat(selectedChoice.price);
    }
    selectedExtras.forEach((option) => {
        price += Number.parseFloat(option.price || 0);
    });

    const detailParts = [
        selectedColor ? translateValue(selectedColor.label, toLabel(selectedColor.id)) : "",
        selectedSize ? translateValue(selectedSize.label, toLabel(selectedSize.id)) : "",
        selectedChoice ? translateValue(selectedChoice.label, toLabel(selectedChoice.id)) : "",
        ...selectedExtras.map((option) => translateValue(option.label, toLabel(option.id)))
    ].filter(Boolean);

    const detailText = detailParts.join(", ");
    const imagePath = normalizeAssetPath(
        (selectedColor && selectedColor.image) ||
        (Array.isArray(item.gallery) && item.gallery.length ? item.gallery[0] : "") ||
        item.image
    );

    const image = card.querySelector(".product-card-media img");
    if (image) {
        image.src = imagePath;
        image.alt = title;
    }

    const priceElement = card.querySelector(".product-price");
    if (priceElement) {
        priceElement.textContent = formatPrice(price);
    }

    const subElement = card.querySelector(".product-sub");
    if (subElement) {
        subElement.textContent = detailText || getString("one_time", "eenmalig");
    }

    const buyButton = card.querySelector(".buy-btn");
    if (buyButton) {
        buyButton.dataset.title = title;
        buyButton.dataset.description = description;
        buyButton.dataset.price = String(price);
        buyButton.dataset.image = imagePath;
        buyButton.dataset.details = detailText;
    }
}

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

    mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            menuToggle.classList.remove("active");
            mainNav.classList.remove("active");
        });
    });
}

if (langToggle) {
    const langBtn = langToggle.querySelector(".lang-btn");
    const langOptions = langToggle.querySelectorAll(".lang-option");

    if (langBtn) {
        langBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            langToggle.classList.toggle("active");

            if (menuToggle) menuToggle.classList.remove("active");
            if (mainNav) mainNav.classList.remove("active");
        });
    }

    langOptions.forEach((option) => {
        option.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            currentLang = option.dataset.lang;
            localStorage.setItem("lang", currentLang);

            langOptions.forEach((opt) => opt.classList.remove("active"));
            option.classList.add("active");

            updateTexts();
            renderMerchandise();
            langToggle.classList.remove("active");
        });
    });

    document.addEventListener("click", (e) => {
        if (!langToggle.contains(e.target)) {
            langToggle.classList.remove("active");
        }
    });

    const currentOption = langToggle.querySelector(`[data-lang="${currentLang}"]`);
    if (currentOption) {
        currentOption.classList.add("active");
    }
}

/* ============================================================
   INIT
============================================================ */
(async function init() {
    strings = await fetch("data/strings.json").then((r) => r.json());
    const data = await fetch("includes/merchandise.json").then((r) => r.json());
    merchandise = data.merchandise || {};

    const activeCategoryButton = document.querySelector(".category-btn.active");
    if (activeCategoryButton) {
        currentCategory = normalizeCategory(activeCategoryButton.dataset.category);
    }

    setupModeToggle();
    setupCategoryButtons();
    updateTexts();
    renderMerchandise();
    updateCartBadge();
})();

/* ============================================================
   TAAL (VLAGGETJES)
============================================================ */
document.querySelectorAll(".lang-select img").forEach((flag) => {
    flag.addEventListener("click", () => {
        currentLang = flag.dataset.lang;
        localStorage.setItem("lang", currentLang);
        updateTexts();
        renderMerchandise();
    });
});

/* ============================================================
   TEKSTEN
============================================================ */
function updateTexts() {
    document.querySelectorAll("[data-text]").forEach((element) => {
        const key = element.getAttribute("data-text");
        const text = getString(key);
        if (!text) return;

        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.placeholder = text;
        } else {
            element.textContent = text;
        }
    });

    const titleElement = document.querySelector("title[data-text]");
    if (titleElement) {
        const key = titleElement.getAttribute("data-text");
        const title = getString(key);
        if (title) {
            document.title = title;
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
            icon.textContent = currentMode === "mistress" ? "\u{1F48B}" : "\u{1F451}";
            modeToggleBtn.title = currentMode === "mistress"
                ? "Switch naar Miss Jolie"
                : "Switch naar Meesteres Jolie";
        }
    }

    const logo = document.querySelector(".logo");
    if (logo) {
        logo.textContent = currentMode === "mistress" ? "Meesteres Jolie" : "Miss Jolie";
    }
}

function setupModeToggle() {
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    if (!modeToggleBtn) return;

    modeToggleBtn.onclick = (e) => {
        e.preventDefault();
        currentMode = currentMode === "miss" ? "mistress" : "miss";
        localStorage.setItem("mode", currentMode);
        updateModeIcon();
        renderMerchandise();
    };

    updateModeIcon();
}

/* ============================================================
   CATEGORY BUTTONS
============================================================ */
function setupCategoryButtons() {
    const categoryBtns = document.querySelectorAll(".category-btn");

    categoryBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            categoryBtns.forEach((button) => button.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = normalizeCategory(btn.dataset.category);
            renderMerchandise();
        });
    });
}

/* ============================================================
   RENDER MERCHANDISE
============================================================ */
function renderMerchandise() {
    const container = document.getElementById("productsGrid");
    if (!container) return;

    const filteredItems = Object.entries(merchandise).filter(([, item]) => (
        item.active
        && item.mode === currentMode
        && normalizeCategory(item.category) === normalizeCategory(currentCategory)
    ));

    if (!filteredItems.length) {
        container.innerHTML = `
            <article class="product-empty-state">
                <h3>Geen producten gevonden</h3>
                <p>Voor deze categorie staat nog niets live. Kies een andere categorie of voeg eerst merchandise toe aan deze groep.</p>
            </article>
        `;
        return;
    }

    container.innerHTML = filteredItems.map(([key, item]) => {
        const title = translateValue(item.title);
        const description = translateValue(item.description);
        const colorOptions = getColorOptions(item);
        const sizeOptions = Array.isArray(item.sizeOptions) ? item.sizeOptions : [];
        const choiceOptions = getChoiceOptions(item);
        const extraOptions = getExtraOptions(item);

        return `
            <article class="product-card" data-item="${escapeHtml(key)}">
                <div class="product-card-media">
                    <img src="${escapeHtml(getDefaultImage(item))}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.onerror=null;this.src='images/backgrounds/test.jpg';">
                </div>
                <div class="product-card-content">
                    <h3>${escapeHtml(title)}</h3>
                    <p class="product-desc">${escapeHtml(description)}</p>

                    ${renderSelectorBlock(getString("select_color", "Kies kleur:"), colorOptions, "color")}
                    ${renderSelectorBlock(getString("select_size", "Kies maat:"), sizeOptions, "size")}
                    ${renderSelectorBlock(getString("select_options", "Selecteer je opties"), choiceOptions, "choice")}
                    ${renderSelectorBlock(getString("extra_options", "Extra opties:"), extraOptions, "extras", "multi")}

                    <p class="product-price">${formatPrice(item.price)}</p>
                    <p class="product-sub">${escapeHtml(getString("one_time", "eenmalig"))}</p>

                    <button class="buy-btn" data-item="${escapeHtml(key)}">
                        ${escapeHtml(getString("buy_now", "Koop Nu"))}
                    </button>
                </div>
            </article>
        `;
    }).join("");

    enableSelectorButtons();
    enableBuyButtons();
    container.querySelectorAll(".product-card").forEach(syncProductCard);
}

function enableSelectorButtons() {
    document.querySelectorAll(".tier").forEach((btn) => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            const group = btn.closest(".tier-selector");
            if (!card || !group) return;

            if (btn.dataset.selectionMode === "multi") {
                btn.classList.toggle("active");
            } else {
                group.querySelectorAll(".tier").forEach((peer) => {
                    peer.classList.remove("active");
                });
                btn.classList.add("active");
            }

            syncProductCard(card);
        };
    });
}

function enableBuyButtons() {
    document.querySelectorAll(".buy-btn").forEach((btn) => {
        btn.onclick = () => {
            const itemKey = btn.dataset.item;
            const item = merchandise[itemKey];
            if (!item) return;

            const title = btn.dataset.title || translateValue(item.title);
            const details = btn.dataset.details;
            const name = details ? `${title} (${details})` : title;

            addToCart({
                id: itemKey,
                name,
                description: btn.dataset.description || translateValue(item.description),
                price: Number.parseFloat(btn.dataset.price || item.price || 0),
                image: btn.dataset.image || getDefaultImage(item),
                type: "merchandise"
            });
        };
    });
}

function addToCart(item) {
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    showNotification(getString("notification_added_to_cart", "Item toegevoegd aan winkelmandje"), "success");
}

function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === "success" ? "#50ff96" : "#ff5050"};
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
        notification.style.animation = "slideOut 0.3s";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? "flex" : "none";
    }
}

/* ============================================================
   ACCOUNT
============================================================ */
if (openAccount) {
    openAccount.addEventListener("click", () => {
        const isLoggedIn = localStorage.getItem("loggedIn") === "true";
        window.location.href = isLoggedIn ? "account.html" : "login.html";
    });
}

if (registerBtn) {
    registerBtn.onclick = () => {
        if (!accountEmail.value || !accountPassword.value) {
            alert(getString("alert_fill_all", "Vul alles in."));
            return;
        }

        localStorage.setItem("account", JSON.stringify({
            email: accountEmail.value,
            password: accountPassword.value,
            purchases: []
        }));

        alert(getString("alert_account_created", "Account aangemaakt"));
    };
}

if (loginBtn) {
    loginBtn.onclick = () => {
        const acc = JSON.parse(localStorage.getItem("account"));
        if (!acc) {
            alert(getString("alert_no_account", "Geen account gevonden"));
            return;
        }

        if (acc.email === accountEmail.value && acc.password === accountPassword.value) {
            localStorage.setItem("loggedIn", "true");
            if (logoutBtn) logoutBtn.classList.remove("hidden");
            if (accountModal) accountModal.classList.add("hidden");

            if (confirm(getString("confirm_view_purchases", "Ingelogd! Wil je je gekochte content bekijken?"))) {
                window.location.href = "account.html";
            }
        } else {
            alert(getString("alert_wrong_credentials", "Onjuiste gegevens"));
        }
    };
}

if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem("loggedIn");
        logoutBtn.classList.add("hidden");
        alert(getString("alert_logged_out", "Uitgelogd"));
    };
}

/* ============================================================
   WINKELMAND
============================================================ */
if (openCart) {
    openCart.onclick = () => {
        window.location.href = "cart.html";
    };
}

if (closeCart) {
    closeCart.onclick = () => {
        if (!cartPanel) return;

        cartPanel.classList.remove("show");
        setTimeout(() => cartPanel.classList.add("hidden"), 300);
    };
}

const clearCartBtn = document.getElementById("clearCartBtn");
if (clearCartBtn) {
    clearCartBtn.onclick = () => {
        if (confirm(getString("confirm_clear_cart", "Weet je zeker dat je de winkelmandje wilt legen?"))) {
            cart = [];
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
            updateCartBadge();
        }
    };
}

function renderCart() {
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p class="small-text">${escapeHtml(getString("cart_empty", "Nog geen items toegevoegd."))}</p>`;
        cartTotal.textContent = "0.00";
        return;
    }

    cart.forEach((item) => {
        total += Number(item.price || 0);
        cartItems.innerHTML += `
            <div class="cart-row">
                <p>${escapeHtml(item.name)}</p>
                <p>${formatPrice(item.price)}</p>
            </div>
        `;
    });

    cartTotal.textContent = total.toFixed(2);
}

/* ============================================================
   CHECKOUT
============================================================ */
if (checkoutBtn) {
    checkoutBtn.onclick = async () => {
        if (!cartTotal) return;
        if (cart.length === 0) return;

        const loggedIn = localStorage.getItem("loggedIn");
        if (!loggedIn) {
            alert(getString("login_required", "Je moet eerst inloggen om af te rekenen."));
            if (accountModal) {
                accountModal.classList.remove("hidden");
            } else {
                window.location.href = "login.html";
            }
            return;
        }

        const hasPass = cart.some((item) => item.type === "pass");
        if (hasPass) {
            localStorage.setItem("pendingCheckout", "true");
            window.location.href = "checkout.html";
        } else {
            window.location.href = "betaald.html";
        }
    };
}
