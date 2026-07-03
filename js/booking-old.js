/* ============================================================
   BOOKING SYSTEM WITH CALENDAR & TIME SLOTS
============================================================ */

let strings = {};
let currentLang = localStorage.getItem("lang") || "nl";
let currentMode = localStorage.getItem("mode") || "miss";

// Load strings
(async function loadStrings() {
    strings = await fetch("data/strings.json").then(r => r.json());
    renderServices();
    updateTexts();
})();

function updateTexts() {
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
    
    const logo = document.querySelector(".logo");
    if (logo) {
        logo.textContent = currentMode === "mistress" ? "Mrs Jolie" : "Miss Jolie";
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

    mainNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menuToggle.classList.remove("active");
            mainNav.classList.remove("active");
        });
    });
}

/* ============================================================
   LANGUAGE DROPDOWN
============================================================ */
if (langToggle) {
    const langBtn = langToggle.querySelector(".lang-btn");
    const langOptions = langToggle.querySelectorAll(".lang-option");
    
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

    langOptions.forEach(option => {
        option.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = option.dataset.lang;
            
            langOptions.forEach(opt => opt.classList.remove("active"));
            option.classList.add("active");
            
            currentLang = lang;
            localStorage.setItem("lang", lang);
            updateTexts();
            renderServices();
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

const services = {
    "Sexting": {
        nameKey: "service_sexting",
        image: "images/photos/mix-brons.jpg",
        prices: {
            "15min": 25.00,
            "30min": 45.00,
            "60min": 75.00,
            "dag": 150.00,
            "week": 500.00,
            "maand": 1500.00
        },
        durations: {
            "15min": "duration_15min",
            "30min": "duration_30min",
            "60min": "duration_60min",
            "dag": "duration_day",
            "week": "duration_week",
            "maand": "duration_month"
        },
        tiers: {
            "15min": true,
            "30min": true,
            "60min": true,
            "dag": true,
            "week": true,
            "maand": true
        }
    },
    "Videocall No Face": {
        nameKey: "service_videocall_no_face",
        image: "images/photos/mix-brons.jpg",
        prices: {
            "15min": 30.00,
            "30min": 55.00,
            "60min": 100.00
        },
        durations: {
            "15min": "duration_15min",
            "30min": "duration_30min",
            "60min": "duration_60min"
        },
        tiers: {
            "15min": true,
            "30min": true,
            "60min": true
        }
    },
    "Videocall With Face": {
        nameKey: "service_videocall_with_face",
        image: "images/photos/mix-brons.jpg",
        prices: {
            "15min": 40.00,
            "30min": 70.00,
            "60min": 120.00
        },
        durations: {
            "15min": "duration_15min",
            "30min": "duration_30min",
            "60min": "duration_60min"
        },
        tiers: {
            "15min": true,
            "30min": true,
            "60min": true
        }
    },
    "Dick Rating": {
        nameKey: "service_dickrating",
        image: "images/photos/mix-brons.jpg",
        prices: {
            "voicememo": 10.00,
            "video": 15.00,
            "topless_video": 20.00,
            "topless_video_dick": 25.00
        },
        durations: {
            "voicememo": "dickrating_voicememo",
            "video": "dickrating_video",
            "topless_video": "dickrating_topless_video",
            "topless_video_dick": "dickrating_topless_video_dick"
        },
        tiers: {
            "voicememo": true,
            "video": true,
            "topless_video": true,
            "topless_video_dick": true
        }
    },
    "Chastity": {
        nameKey: "service_chastity",
        image: "images/kooitjes/doublelock_1.jpeg",
        prices: {
            "weekend": 25.00,
            "week": 50.00,
            "maand": 100.00
        },
        durations: {
            "weekend": "duration_weekend",
            "week": "duration_week",
            "maand": "duration_month"
        },
        tiers: {
            "weekend": true,
            "week": true,
            "maand": true
        }
    }
};

let selectedService = null;
let selectedDate = null;
let selectedTimeSlot = null;

// Time slots van 09:00 tot 23:00 met 15 min intervals
const timeSlots = [];
for (let hour = 9; hour < 23; hour++) {
    for (let min = 0; min < 60; min += 15) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        timeSlots.push(time);
    }
}

/* ============================================================
   RENDER SERVICES
============================================================ */
function renderServices() {
    const grid = document.getElementById("servicesGrid");
    if (!grid) return;
    
    grid.innerHTML = "";

    Object.keys(services).forEach(key => {
        const service = services[key];
        const serviceName = strings[currentLang] && strings[currentLang][service.nameKey] ? strings[currentLang][service.nameKey] : service.nameKey;
        
        // Get tiers and default values
        const tiers = Object.keys(service.tiers).filter(t => service.tiers[t]);
        const defaultTier = tiers[0];
        const defaultPrice = service.prices[defaultTier];
        const defaultDurationKey = service.durations[defaultTier];
        const defaultDuration = strings[currentLang] && strings[currentLang][defaultDurationKey] ? strings[currentLang][defaultDurationKey] : defaultDurationKey;
        
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.cursor = "pointer";
        card.dataset.serviceKey = key;
        card.dataset.basePrice = defaultPrice;
        
        card.innerHTML = `
            <img src="${service.image}" onerror="this.src='images/photos/photo1.jpg'">
            <h3>${serviceName}</h3>
            <div style="margin: 15px 5px;">
                <select class="tier-select" style="width: 100%; padding: 12px; border: 2px solid #ff66c4; border-radius: 8px; font-size: 14px; background: #2a2a2a; color: white; cursor: pointer; font-weight: 600;">
                    ${tiers.map((t, i) => {
                        const tierDurationKey = service.durations[t];
                        const tierLabel = strings[currentLang] && strings[currentLang][tierDurationKey] ? strings[currentLang][tierDurationKey] : t;
                        const price = service.prices[t];
                        return `<option value="${t}" data-price="${price}" ${i === 0 ? 'selected' : ''}>${tierLabel}</option>`;
                    }).join('')}
                </select>
            </div>
            <p class="product-price" style="font-size: 24px; font-weight: bold; color: #ff66c4; margin: 10px 0;">€${defaultPrice.toFixed(2)}</p>
            <button class="select-btn" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #ff66c4 0%, #ffa366 100%); border: none; border-radius: 10px; color: white; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(255, 102, 196, 0.3);">
                ${strings[currentLang]?.button_select || "Selecteer"}
            </button>
        `;

        // Tier dropdown change
        const tierSelect = card.querySelector(".tier-select");
        tierSelect.addEventListener("change", (e) => {
            e.stopPropagation();
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = parseFloat(selectedOption.dataset.price);
            
            // Update price
            card.dataset.basePrice = price;
            card.querySelector(".product-price").textContent = "€" + price.toFixed(2);
        });

        // Select button with hover effect
        const selectBtn = card.querySelector(".select-btn");
        selectBtn.addEventListener("mouseenter", () => {
            selectBtn.style.transform = "scale(1.05)";
            selectBtn.style.boxShadow = "0 6px 20px rgba(255, 102, 196, 0.5)";
        });
        selectBtn.addEventListener("mouseleave", () => {
            selectBtn.style.transform = "scale(1)";
            selectBtn.style.boxShadow = "0 4px 15px rgba(255, 102, 196, 0.3)";
        });

        selectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            
            // Remove active from all cards
            grid.querySelectorAll(".product-card").forEach(c => c.style.border = "none");
            // Add active to clicked card
            card.style.border = "3px solid #ff66c4";
            
            // Get selected tier from dropdown
            const tierSelect = card.querySelector(".tier-select");
            const tier = tierSelect.value;
            const price = service.prices[tier];
            const durationKey = service.durations[tier];
            const duration = strings[currentLang] && strings[currentLang][durationKey] ? strings[currentLang][durationKey] : tier;
            
            selectedService = { key, name: serviceName, tier, duration, price };
            renderCalendar();
        });

        grid.appendChild(card);
    });
}

/* ============================================================
   CALENDAR
============================================================ */
function renderCalendar() {
    const calendar = document.getElementById("calendar");
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get first and last day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentYear + 1, 0);
    const daysInMonth = lastDay.getDate();

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button onclick="changeMonth(-1)" style="background: #b983ff; color: #000; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer;">←</button>
            <h4 style="color: #ff66c4; margin: 0;">${getMonthName(currentMonth)} ${currentYear}</h4>
            <button onclick="changeMonth(1)" style="background: #b983ff; color: #000; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer;">→</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; text-align: center;">
    `;

    // Weekday headers
    ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].forEach(day => {
        html += `<div style="color: #b983ff; font-weight: 600; padding: 10px 0;">${day}</div>`;
    });

    // Empty cells before first day
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
        html += `<div></div>`;
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isPast = date < today.setHours(0, 0, 0, 0);
        const isToday = day === today.getDate() && currentMonth === today.getMonth();
        
        if (isPast) {
            html += `<div style="color: #555; padding: 10px; border-radius: 8px;">${day}</div>`;
        } else {
            html += `
                <div onclick="selectDate('${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}')" 
                     style="color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; background: ${isToday ? 'rgba(255, 102, 196, 0.3)' : 'rgba(255, 255, 255, 0.05)'}; border: 2px solid transparent;"
                     onmouseover="this.style.borderColor='#ff66c4'"
                     onmouseout="if(!this.classList.contains('selected')) this.style.borderColor='transparent'">
                    ${day}
                </div>
            `;
        }
    }

    html += `</div>`;
    calendar.innerHTML = html;
}

function getMonthName(month) {
    const months = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "October", "November", "December"];
    return months[month];
}

function changeMonth(direction) {
    // Voor demo blijven we in huidige maand
    alert("Maand navigatie - implementeer met echte data");
}

/* ============================================================
   SELECT DATE & SHOW TIME SLOTS
============================================================ */
window.selectDate = function(dateString) {
    if (!selectedService) {
        alert("Selecteer eerst een service!");
        return;
    }

    selectedDate = dateString;
    
    // Visual feedback
    document.querySelectorAll("#calendar > div > div").forEach(el => {
        el.classList.remove("selected");
        el.style.borderColor = "transparent";
    });
    event.target.classList.add("selected");
    event.target.style.borderColor = "#ff66c4";

    // Render time slots
    renderTimeSlots();
};

function renderTimeSlots() {
    const container = document.getElementById("timeSlots");
    container.innerHTML = "";

    timeSlots.forEach(time => {
        // Random availability voor demo
        const isAvailable = Math.random() > 0.3;

        const slot = document.createElement("button");
        slot.textContent = time;
        slot.style.cssText = `
            padding: 12px;
            border-radius: 8px;
            border: none;
            cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
            background: ${isAvailable ? 'rgba(185, 131, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
            color: ${isAvailable ? '#fff' : '#666'};
            font-weight: 600;
            transition: all 0.2s;
        `;

        if (isAvailable) {
            slot.onmouseover = () => slot.style.background = '#b983ff';
            slot.onmouseout = () => slot.style.background = 'rgba(185, 131, 255, 0.2)';
            slot.onclick = () => selectTimeSlot(time);
        }

        container.appendChild(slot);
    });
}

function selectTimeSlot(time) {
    selectedTimeSlot = time;
    
    // Show booking info section
    document.getElementById("bookingInfo").style.display = "block";
    document.getElementById("selectedService").textContent = selectedService.name;
    document.getElementById("selectedDate").textContent = new Date(selectedDate).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById("selectedTime").textContent = time;
    document.getElementById("selectedPrice").textContent = `€${selectedService.price.toFixed(2)}`;

    // Scroll to booking info
    document.getElementById("bookingInfo").scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   CONFIRM BOOKING
============================================================ */
document.getElementById("confirmBooking").addEventListener("click", async () => {
    const name = document.getElementById("customerName").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const message = document.getElementById("customerMessage").value.trim();

    // Validate inputs
    if (!name || !email || !phone) {
        alert("Vul alle verplichte velden in!");
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Vul een geldig e-mailadres in!");
        return;
    }

    const booking = {
        service: selectedService,
        date: selectedDate,
        time: selectedTimeSlot,
        price: selectedService.price,
        customer: { name, email, phone, message },
        timestamp: new Date().toISOString()
    };

    // Save booking to process payment
    localStorage.setItem("pendingBooking", JSON.stringify(booking));

    // Add booking to cart as special item
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({
        name: `Boeking: ${selectedService.name}`,
        description: `${selectedDate} om ${selectedTimeSlot}`,
        price: selectedService.price,
        quantity: 1,
        image: selectedService.image,
        type: 'booking',
        bookingData: booking
    });
    localStorage.setItem("cart", JSON.stringify(cart));

    // Redirect to checkout for payment
    alert("Boeking toegevoegd! Je wordt doorgestuurd naar betalen.");
    window.location.href = "checkout.html";
});

/* ============================================================
   INIT
============================================================ */
renderServices();
