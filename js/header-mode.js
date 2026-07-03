const SHARED_HEADER_HTML = `
<header class="topbar">
    <div class="logo" data-text="nav_logo">Miss Jolie</div>

    <button class="menu-toggle" id="menuToggle" aria-label="Menu openen" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <nav id="mainNav">
        <a href="home.html" data-text="nav_home">Home</a>
        <a href="collections.html" data-text="nav_collections">Bundels</a>
        <a href="passen.html" data-text="nav_passes">Memberships</a>
        <a href="missjolie.html" data-text="nav_bio">Bio</a>
        <a href="links.html" data-text="nav_links">Mijn Links</a>
        <a href="contact.html" data-text="nav_contact">Contact</a>
    </nav>

    <button id="modeToggleBtn" class="mode-toggle-btn" title="Switch naar Meesteres Jolie" data-text-attr="title:mode_toggle_mistress">
        <span class="mode-label mode-label-miss" data-text="mode_label_mrs">Miss</span>
        <span class="mode-switch">
            <span class="mode-switch-slider"></span>
        </span>
        <span class="mode-label mode-label-mrs" data-text="mode_label_mistress">Mrs</span>
    </button>

    <div class="header-icons">
        <div class="lang-select" id="langToggle">
            <button class="lang-btn icon-btn">
                <span class="current-lang">🌍</span>
            </button>
            <div class="lang-dropdown">
                <div class="lang-option" data-lang="nl">
                    <img src="images/lang/nl.png" alt="Nederlands">
                    <span data-text="lang_dutch">Nederlands</span>
                </div>
                <div class="lang-option" data-lang="en">
                    <img src="images/lang/en.png" alt="English">
                    <span data-text="lang_english">English</span>
                </div>
                <div class="lang-option" data-lang="fr">
                    <img src="images/lang/fr.png" alt="Francais">
                    <span data-text="lang_french">Francais</span>
                </div>
                <div class="lang-option" data-lang="de">
                    <img src="images/lang/de.png" alt="Deutsch">
                    <span data-text="lang_german">Deutsch</span>
                </div>
            </div>
        </div>

        <button id="openAccount" class="icon-btn" aria-label="Account openen">
            <img src="images/logo/user.jpg" alt="">
        </button>

        <button id="openCart" class="icon-btn" aria-label="Winkelmand openen">
            <img src="images/logo/card.png" alt="">
            <span id="cartBadge" class="cart-badge" aria-label="items in winkelmand">0</span>
        </button>
    </div>
</header>`;

function renderSharedHeader() {
    const headerHtml = SHARED_HEADER_HTML.trim();
    const existingHeader = document.querySelector("header.topbar");
    if (existingHeader) {
        existingHeader.outerHTML = headerHtml;
    } else if (document.body) {
        document.body.insertAdjacentHTML("afterbegin", headerHtml);
    }
}

(() => {
    renderSharedHeader();

    // Keep aria-expanded in sync with menu open/close
    const menuToggleBtn = document.getElementById("menuToggle");
    const mainNavEl = document.getElementById("mainNav");
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener("click", () => {
            const isOpen = menuToggleBtn.classList.contains("active");
            menuToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
        if (mainNavEl) {
            mainNavEl.querySelectorAll("a").forEach((link) => {
                link.addEventListener("click", () => {
                    menuToggleBtn.setAttribute("aria-expanded", "false");
                });
            });
        }
    }

    const modeToggleBtn = document.getElementById("modeToggleBtn");
    if (!modeToggleBtn) return;

    let currentLang = localStorage.getItem("lang") || "nl";
    let currentMode = localStorage.getItem("mode") || "miss";

    localStorage.setItem("lang", currentLang);
    localStorage.setItem("mode", currentMode);

    const logo = document.querySelector(".logo");

    const resolveStrings = () => {
        if (typeof window.strings !== "undefined" && window.strings) {
            return window.strings;
        }
        return null;
    };

    const getModeTitle = () => {
        const strings = resolveStrings();
        if (strings && strings[currentLang]) {
            if (currentMode === "mistress") {
                return strings[currentLang].mode_toggle_miss || "Switch naar Miss Jolie";
            }
            return strings[currentLang].mode_toggle_mistress || "Switch naar Mrs Jolie";
        }
        return currentMode === "mistress" ? "Switch naar Miss Jolie" : "Switch naar Mrs Jolie";
    };

    const updateModeUi = () => {
        const labels = modeToggleBtn.querySelectorAll(".mode-label");
        if (currentMode === "mistress") {
            modeToggleBtn.classList.add("mistress-mode");
            if (labels[0]) labels[0].classList.remove("active");
            if (labels[1]) labels[1].classList.add("active");
        } else {
            modeToggleBtn.classList.remove("mistress-mode");
            if (labels[0]) labels[0].classList.add("active");
            if (labels[1]) labels[1].classList.remove("active");
        }

        modeToggleBtn.title = getModeTitle();
        if (logo) {
            logo.textContent = currentMode === "mistress" ? "Mrs Jolie" : "Miss Jolie";
        }
    };

    const emitModeChange = (initial = false) => {
        window.dispatchEvent(new CustomEvent("modechange", {
            detail: {
                mode: currentMode,
                initial
            }
        }));
    };

    updateModeUi();
    emitModeChange(true);

    window.addEventListener("langchange", (event) => {
        if (event?.detail?.lang) {
            currentLang = event.detail.lang;
            localStorage.setItem("lang", currentLang);
            updateModeUi();
        }
    });

    if (modeToggleBtn.dataset.modeBound === "true") {
        return;
    }

    modeToggleBtn.dataset.modeBound = "true";
    modeToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        currentMode = currentMode === "miss" ? "mistress" : "miss";
        localStorage.setItem("mode", currentMode);
        updateModeUi();
        emitModeChange(false);
    });
})();
