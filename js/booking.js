/* ============================================================
   BOOKING SYSTEM WITH CALENDAR & TIME SLOTS
============================================================ */

/* ============================================================
   CUSTOM MODAL HELPER
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
        " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 30px rgba(255, 102, 196, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">OK</button>
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
            
            localStorage.setItem("lang", lang);
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
    sexting: {
        name: "Sexting incl. foto's & video",
        duration: "15 min",
        price: 25.00,
        image: "images/backgrounds/test.jpg"
    },
    videocall: {
        name: "Videocall",
        duration: "30 min",
        price: 50.00,
        image: "images/backgrounds/lingerie-goud.jpg"
    },
    physical: {
        name: "Fysieke Sessie",
        duration: "60 min",
        price: 150.00,
        image: "images/backgrounds/purple-silk-fabric-with-soft-wave_81048-9234 (1).jpg"
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
    grid.innerHTML = "";

    Object.keys(services).forEach(key => {
        const service = services[key];
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="product-card-media">
                <img src="${service.image}" alt="${service.name}" loading="lazy" onerror="this.src='images/backgrounds/test.jpg'">
            </div>
            <div class="product-card-content">
                <h3>${service.name}</h3>
                <p class="product-desc">${service.duration}</p>
                <p class="product-price">EUR ${service.price.toFixed(2)}</p>
            </div>
        `;

        card.addEventListener("click", () => {
            // Remove active from all
            grid.querySelectorAll(".product-card").forEach(c => c.style.borderColor = "rgba(255,255,255,0.08)");
            // Add active to clicked
            card.style.borderColor = "#ff66c4";
            selectedService = { key, ...service };
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
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
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
                <div onclick="selectDate('${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}', this)" 
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
window.selectDate = function(dateString, element) {
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
    if (element) {
        element.classList.add("selected");
        element.style.borderColor = "#ff66c4";
    }

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
        showModal("Vul alle verplichte velden in!", "error");
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showModal("Vul een geldig e-mailadres in!", "error");
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
    localStorage.setItem("pendingCheckout", "true");

    // Redirect to checkout for payment
    showModal("Boeking toegevoegd! Je wordt doorgestuurd naar betalen.", "success");
    setTimeout(() => {
        window.location.href = "checkout.html";
    }, 2000);
});

/* ============================================================
   INIT
============================================================ */
renderServices();
