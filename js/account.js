let currentLang = localStorage.getItem("lang") || "nl";
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const langToggle = document.getElementById("langToggle");
const logoutAccountBtn = document.getElementById("logoutAccountBtn");
const adminLink = document.getElementById("adminLink");

setupMenu();
setupLanguageDropdown();
setupTabs();
updateCartBadge();

function setupMenu() {
    if (!menuToggle || !mainNav) return;

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

function setupLanguageDropdown() {
    if (!langToggle) return;

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

function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? "flex" : "none";
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatCurrency(value) {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR"
    }).format(Number(value) || 0);
}

function formatDate(dateValue, timeValue = "") {
    if (!dateValue) return "Onbekend";

    const combinedValue = timeValue ? `${dateValue}T${timeValue}` : dateValue;
    const parsed = new Date(combinedValue);

    if (Number.isNaN(parsed.getTime())) {
        return escapeHtml(timeValue ? `${dateValue} ${timeValue}` : dateValue);
    }

    return parsed.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: timeValue ? "2-digit" : undefined,
        minute: timeValue ? "2-digit" : undefined
    });
}

function getEmptyState(message, href = "collections.html", linkLabel = "Bekijk het aanbod") {
    return `
        <div class="empty-state">
            <h3>Nog geen items</h3>
            <p>${escapeHtml(message)}</p>
            <a class="btn secondary" href="${href}">${escapeHtml(linkLabel)}</a>
        </div>
    `;
}

function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach((item) => item.classList.remove("active"));
            tabContents.forEach((content) => content.classList.remove("active"));

            button.classList.add("active");
            document.getElementById(`${targetTab}-tab`)?.classList.add("active");
        });
    });
}

function renderOrders(orders) {
    const container = document.getElementById("ordersList");
    if (!container) return;

    if (!orders.length) {
        container.innerHTML = getEmptyState("Je hebt nog geen bestellingen geplaatst.");
        return;
    }

    container.innerHTML = orders.map((order) => `
        <article class="purchase-card">
            <div class="purchase-info">
                <h3>${escapeHtml(order.item_name)}</h3>
                <p>Type: ${escapeHtml(order.purchase_type || "Aankoop")}</p>
                <p>Datum: ${formatDate(order.purchased_at)}</p>
                <p>Prijs: ${formatCurrency(order.price)}</p>
            </div>
            <div class="purchase-actions">
                <span class="badge">${order.payment_id ? "Betaald" : "In verwerking"}</span>
            </div>
        </article>
    `).join("");
}

function renderCollections(collections) {
    const container = document.getElementById("collectionsList");
    if (!container) return;

    if (!collections.length) {
        container.innerHTML = getEmptyState("Je hebt nog geen video bundels gekocht.");
        return;
    }

    container.innerHTML = collections.map((collection) => `
        <article class="purchase-card">
            <div class="purchase-info">
                <h3>${escapeHtml(collection.item_name)}</h3>
                <p>Datum: ${formatDate(collection.purchased_at)}</p>
                <p>Prijs: ${formatCurrency(collection.price)}</p>
            </div>
            <div class="purchase-actions">
                <button class="btn-primary" onclick="viewCollection('${escapeHtml(collection.item_id)}')">Open bundel</button>
                <button class="btn-secondary" onclick="downloadCollection('${escapeHtml(collection.item_id)}')">Download</button>
            </div>
        </article>
    `).join("");
}

function renderPasses(items) {
    const container = document.getElementById("passesList");
    if (!container) return;

    if (!items.length) {
        container.innerHTML = getEmptyState("Je hebt nog geen memberships gekocht.", "passen.html", "Bekijk memberships");
        return;
    }

    container.innerHTML = items.map((item) => `
        <article class="purchase-card">
            <div class="purchase-info">
                <h3>${escapeHtml(item.item_name)}</h3>
                <p>Datum: ${formatDate(item.purchased_at)}</p>
                <p>Prijs: ${formatCurrency(item.price)}</p>
            </div>
            <div class="purchase-actions">
                <button class="btn-primary" onclick="viewPassContent('${escapeHtml(item.item_id)}')">Bekijk toegang</button>
            </div>
        </article>
    `).join("");
}

function renderMerchandise(items) {
    const container = document.getElementById("merchandiseList");
    if (!container) return;

    if (!items.length) {
        container.innerHTML = getEmptyState("Je hebt nog geen merchandise gekocht.", "merchandise.html", "Bekijk merchandise");
        return;
    }

    container.innerHTML = items.map((item) => `
        <article class="purchase-card">
            <div class="purchase-info">
                <h3>${escapeHtml(item.item_name)}</h3>
                <p>Datum: ${formatDate(item.purchased_at)}</p>
                <p>Prijs: ${formatCurrency(item.price)}</p>
            </div>
            <div class="purchase-actions">
                <span class="badge">${item.payment_id ? "Betaald" : "In verwerking"}</span>
            </div>
        </article>
    `).join("");
}

function renderBookings(bookings) {
    const container = document.getElementById("bookingsList");
    if (!container) return;

    if (!bookings.length) {
        container.innerHTML = getEmptyState("Je hebt nog geen boekingen gemaakt.", "booking.html", "Boek een sessie");
        return;
    }

    const statusLabels = {
        pending: "In afwachting",
        confirmed: "Bevestigd",
        completed: "Afgerond",
        cancelled: "Geannuleerd"
    };

    container.innerHTML = bookings.map((booking) => `
        <article class="purchase-card">
            <div class="purchase-info">
                <h3>${escapeHtml(booking.service)}</h3>
                <p>Tarief: ${escapeHtml(booking.duration)}</p>
                <p>Datum: ${formatDate(booking.booking_date, booking.booking_time)}</p>
                <p>Prijs: ${formatCurrency(booking.price)}</p>
            </div>
            <div class="purchase-actions">
                <span class="badge">${escapeHtml(statusLabels[booking.status] || booking.status || "In afwachting")}</span>
            </div>
        </article>
    `).join("");
}

function renderDashboard(user) {
    const purchases = Array.isArray(user.purchases) ? user.purchases : [];
    const bookings = Array.isArray(user.bookings) ? user.bookings : [];
    const visiblePurchases = purchases.filter((item) => item.purchase_type !== "booking");

    // Sla actuele aankopen op zodat collections.js ze direct kan gebruiken
    try {
        localStorage.setItem("userPurchases", JSON.stringify(purchases));
        localStorage.setItem("userCollections", JSON.stringify(user.collections || []));
        localStorage.setItem("loggedIn", "true");
    } catch (e) { /* ignore */ }

    document.getElementById("accountEmailDisplay").textContent = user.email || "-";

    renderOrders(visiblePurchases);
    renderCollections(visiblePurchases.filter((item) => item.purchase_type === "collection"));
    renderPasses(visiblePurchases.filter((item) => item.purchase_type === "pass"));
    renderMerchandise(visiblePurchases.filter((item) => item.purchase_type === "merchandise"));
    renderBookings(bookings);

    if (adminLink && Number(user.is_admin) === 1) {
        adminLink.classList.remove("hidden");
    }
}

async function logoutAccount() {
    try {
        await fetch("includes/auth-logout.php");
    } catch (error) {
        console.error("Logout request failed:", error);
    } finally {
        localStorage.clear();
        window.location.href = "login.html";
    }
}

window.viewCollection = function viewCollection(collectionId) {
    openOwnedCollection(collectionId).catch((error) => {
        console.error("Open collection error:", error);
        alert("Kon de video's niet laden. Probeer opnieuw.");
    });
};

window.downloadCollection = function downloadCollection(collectionId) {
    getOwnedCollectionVideos(collectionId)
        .then(({ videos }) => {
            if (!Array.isArray(videos) || videos.length === 0) {
                alert("Geen video's gevonden om te downloaden voor deze collectie.");
                return;
            }
            const proceed = confirm(`Je staat op het punt ${videos.length} video(s) te downloaden. Doorgaan?`);
            if (!proceed) return;
            videos.forEach((path, index) => {
                setTimeout(() => {
                    const fileName = path.split("/").pop() || `video-${index + 1}.mp4`;
                    const a = document.createElement("a");
                    a.href = toPlayableVideoUrl(path);
                    a.download = fileName;
                    a.target = "_blank";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }, index * 300);
            });
        })
        .catch((error) => {
            console.error("Download collection error:", error);
            alert("Download kon niet worden gestart. Probeer opnieuw.");
        });
};

async function openOwnedCollection(collectionId) {
    const result = await getOwnedCollectionVideos(collectionId);
    const videos = result.videos;
    if (!Array.isArray(videos) || videos.length === 0) {
        alert("Nog geen video's beschikbaar voor deze collectie.");
        return;
    }
    openCollectionPlaylistModal(result.collectionId || collectionId, videos);
}

async function getOwnedCollectionVideos(collectionId) {
    const purchases = JSON.parse(localStorage.getItem("userPurchases") || "[]");
    const matchingPurchases = purchases.filter((p) =>
        String((p && p.purchase_type) || "").trim().toLowerCase() === "collection" &&
        String((p && p.item_id) || "").trim() === String(collectionId).trim()
    );

    const purchase = matchingPurchases[0] || null;
    const purchasedTier = extractTierFromItemName(purchase && purchase.item_name ? purchase.item_name : undefined);

    const data = await fetch("includes/collections.json", { cache: "no-store" }).then((r) => r.json());
    const collectionsMap = (data && data.collections) ? data.collections : {};

    let resolvedCollectionId = String(collectionId).trim();
    let collection = collectionsMap[resolvedCollectionId];

    if (!collection && purchase && purchase.item_name) {
        const byName = String(purchase.item_name).trim();
        if (collectionsMap[byName]) {
            resolvedCollectionId = byName;
            collection = collectionsMap[resolvedCollectionId];
        }
    }

    if (!collection) {
        const lookupValue = String((purchase && purchase.item_name) || collectionId || "").trim().toLowerCase();
        const matchedKey = Object.keys(collectionsMap).find((key) => key.trim().toLowerCase() === lookupValue);
        if (matchedKey) {
            resolvedCollectionId = matchedKey;
            collection = collectionsMap[resolvedCollectionId];
        }
    }

    if (!collection || !collection.videoLinks) {
        return { collectionId, videos: [], purchasedTier: null };
    }

    let videos = [];
    if (purchasedTier && Array.isArray(collection.videoLinks[purchasedTier])) {
        videos = collection.videoLinks[purchasedTier];
    } else {
        const firstTierWithVideos = Object.keys(collection.videoLinks).find(
            (key) => Array.isArray(collection.videoLinks[key]) && collection.videoLinks[key].length > 0
        );
        if (firstTierWithVideos) {
            videos = collection.videoLinks[firstTierWithVideos];
        }
    }

    return { collectionId: resolvedCollectionId, videos, purchasedTier };
}

function extractTierFromItemName(itemName) {
    if (!itemName || typeof itemName !== "string") return null;
    const knownTiers = ["brons", "zilver", "goud", "platinum", "week", "maand"];
    const parts = itemName.split(" - ").map((part) => part.trim().toLowerCase()).filter(Boolean);
    return parts.find((part) => knownTiers.includes(part)) || null;
}

function getVideoSourceCandidates(path) {
    const value = String(path || "").replace(/\\/g, "/").trim();
    if (!value) return [];

    const candidates = [value];
    const trimmedSegmentsPath = value.split("/").map((s) => s.trim()).join("/");
    const withoutDots = value.replace(/^(\.\.\/)+/, "");

    if (trimmedSegmentsPath !== value) candidates.push(trimmedSegmentsPath);
    if (withoutDots !== value) {
        candidates.push(withoutDots);
        candidates.push("/" + withoutDots);
    }
    if (value.indexOf("./") === 0) candidates.push(value.substring(2));

    const unique = [];
    candidates.forEach((candidate) => {
        const encoded = encodeURI(candidate);
        if (encoded && !unique.includes(encoded)) unique.push(encoded);
    });
    return unique;
}

function toPlayableVideoUrl(path) {
    const candidates = getVideoSourceCandidates(path);
    return candidates.length ? candidates[0] : "";
}

function openCollectionPlaylistModal(collectionId, videoPaths) {
    const modal = document.createElement("div");
    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.95);
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
    `;

    const playlistButtons = videoPaths.map((path, index) => {
        const fileName = (path.split("/").pop() || `Video ${index + 1}`).replace(/\.[^/.]+$/, "");
        return `
            <button class="playlist-btn" data-src="${escapeHtml(path)}" style="
                width:100%;
                text-align:left;
                background:${index === 0 ? "#d4af37" : "#1f1f26"};
                color:${index === 0 ? "#000" : "#fff"};
                border:1px solid #333;
                border-radius:8px;
                padding:10px 12px;
                cursor:pointer;
                margin-bottom:8px;
            ">${index + 1}. ${escapeHtml(fileName)}</button>
        `;
    }).join("");

    modal.innerHTML = `
        <div style="
            max-width:1300px;
            width:100%;
            max-height:100vh;
            display:grid;
            grid-template-columns:2fr 1fr;
            gap:16px;
        ">
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button id="closePlaylistModal" style="
                    align-self:flex-start;
                    background:#d4af37;
                    color:#000;
                    border:none;
                    padding:10px 18px;
                    border-radius:8px;
                    font-weight:bold;
                    cursor:pointer;
                ">Terug naar account</button>
                <h3 style="margin:0;color:#d4af37;">${escapeHtml(collectionId)}</h3>
                <video id="playlistVideoPlayer" controls autoplay playsinline style="
                    width:100%;
                    max-height:calc(100vh - 120px);
                    object-fit:contain;
                    border-radius:12px;
                    box-shadow:0 0 30px rgba(212,175,55,.35);
                    background:#000;
                "></video>
            </div>
            <div style="
                background:#121218;
                border:1px solid #2b2b33;
                border-radius:12px;
                padding:12px;
                overflow:auto;
                max-height:calc(100vh - 40px);
            ">
                <h4 style="margin:0 0 12px;color:#fff;">Video lijst (${videoPaths.length})</h4>
                ${playlistButtons}
            </div>
        </div>
    `;

    modal.querySelector("#closePlaylistModal").onclick = () => modal.remove();
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    const player = modal.querySelector("#playlistVideoPlayer");
    const buttons = modal.querySelectorAll(".playlist-btn");
    let activeCandidates = [];
    let activeCandidateIndex = 0;

    function applyVideoSource(rawPath) {
        if (!player) return;
        activeCandidates = getVideoSourceCandidates(rawPath);
        activeCandidateIndex = 0;
        if (!activeCandidates.length) { player.removeAttribute("src"); player.load(); return; }
        player.src = activeCandidates[activeCandidateIndex];
        player.load();
        player.play().catch(() => {});
    }

    if (player) {
        player.addEventListener("error", () => {
            if (activeCandidateIndex + 1 < activeCandidates.length) {
                activeCandidateIndex += 1;
                player.src = activeCandidates[activeCandidateIndex];
                player.load();
                player.play().catch(() => {});
            }
        });
    }

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const src = btn.getAttribute("data-src");
            if (!src || !player) return;
            applyVideoSource(src);
            buttons.forEach((b) => { b.style.background = "#1f1f26"; b.style.color = "#fff"; });
            btn.style.background = "#d4af37";
            btn.style.color = "#000";
        });
    });

    applyVideoSource(videoPaths[0]);
    document.body.appendChild(modal);
}

window.viewPassContent = function viewPassContent(passId) {
    window.location.href = `passen.html?pass=${encodeURIComponent(passId)}`;
};

if (logoutAccountBtn) {
    logoutAccountBtn.addEventListener("click", logoutAccount);
}

(async function init() {
    if (!localStorage.getItem("loggedIn")) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("includes/auth-check.php");
        const data = await response.json();

        if (!response.ok || !data.authenticated || !data.user) {
            throw new Error("Niet geauthenticeerd");
        }

        renderDashboard(data.user);
    } catch (error) {
        console.error("Account init error:", error);
        localStorage.clear();
        window.location.href = "login.html";
    }
})();
