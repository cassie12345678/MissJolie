/* ============================================================
   BOOKING FORM - Sexting, Videocall, Dick Rating, Chastity
   Kaarten met tier-knoppen + datum/tijd, zelfde stijl als Bundels.
   Naam/e-mail/telefoon worden pas bij het afrekenen gevraagd
   (zie checkout.html), net als bij Memberships.
============================================================ */
let strings = {};
let currentLang = localStorage.getItem("lang") || "nl";

const services = {
    sexting: {
        nameKey: "service_sexting",
        image: "images/photos/mix-goud.jpg",
        tiers: {
            "15min": { durationKey: "duration_15min", price: 25.00 },
            "30min": { durationKey: "duration_30min", price: 45.00 },
            "60min": { durationKey: "duration_60min", price: 75.00 },
            "dag": { durationKey: "duration_day", price: 150.00 },
            "week": { durationKey: "duration_week", price: 500.00 },
            "maand": { durationKey: "duration_month", price: 1500.00 }
        }
    },
    videocall_no_face: {
        nameKey: "service_videocall_no_face",
        image: "images/photos/duo-brons.jpg",
        tiers: {
            "15min": { durationKey: "duration_15min", price: 30.00 },
            "30min": { durationKey: "duration_30min", price: 55.00 },
            "60min": { durationKey: "duration_60min", price: 100.00 }
        }
    },
    videocall_with_face: {
        nameKey: "service_videocall_with_face",
        image: "images/photos/duo-goud.jpg",
        tiers: {
            "15min": { durationKey: "duration_15min", price: 40.00 },
            "30min": { durationKey: "duration_30min", price: 70.00 },
            "60min": { durationKey: "duration_60min", price: 120.00 }
        }
    },
    dickrating: {
        nameKey: "service_dickrating",
        image: "images/photos/joicei-goud.jpg",
        tiers: {
            "voicememo": { durationKey: "dickrating_voicememo", price: 10.00 },
            "video": { durationKey: "dickrating_video", price: 15.00 },
            "topless_video": { durationKey: "dickrating_topless_video", price: 20.00 },
            "topless_video_dick": { durationKey: "dickrating_topless_video_dick", price: 25.00 }
        }
    },
    chastity: {
        nameKey: "service_chastity",
        image: "images/kooitjes/doublelock_1.jpeg",
        tiers: {
            "weekend": { durationKey: "duration_weekend", price: 25.00 },
            "week": { durationKey: "duration_week", price: 50.00 },
            "maand": { durationKey: "duration_month", price: 100.00 }
        }
    }
};

/* ============================================================
   HELPERS
   (mobiel menu + taal-dropdown worden al afgehandeld door
   js/static-header.js, dat ook op deze pagina wordt geladen)
============================================================ */
function formatPrice(value) {
    return `€${Number.parseFloat(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getString(key, fallback = "") {
    const langStrings = strings[currentLang] || strings.nl || {};
    return langStrings[key] || fallback;
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
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

function addToCart(item) {
    const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    currentCart.push(item);
    localStorage.setItem("cart", JSON.stringify(currentCart));

    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.textContent = currentCart.length;
        badge.style.display = "flex";
    }
}

/* ============================================================
   RENDER SERVICE CARDS (kaart + tier-knoppen + datum/tijd)
============================================================ */
function renderServices() {
    const grid = document.getElementById("servicesGrid");
    if (!grid) return;

    const addToCartLabel = getString("add_to_cart", getString("add_to_cart_alt", "Toevoegen aan winkelmandje"));
    const oneTimeLabel = getString("duration_onetime", "Eenmalig");
    const today = new Date().toISOString().split("T")[0];

    grid.innerHTML = Object.entries(services).map(([key, service]) => {
        const tiers = Object.keys(service.tiers);
        const defaultTier = tiers[0];
        const defaultPrice = service.tiers[defaultTier].price;
        const serviceName = getString(service.nameKey, key);

        return `
            <div class="product-card" data-service-key="${escapeHtml(key)}">
                <div class="product-card-media">
                    <img src="${escapeHtml(service.image)}" alt="${escapeHtml(serviceName)}" loading="lazy" onerror="this.onerror=null;this.src='images/backgrounds/test.jpg';">
                </div>
                <div class="product-card-content">
                    <h3>${escapeHtml(serviceName)}</h3>

                    <div class="tier-selector tier-selector-segmented">
                        ${tiers.map((tierId, index) => `
                            <button class="tier ${index === 0 ? "active" : ""}" data-tier="${escapeHtml(tierId)}">
                                ${escapeHtml(getString(service.tiers[tierId].durationKey, tierId))}
                            </button>
                        `).join("")}
                    </div>

                    <div class="card-datetime">
                        <input type="date" class="card-date" min="${today}" required>
                        <input type="time" class="card-time" required>
                    </div>

                    <p class="product-price">${formatPrice(defaultPrice)}</p>
                    <p class="product-sub">${escapeHtml(oneTimeLabel)}</p>

                    <button class="buy-btn" data-service="${escapeHtml(key)}">${escapeHtml(addToCartLabel)}</button>
                </div>
            </div>
        `;
    }).join("");

    enableTierSwitching();
    enableServiceButtons();
}

function enableTierSwitching() {
    document.querySelectorAll(".product-card[data-service-key] .tier").forEach((btn) => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            const serviceKey = card.dataset.serviceKey;
            const service = services[serviceKey];

            card.querySelectorAll(".tier").forEach((peer) => peer.classList.remove("active"));
            btn.classList.add("active");

            const tier = service.tiers[btn.dataset.tier];
            card.querySelector(".product-price").textContent = formatPrice(tier.price);
        };
    });
}

function enableServiceButtons() {
    document.querySelectorAll(".buy-btn[data-service]").forEach((btn) => {
        btn.onclick = () => {
            const card = btn.closest(".product-card");
            const serviceKey = card.dataset.serviceKey;
            const service = services[serviceKey];
            const activeTierId = card.querySelector(".tier.active")?.dataset.tier;
            const tier = service.tiers[activeTierId];
            const serviceName = getString(service.nameKey, serviceKey);
            const durationLabel = getString(tier.durationKey, activeTierId);

            const date = card.querySelector(".card-date").value;
            const time = card.querySelector(".card-time").value;

            if (!date || !time) {
                showNotification("Kies eerst een datum en tijd.", "error");
                return;
            }

            addToCart({
                id: `booking-${serviceKey}-${Date.now()}`,
                name: serviceName,
                service: serviceName,
                tier: durationLabel,
                duration: durationLabel,
                description: `${date} om ${time}`,
                price: tier.price,
                image: service.image,
                type: "booking",
                date,
                time
            });

            showNotification("Toegevoegd aan winkelmandje!", "success");
        };
    });
}

/* ============================================================
   TAAL (herlaadt kaarten met vertaalde tekst)
============================================================ */
window.addEventListener("langchange", (event) => {
    currentLang = event?.detail?.lang || localStorage.getItem("lang") || "nl";
    renderServices();
});

/* ============================================================
   INIT
============================================================ */
(async function init() {
    try {
        strings = await fetch("data/strings.json").then((r) => r.json());
    } catch (error) {
        strings = {};
    }
    renderServices();
})();
