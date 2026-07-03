/* ============================================================
   COLLECTIONS PAGE - ALL VIDEO BUNDLES
============================================================ */
let strings = {};
let collections = {};
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let userPurchases = readStoredArray("userPurchases");
let userCollections = readStoredArray("userCollections");
let requestedCollectionId = new URLSearchParams(window.location.search).get("view");

if (!Array.isArray(cart)) {
    cart = [];
}

let currentLang = localStorage.getItem("lang") || "nl";
let currentMode = localStorage.getItem("mode") || "miss";

const {
    DEFAULT_COLLECTION_IMAGE,
    getActiveCollectionTiers,
    applyCollectionImage,
    getRenderedCollectionImage
} = window.collectionMedia;

localStorage.setItem("lang", currentLang);
localStorage.setItem("mode", currentMode);

/* ============================================================
   DOM ELEMENTS
============================================================ */
const openAccount = document.getElementById("openAccount");
const openCart = document.getElementById("openCart");
const collectionViewerShell = document.getElementById("collectionViewerShell");
const collectionViewer = document.getElementById("collectionViewer");

// Als er een ?view= param is, toon de viewer direct met loading state VOOR de async init
if (requestedCollectionId && collectionViewerShell && collectionViewer) {
    collectionViewer.innerHTML = `
        <div class="collection-viewer-card collection-state">
            <div class="collection-viewer-head">
                <div class="collection-viewer-copy">
                    <p class="collection-viewer-eyebrow">Bundel toegang</p>
                    <h2>Bundel wordt geladen...</h2>
                    <p>Even geduld terwijl je aankoop wordt geverifieerd.</p>
                </div>
            </div>
        </div>
    `;
    collectionViewerShell.hidden = false;
    collectionViewerShell.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "instant" });
}

// Account button: redirect to account.html or login.html
if (openAccount) {
    openAccount.addEventListener("click", () => {
        const isLoggedIn = localStorage.getItem("loggedIn") === "true";
        window.location.href = isLoggedIn ? "account.html" : "login.html";
    });
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

// Language dropdown
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

            currentLang = option.dataset.lang || "nl";
            localStorage.setItem("lang", currentLang);

            langOptions.forEach((item) => item.classList.remove("active"));
            option.classList.add("active");

            updateTexts();
            renderCollections();
            renderRequestedCollection();
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
    try {
        const [stringsResponse, collectionsResponse] = await Promise.all([
            fetch("data/strings.json"),
            fetch("includes/collections.json")
        ]);

        strings = await stringsResponse.json();
        const data = await collectionsResponse.json();
        collections = data.collections || {};

        await refreshPurchasedContent();
        setupModeToggle();
        updateTexts();
        renderCollections();
        renderRequestedCollection();
        updateCartBadge();
    } catch (error) {
        console.error("Collections init error:", error);
        const container = document.getElementById("collections");
        if (container) {
            container.innerHTML = `
                <div class="product-empty-state">
                    <h3>Bundels konden niet worden geladen</h3>
                    <p>Ververs de pagina en probeer het opnieuw.</p>
                </div>
            `;
        }
    }
})();

/* ============================================================
   LANGUAGE FLAGS
============================================================ */
document.querySelectorAll(".lang-select img").forEach((flag) => {
    flag.addEventListener("click", () => {
        currentLang = flag.dataset.lang;
        localStorage.setItem("lang", currentLang);
        updateTexts();
        renderCollections();
        renderRequestedCollection();
    });
});

/* ============================================================
   TEXTS
============================================================ */
function updateTexts() {
    document.querySelectorAll("[data-text]").forEach((element) => {
        const key = element.getAttribute("data-text");
        if (strings[currentLang] && strings[currentLang][key]) {
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                element.placeholder = strings[currentLang][key];
            } else {
                element.textContent = strings[currentLang][key];
            }
        }
    });

    const titleElement = document.querySelector("title[data-text]");
    if (titleElement) {
        const key = titleElement.getAttribute("data-text");
        if (strings[currentLang] && strings[currentLang][key]) {
            document.title = strings[currentLang][key];
        }
    }

    const logo = document.querySelector(".logo");
    if (logo) {
        logo.textContent = currentMode === "mistress" ? "Meesteres Jolie" : "Miss Jolie";
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
            icon.textContent = currentMode === "mistress" ? "Kiss" : "Crown";
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

    if (modeToggleBtn) {
        modeToggleBtn.onclick = (e) => {
            e.preventDefault();
            currentMode = currentMode === "miss" ? "mistress" : "miss";
            localStorage.setItem("mode", currentMode);
            updateModeIcon();
            updateTexts();
            renderCollections();
            renderRequestedCollection();
        };
        updateModeIcon();
    }
}

/* ============================================================
   PURCHASED CONTENT ACCESS
============================================================ */
function readStoredArray(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

async function refreshPurchasedContent() {
    userPurchases = readStoredArray("userPurchases");
    userCollections = readStoredArray("userCollections");

    if (localStorage.getItem("loggedIn") !== "true") {
        return;
    }

    try {
        const response = await fetch("includes/auth-check.php");
        if (!response.ok) {
            return;
        }

        const data = await response.json();
        if (!data.authenticated || !data.user) {
            return;
        }

        userPurchases = Array.isArray(data.user.purchases) ? data.user.purchases : [];
        userCollections = Array.isArray(data.user.collections) ? data.user.collections : [];

        localStorage.setItem("userPurchases", JSON.stringify(userPurchases));
        localStorage.setItem("userCollections", JSON.stringify(userCollections));
    } catch (error) {
        console.error("Could not refresh purchased content:", error);
    }
}

function normalizeValue(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getString(key, fallback) {
    return strings[currentLang]?.[key] || fallback;
}

const LOCK_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>';

function renderCollectionFeatures() {
    const features = [
        getString("collection_feature_delivery", "Direct digitale levering"),
        getString("collection_feature_quality", "Premium HD kwaliteit"),
        getString("collection_feature_access", "Levenslange toegang")
    ];

    return `
        <ul class="product-features">
            ${features.map((feature) => `<li>${LOCK_ICON_SVG}<span>${escapeHtml(feature)}</span></li>`).join("")}
        </ul>
    `;
}

function getCollectionTitle(collectionKey) {
    const collection = collections[collectionKey];
    if (!collection) return collectionKey;
    return typeof collection.title === "object"
        ? (collection.title[currentLang] || collection.title.nl || collectionKey)
        : (collection.title || collectionKey);
}

function getCollectionDescription(collectionKey) {
    const collection = collections[collectionKey];
    if (!collection) return "";
    return typeof collection.description === "object"
        ? (collection.description[currentLang] || collection.description.nl || "")
        : (collection.description || "");
}

function getTierLabel(collection, tier) {
    const customLabel = collection?.customTierLabels?.[tier];
    if (customLabel && typeof customLabel === "object") {
        return customLabel[currentLang] || customLabel.nl || tier;
    }

    return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function getTierVideoCount(collection, tier) {
    const explicitCount = Number(collection?.videos?.[tier] || 0);
    if (explicitCount > 0) {
        return explicitCount;
    }

    const linkedVideos = Array.isArray(collection?.videoLinks?.[tier]) ? collection.videoLinks[tier].length : 0;
    return linkedVideos;
}

function hasAnyVideoLinks(collection) {
    return getActiveCollectionTiers(collection).some((tier) => {
        return Array.isArray(collection?.videoLinks?.[tier]) && collection.videoLinks[tier].length > 0;
    });
}

function stripTierSuffix(value, collection) {
    let strippedValue = String(value || "").trim();
    const tiers = getActiveCollectionTiers(collection);

    tiers.forEach((tier) => {
        [tier, getTierLabel(collection, tier)].forEach((token) => {
            const normalizedToken = String(token || "").trim();
            if (!normalizedToken) return;

            const pattern = new RegExp(
                `(?:\\s*-\\s*|\\s*\\(\\s*)${escapeRegExp(normalizedToken)}(?:\\s*\\))?$`,
                "i"
            );

            strippedValue = strippedValue.replace(pattern, "").trim();
        });
    });

    return strippedValue;
}

function matchesCollectionIdentifier(value, collectionKey) {
    if (!value || !collections[collectionKey]) {
        return false;
    }

    const collection = collections[collectionKey];
    const titles = typeof collection.title === "object"
        ? Object.values(collection.title).filter(Boolean)
        : [collection.title];
    const candidates = [collectionKey, ...titles].map(normalizeValue);
    const normalizedValue = normalizeValue(value);
    const strippedValue = normalizeValue(stripTierSuffix(value, collection));

    return candidates.includes(normalizedValue) || candidates.includes(strippedValue);
}

function getCollectionKeyByIdentifier(identifier) {
    if (!identifier) return null;

    return Object.keys(collections).find((key) => matchesCollectionIdentifier(identifier, key)) || null;
}

function detectTierFromText(collection, value) {
    const normalizedValue = normalizeValue(value);
    if (!normalizedValue) return null;

    const tiers = getActiveCollectionTiers(collection);
    return tiers.find((tier) => {
        const tierToken = normalizeValue(tier);
        const labelToken = normalizeValue(getTierLabel(collection, tier));
        return (tierToken && normalizedValue.includes(tierToken))
            || (labelToken && normalizedValue.includes(labelToken));
    }) || null;
}

function inferPurchasedTier(collectionKey, purchase) {
    const collection = collections[collectionKey];
    if (!collection) return null;

    const activeTiers = getActiveCollectionTiers(collection);

    for (const candidate of [purchase?.tier, purchase?.purchase_tier, purchase?.item_tier]) {
        if (candidate && activeTiers.includes(candidate)) {
            return candidate;
        }
    }

    for (const textValue of [purchase?.item_name, purchase?.item_id]) {
        const detectedTier = detectTierFromText(collection, textValue);
        if (detectedTier) {
            return detectedTier;
        }
    }

    const purchasePrice = Number(purchase?.price);
    if (!Number.isNaN(purchasePrice) && purchasePrice > 0) {
        const priceMatch = activeTiers.find((tier) => {
            return Math.abs(Number(collection?.prices?.[tier] || 0) - purchasePrice) < 0.01;
        });

        if (priceMatch) {
            return priceMatch;
        }
    }

    return null;
}

function getPurchasedCollectionAccess(collectionKey) {
    const collection = collections[collectionKey];
    if (!collection) {
        return {
            owned: false,
            tiers: [],
            activeTiers: []
        };
    }

    const activeTiers = getActiveCollectionTiers(collection);
    const matchingPurchases = userPurchases.filter((purchase) => {
        const type = purchase?.purchase_type;
        if (type && type !== "collection") {
            return false;
        }

        return matchesCollectionIdentifier(purchase?.item_id, collectionKey)
            || matchesCollectionIdentifier(purchase?.item_name, collectionKey);
    });

    const matchingCollectionRows = userCollections.filter((entry) => {
        return matchesCollectionIdentifier(entry?.collection_id, collectionKey);
    });

    const inferredTiers = Array.from(new Set(
        matchingPurchases
            .map((purchase) => inferPurchasedTier(collectionKey, purchase))
            .filter((tier) => activeTiers.includes(tier))
    ));

    // Fallback voor single-tier collections
    if (!inferredTiers.length && (matchingPurchases.length > 0 || matchingCollectionRows.length > 0) && activeTiers.length === 1) {
        inferredTiers.push(activeTiers[0]);
    }

    return {
        owned: matchingPurchases.length > 0 || matchingCollectionRows.length > 0,
        tiers: activeTiers.filter((tier) => inferredTiers.includes(tier)),
        activeTiers,
        purchases: matchingPurchases,
        collectionRows: matchingCollectionRows
    };
}

/* ============================================================
   RENDER COLLECTIONS
============================================================ */
function renderCollections() {
    const container = document.getElementById("collections");
    if (!container) return;

    const cards = [];
    const collectionLimit = Number(container.dataset.limit || 0);

    Object.keys(collections).forEach((key) => {
        if (collectionLimit > 0 && cards.length >= collectionLimit) return;

        const collection = collections[key];
        if (!collection.active || collection.mode !== currentMode) return;

        const tiers = getActiveCollectionTiers(collection);
        if (!tiers.length) return;

        const defaultTier = tiers[0];
        const defaultPrice = collection.prices[defaultTier];
        const title = getCollectionTitle(key);
        const description = getCollectionDescription(key);
        const access = getPurchasedCollectionAccess(key);
        const isOwned = access.owned;
        const actionLabel = isOwned
            ? (hasAnyVideoLinks(collection) ? "Open bundel" : "Bekijk aankoop")
            : (getString("buy_now", "Koop Nu"));

        cards.push(`
            <div class="product-card${isOwned ? " is-owned" : ""}" data-collection-key="${escapeHtml(key)}">
                <div class="product-card-media">
                    <img src="${DEFAULT_COLLECTION_IMAGE}" alt="${escapeHtml(title)}" loading="eager" data-default-tier="${escapeHtml(defaultTier)}">
                </div>
                <div class="product-card-content">
                    ${isOwned ? `
                        <div class="product-badge-row">
                            <span class="badge">In account</span>
                        </div>
                    ` : ""}

                    <h3>${escapeHtml(title)}</h3>
                    <p class="product-desc">${escapeHtml(description)}</p>

                    <div class="tier-selector tier-selector-segmented">
                        ${tiers.map((tier, index) => `
                            <button class="tier ${index === 0 ? "active" : ""}" data-tier="${escapeHtml(tier)}">
                                ${escapeHtml(getTierLabel(collection, tier))}
                            </button>
                        `).join("")}
                    </div>

                    <p class="product-price">EUR ${escapeHtml(defaultPrice)}</p>
                    <p class="product-sub">${escapeHtml(getString("one_time", "eenmalig"))}</p>

                    ${collection.hideCounts ? "" : `<p class="product-meta-count">${getTierVideoCount(collection, defaultTier)} video's</p>`}

                    ${renderCollectionFeatures()}

                    <button
                        class="buy-btn${isOwned ? " buy-btn-owned" : ""}"
                        data-collection="${escapeHtml(key)}"
                        data-action="${isOwned ? "open" : "buy"}"
                    >
                        ${escapeHtml(actionLabel)}
                    </button>
                </div>
            </div>
        `);
    });

    container.innerHTML = cards.join("");

    syncCollectionCardImages();
    enableTierSwitching();
    enableCollectionButtons();
    highlightRequestedCollectionCard();
}

function syncCollectionCardImages() {
    document.querySelectorAll(".product-card[data-collection-key]").forEach((card) => {
        const collectionKey = card.dataset.collectionKey;
        const collection = collections[collectionKey];
        const img = card.querySelector(".product-card-media img");
        const activeTier = card.querySelector(".tier.active")?.dataset.tier || img?.dataset.defaultTier;
        const title = card.querySelector("h3")?.textContent || "";

        applyCollectionImage(img, collection, activeTier, title);
    });
}

function enableTierSwitching() {
    document.querySelectorAll(".tier").forEach((btn) => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            card.querySelectorAll(".tier").forEach((peer) => peer.classList.remove("active"));
            btn.classList.add("active");

            const collectionKey = card.querySelector(".buy-btn").dataset.collection;
            const tier = btn.dataset.tier;
            const price = collections[collectionKey].prices[tier];
            const collection = collections[collectionKey];
            const img = card.querySelector(".product-card-media img");
            const title = card.querySelector("h3")?.textContent || "";

            card.querySelector(".product-price").textContent = `EUR ${price}`;
            const metaCount = card.querySelector(".product-meta-count");
            if (metaCount) {
                metaCount.textContent = `${getTierVideoCount(collection, tier)} video's`;
            }
            applyCollectionImage(img, collection, tier, title);
        };
    });
}

function enableCollectionButtons() {
    document.querySelectorAll(".buy-btn").forEach((btn) => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            const collectionKey = btn.dataset.collection;

            if (btn.dataset.action === "open") {
                openPurchasedCollection(collectionKey);
                return;
            }

            const tier = card.querySelector(".tier.active")?.dataset.tier;
            const collection = collections[collectionKey];
            const price = collection?.prices?.[tier];
            const title = getCollectionTitle(collectionKey);
            const description = getTierSummary(collection, tier);
            const tierImage = getRenderedCollectionImage(card, collection, tier);

            addToCart({
                id: collectionKey,
                name: title,
                tier,
                description,
                price,
                image: tierImage,
                type: "collection"
            });
        };
    });
}

function getTierSummary(collection, tier) {
    const parts = [getTierLabel(collection, tier)];
    const videoCount = getTierVideoCount(collection, tier);

    if (videoCount > 0) {
        parts.push(`${videoCount} video's`);
    }

    return parts.join(" • ");
}

function addToCart(item) {
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));

    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? "flex" : "none";
    }

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
   PURCHASED COLLECTION VIEWER
============================================================ */
function openPurchasedCollection(collectionKey) {
    if (!collectionViewerShell || !collectionViewer) {
        window.location.href = `collections.html?view=${encodeURIComponent(collectionKey)}`;
        return;
    }

    requestedCollectionId = collectionKey;

    const url = new URL(window.location.href);
    url.searchParams.set("view", collectionKey);
    window.history.replaceState({}, "", url);

    renderRequestedCollection();
}

function highlightRequestedCollectionCard() {
    document.querySelectorAll(".product-card.is-highlighted").forEach((card) => {
        card.classList.remove("is-highlighted");
    });

    const collectionKey = getCollectionKeyByIdentifier(requestedCollectionId);
    if (!collectionKey) return;

    const card = document.querySelector(`.product-card[data-collection-key="${CSS.escape(collectionKey)}"]`);
    if (card) {
        card.classList.add("is-highlighted");
    }
}

function renderRequestedCollection() {
    if (!collectionViewerShell || !collectionViewer) {
        return;
    }

    if (!requestedCollectionId) {
        collectionViewerShell.hidden = true;
        collectionViewerShell.classList.add("hidden");
        collectionViewer.innerHTML = "";
        highlightRequestedCollectionCard();
        return;
    }

    // Lees de eventuele hint vanuit account.html (prijs en naam al bekend)
    let accountHint = null;
    try {
        const raw = sessionStorage.getItem("openingCollection");
        if (raw) {
            accountHint = JSON.parse(raw);
            if (accountHint?.id !== requestedCollectionId) accountHint = null;
            else sessionStorage.removeItem("openingCollection");
        }
    } catch (e) { /* ignore */ }

    console.log("[collectie] requestedCollectionId:", requestedCollectionId);
    console.log("[collectie] accountHint:", accountHint);
    console.log("[collectie] userPurchases:", userPurchases);
    console.log("[collectie] userCollections:", userCollections);

    const collectionKey = getCollectionKeyByIdentifier(requestedCollectionId);
    console.log("[collectie] collectionKey gevonden:", collectionKey);
    if (!collectionKey) {
        showCollectionViewer(
            "Bundel niet gevonden",
            "Deze bundel kon niet worden gekoppeld aan een bestaand pakket. Ga terug naar je account en probeer het opnieuw.",
            [
                { href: "account.html", label: "Terug naar account", variant: "secondary" },
                { href: "collections.html", label: "Bekijk bundels", variant: "primary" }
            ]
        );
        return;
    }

    if (localStorage.getItem("loggedIn") !== "true") {
        showCollectionViewer(
            "Log eerst in",
            "Je moet ingelogd zijn om een gekochte bundel te openen.",
            [
                { href: "login.html", label: "Inloggen", variant: "primary" },
                { href: "collections.html", label: "Terug", variant: "secondary" }
            ]
        );
        return;
    }

    const collection = collections[collectionKey];
    const access = getPurchasedCollectionAccess(collectionKey);
    console.log("[collectie] access:", JSON.stringify(access));

    // Als de accountHint aanwezig is (=gebruiker klikte vanuit zijn account),
    // behandel dit als bewijs van eigendom ook als de DB-check mislukt
    if (!access.owned && accountHint) {
        console.log("[collectie] owned via accountHint");
        access.owned = true;
        access.purchases = [{ item_id: accountHint.id, item_name: accountHint.name, price: accountHint.price }];
    }

    if (!access.owned) {
        showCollectionViewer(
            "Geen toegang gevonden",
            "Deze bundel staat niet in jouw account. Als je net hebt betaald, ververs dan eerst de accountpagina zodat de aankoop opnieuw wordt geladen.",
            [
                { href: "account.html", label: "Mijn account", variant: "secondary" },
                { href: "collections.html", label: "Bekijk bundels", variant: "primary" }
            ]
        );
        return;
    }

    const title = getCollectionTitle(collectionKey);
    const description = getCollectionDescription(collectionKey);
    const previewTier = access.tiers[0] || access.activeTiers[0];
    const previewImage = getCollectionPreviewImage(collection, previewTier, title);

    if (!hasAnyVideoLinks(collection)) {
        showCollectionViewer(
            title,
            "Deze aankoop staat in je account, maar heeft geen directe videolinks op deze pagina. Neem contact op via info@miss-jolie.store als je levering nog ontbreekt.",
            [
                { href: "account.html", label: "Terug naar account", variant: "secondary" },
                { href: "mailto:info@miss-jolie.store", label: "Contact opnemen", variant: "primary" }
            ],
            previewImage
        );
        return;
    }

    if (!access.tiers.length) {
        // Probeer alle actieve tiers te tonen als er maar één is
        if (access.activeTiers.length === 1) {
            access.tiers = access.activeTiers;
        } else {
            // Probeer de dichtstbijzijnde prijs te matchen
            // Gebruik de accountHint prijs als meest betrouwbare bron
            const hintPrice = accountHint?.price;
            const purchasePrices = access.purchases
                .map((p) => Number(p?.price))
                .filter((p) => !isNaN(p) && p > 0);
            if (hintPrice) purchasePrices.unshift(hintPrice);

            if (purchasePrices.length > 0) {
                const avgPrice = purchasePrices[0]; // Gebruik de eerste (meest betrouwbare) prijs
                const bestTier = access.activeTiers.reduce((best, tier) => {
                    const tierPrice = Number(collection?.prices?.[tier] || 0);
                    const bestPrice = Number(collection?.prices?.[best] || 0);
                    return Math.abs(tierPrice - avgPrice) < Math.abs(bestPrice - avgPrice) ? tier : best;
                }, access.activeTiers[0]);
                if (bestTier) {
                    console.log("[collectie] tier via closest-price fallback:", bestTier, "voor prijs", avgPrice);
                    access.tiers = [bestTier];
                }
            }
        }
    }

    if (!access.tiers.length) {
        // Laatste noodval: ownership is bewezen maar tier onbekend → toon laagste tier
        if (access.activeTiers.length > 0) {
            console.log("[collectie] tier via noodval (laagste tier):", access.activeTiers[0]);
            access.tiers = [access.activeTiers[0]];
        } else {
            showCollectionViewer(
                title,
                "Je aankoop is gevonden, maar het pakket-niveau kon niet worden bepaald. Neem contact op via info@miss-jolie.store met je aankoopdatum.",
                [
                    { href: "account.html", label: "Terug naar account", variant: "secondary" },
                    { href: "mailto:info@miss-jolie.store", label: "Contact opnemen", variant: "primary" }
                ],
                previewImage
            );
            return;
        }
    }

    const tierCards = access.tiers.map((tier) => renderTierCard(collection, tier)).join("");
    const accessLabels = access.tiers.map((tier) => escapeHtml(getTierLabel(collection, tier))).join(", ");

    collectionViewer.innerHTML = `
        <div class="collection-viewer-card">
            <div class="collection-viewer-head">
                <div class="collection-viewer-copy">
                    <p class="collection-viewer-eyebrow">Aangekocht en ontgrendeld</p>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(description)}</p>
                    <div class="collection-viewer-meta">
                        <span class="badge">Toegang: ${accessLabels}</span>
                    </div>
                    <div class="purchase-actions">
                        <a class="btn secondary" href="account.html">Terug naar account</a>
                        <a class="btn primary" href="collections.html">Meer bundels bekijken</a>
                    </div>
                </div>
                <div class="collection-viewer-media">
                    <img src="${escapeHtml(previewImage)}" alt="${escapeHtml(title)}">
                </div>
            </div>
            <div class="collection-tier-grid">
                ${tierCards}
            </div>
        </div>
    `;

    collectionViewerShell.hidden = false;
    collectionViewerShell.classList.remove("hidden");
    highlightRequestedCollectionCard();

    scrollToViewer();
}

function showCollectionViewer(title, message, actions, previewImage = DEFAULT_COLLECTION_IMAGE) {
    const actionMarkup = (actions || []).map((action) => {
        return `<a class="btn ${escapeHtml(action.variant || "secondary")}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`;
    }).join("");

    collectionViewer.innerHTML = `
        <div class="collection-viewer-card collection-state">
            <div class="collection-viewer-head">
                <div class="collection-viewer-copy">
                    <p class="collection-viewer-eyebrow">Bundel toegang</p>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(message)}</p>
                    <div class="purchase-actions">
                        ${actionMarkup}
                    </div>
                </div>
                <div class="collection-viewer-media">
                    <img src="${escapeHtml(previewImage)}" alt="${escapeHtml(title)}">
                </div>
            </div>
        </div>
    `;

    collectionViewerShell.hidden = false;
    collectionViewerShell.classList.remove("hidden");
    highlightRequestedCollectionCard();

    scrollToViewer();
}

function scrollToViewer() {
    window.requestAnimationFrame(() => {
        if (!collectionViewerShell) return;
        const headerHeight = document.querySelector("header.topbar")?.offsetHeight || 80;
        const top = collectionViewerShell.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
}

function getCollectionPreviewImage(collection, preferredTier, title) {
    const imageCandidates = [];
    const orderedTiers = preferredTier
        ? [preferredTier, ...getActiveCollectionTiers(collection).filter((tier) => tier !== preferredTier)]
        : getActiveCollectionTiers(collection);

    orderedTiers.forEach((tier) => {
        if (collection?.images?.[tier]) {
            imageCandidates.push(collection.images[tier]);
        }
    });

    if (collection?.image) {
        imageCandidates.push(collection.image);
    }

    const previewImage = imageCandidates.find(Boolean) || DEFAULT_COLLECTION_IMAGE;
    const img = document.createElement("img");
    applyCollectionImage(img, collection, preferredTier, title);
    return img.getAttribute("src") || previewImage;
}

function renderTierCard(collection, tier) {
    const tierLabel = getTierLabel(collection, tier);
    const videoLinks = Array.isArray(collection?.videoLinks?.[tier]) ? collection.videoLinks[tier] : [];
    const videoCount = getTierVideoCount(collection, tier);

    return `
        <section class="collection-tier-card">
            <div class="collection-tier-head">
                <div>
                    <h3>${escapeHtml(tierLabel)}</h3>
                    <p class="collection-tier-note">${escapeHtml(videoCount > 0 ? `${videoCount} video's beschikbaar` : "Video's beschikbaar")}</p>
                </div>
                <span class="badge">Tier</span>
            </div>
            <div class="collection-video-list">
                ${videoLinks.map((videoLink, index) => renderVideoCard(videoLink, index)).join("")}
            </div>
        </section>
    `;
}

function renderVideoCard(videoLink, index) {
    const safeVideoPath = encodeURI(videoLink);
    const videoLabel = formatVideoLabel(videoLink, index);

    return `
        <article class="collection-video-item">
            <div class="collection-video-copy">
                <h4>${escapeHtml(videoLabel)}</h4>
                <p>Direct afspelen of openen in een nieuw tabblad.</p>
            </div>
            <video controls preload="metadata" playsinline controlsList="nodownload">
                <source src="${escapeHtml(safeVideoPath)}" type="video/mp4">
                Je browser ondersteunt deze video niet.
            </video>
            <a class="btn secondary" href="${escapeHtml(safeVideoPath)}" target="_blank" rel="noopener">Open video</a>
        </article>
    `;
}

function formatVideoLabel(videoLink, index) {
    const rawFilename = String(videoLink || "").split("/").pop() || `Video ${index + 1}`;
    const cleanFilename = rawFilename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

    try {
        return decodeURIComponent(cleanFilename) || `Video ${index + 1}`;
    } catch (error) {
        return cleanFilename || `Video ${index + 1}`;
    }
}

/* ============================================================
   CART
============================================================ */
if (openCart) {
    openCart.onclick = () => {
        window.location.href = "cart.html";
    };
}
