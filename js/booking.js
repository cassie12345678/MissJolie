/* ============================================================
   BOOKING FORM - Sexting, Videocall, Dick Rating
============================================================ */
const services = {
    sexting: {
        name: "Sexting incl. foto's & video",
        tiers: {
            "15min": { label: "15 min", price: 25.00 },
            "30min": { label: "30 min", price: 45.00 },
            "60min": { label: "60 min", price: 75.00 },
            "dag": { label: "Dagpas", price: 150.00 },
            "week": { label: "Weekpas", price: 500.00 },
            "maand": { label: "Maandpas", price: 1500.00 }
        }
    },
    videocall_no_face: {
        name: "Videocall zonder gezicht",
        tiers: {
            "15min": { label: "15 min", price: 30.00 },
            "30min": { label: "30 min", price: 55.00 },
            "60min": { label: "60 min", price: 100.00 }
        }
    },
    videocall_with_face: {
        name: "Videocall met gezicht",
        tiers: {
            "15min": { label: "15 min", price: 40.00 },
            "30min": { label: "30 min", price: 70.00 },
            "60min": { label: "60 min", price: 120.00 }
        }
    },
    dickrating: {
        name: "Dick Rating",
        tiers: {
            "voicememo": { label: "Voicememo 1-2 min", price: 10.00 },
            "video": { label: "Video beoordeling", price: 15.00 },
            "topless_video": { label: "Topless video 1-2 min", price: 20.00 },
            "topless_video_dick": { label: "Topless video + jouw pik in beeld 1-2 min", price: 25.00 }
        }
    }
};

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
            langOptions.forEach((opt) => opt.classList.remove("active"));
            option.classList.add("active");
            localStorage.setItem("lang", option.dataset.lang);
            langToggle.classList.remove("active");
        });
    });

    document.addEventListener("click", (e) => {
        if (!langToggle.contains(e.target)) {
            langToggle.classList.remove("active");
        }
    });

    const currentLang = localStorage.getItem("lang") || "nl";
    const currentOption = langToggle.querySelector(`[data-lang="${currentLang}"]`);
    if (currentOption) {
        currentOption.classList.add("active");
    }
}

/* ============================================================
   BOOKING FORM LOGIC
============================================================ */
const serviceSelect = document.getElementById("service");
const tierSelect = document.getElementById("tier");
const priceDisplay = document.getElementById("priceDisplay");
const bookingForm = document.getElementById("bookingForm");
const bookingError = document.getElementById("errorMessage");
const bookingSuccess = document.getElementById("successMessage");
const submitBtn = document.getElementById("submitBtn");
const bookingDateInput = document.getElementById("bookingDate");

function formatPrice(value) {
    return `€${Number.parseFloat(value || 0).toFixed(2)}`;
}

function populateServiceSelect() {
    if (!serviceSelect) return;

    serviceSelect.innerHTML = Object.entries(services)
        .map(([key, service]) => `<option value="${key}">${service.name}</option>`)
        .join("");
}

function populateTierSelect() {
    if (!tierSelect || !serviceSelect) return;

    const service = services[serviceSelect.value];
    if (!service) return;

    tierSelect.innerHTML = Object.entries(service.tiers)
        .map(([tierId, tier]) => `<option value="${tierId}">${tier.label} - ${formatPrice(tier.price)}</option>`)
        .join("");

    updatePriceDisplay();
}

function updatePriceDisplay() {
    if (!priceDisplay || !serviceSelect || !tierSelect) return;

    const service = services[serviceSelect.value];
    const tier = service ? service.tiers[tierSelect.value] : null;
    priceDisplay.textContent = formatPrice(tier ? tier.price : 0);
}

if (serviceSelect && tierSelect) {
    populateServiceSelect();
    populateTierSelect();

    serviceSelect.addEventListener("change", populateTierSelect);
    tierSelect.addEventListener("change", updatePriceDisplay);
}

if (bookingDateInput) {
    bookingDateInput.min = new Date().toISOString().split("T")[0];
}

if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        bookingError.style.display = "none";
        bookingSuccess.style.display = "none";

        const service = services[serviceSelect.value];
        const tier = service ? service.tiers[tierSelect.value] : null;
        if (!service || !tier) {
            bookingError.textContent = "Selecteer een geldige service en tarief.";
            bookingError.style.display = "block";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Bezig met verzenden...";

        const formData = new FormData(bookingForm);
        formData.set("service", service.name);
        formData.set("duration", tier.label);
        formData.set("price", String(tier.price));

        try {
            const response = await fetch("includes/create-booking.php", {
                method: "POST",
                body: formData
            });

            const message = (await response.text()).trim();

            if (message === "SUCCESS") {
                window.location.href = "booking-verzonden.html";
                return;
            }

            throw new Error(message || "Er ging iets mis bij het boeken.");
        } catch (error) {
            bookingError.textContent = error.message || "Er ging iets mis bij het boeken.";
            bookingError.style.display = "block";
            submitBtn.disabled = false;
            submitBtn.textContent = "Bevestig Boeking";
        }
    });
}
