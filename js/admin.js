/* ============================================================
   LOGIN
============================================================ */
const loginBtn = document.getElementById("loginBtn");
const loginScreen = document.getElementById("login-screen");
const adminPanel = document.getElementById("admin-panel");

const CORRECT_PASS = "jolie123";

loginBtn.onclick = () => {
    const pass = document.getElementById("adminPass").value;

    if (pass === CORRECT_PASS) {
        loginScreen.classList.add("hidden");
        adminPanel.classList.remove("hidden");
        loadCollections();
        loadBookings();
    } else {
        document.getElementById("loginError").innerText = "Wachtwoord onjuist";
    }
};


/* ============================================================
   LOAD COLLECTIONS IN GRID LAYOUT
============================================================ */
async function loadCollections() {

    try {
        // 1. Laad basis collecties
        const res = await fetch("includes/collections.json");
        if (!res.ok) {
            console.error("Failed to load collections.json:", res.status);
            alert("❌ Kan collections.json niet laden");
            return;
        }
        
        const text = await res.text();
        console.log("Collections.json response:", text.substring(0, 200));
        
        const data = JSON.parse(text);

    // 2. Laad admin overrides indien aanwezig
    let adminData = {};
    try {
        const adminRes = await fetch("data/admin-data.json");
        adminData = await adminRes.json();
    } catch (e) {
        adminData = {};
    }

    const container = document.getElementById("collectionList");
    container.innerHTML = "";

    Object.keys(data.collections).forEach((name, index) => {

        const col = data.collections[name];

        const set = adminData[name] || {
            description: col.description || "",
            priceBrons: col.prices?.brons || 0,
            priceZilver: col.prices?.zilver || 0,
            priceGoud: col.prices?.goud || 0,
            pricePlatinum: col.prices?.platinum || 0,
            tiers: col.tiers || {
                brons: true,
                zilver: true,
                goud: true,
                platinum: true
            },
            active: col.active ?? true
        };

        // Gebruik naam als ID
        const ID = name.replace(/\s+/g, "_");

        container.innerHTML += `
            <div class="collection-box">
                <h3>${name}</h3>

                <div class="collection-grid">
                    <!-- TITEL -->
                    <label for="${ID}_title">Titel</label>
                    <input class="collection-title" type="text" id="${ID}_title" value="${name}">

                    <!-- RECHTS : UPLOAD + ACTIEF -->
                    <div class="collection-side">
                        <div class="file-upload">
                            <label>Afbeelding</label>
                            <input type="file" id="${ID}_image">
                        </div>

                        <div class="active-toggle">
                            <input type="checkbox" id="${ID}_active" ${set.active ? "checked" : ""}>
                            <span>Actief</span>
                        </div>
                    </div>

                    <!-- BESCHRIJVING -->
                    <label for="${ID}_desc">Beschrijving</label>
                    <div class="collection-description">
                        <textarea id="${ID}_desc">${set.description}</textarea>
                    </div>
                    <div></div>

                    <!-- PRIJZEN -->
                    <label>Prijzen</label>
                    <div class="price-row">
                        <input type="number" id="${ID}_brons"     value="${set.priceBrons}">
                        <input type="number" id="${ID}_zilver"    value="${set.priceZilver}">
                        <input type="number" id="${ID}_goud"      value="${set.priceGoud}">
                        <input type="number" id="${ID}_platinum"  value="${set.pricePlatinum}">
                    </div>
                    <div></div>

                    <!-- TIERS -->
                    <label>Tiers</label>
                    <div class="tier-row">
                        <label><input type="checkbox" id="${ID}_t_brons" ${set.tiers.brons ? "checked" : ""}> Brons</label>
                        <label><input type="checkbox" id="${ID}_t_zilver" ${set.tiers.zilver ? "checked" : ""}> Zilver</label>
                        <label><input type="checkbox" id="${ID}_t_goud" ${set.tiers.goud ? "checked" : ""}> Goud</label>
                        <label><input type="checkbox" id="${ID}_t_platinum" ${set.tiers.platinum ? "checked" : ""}> Platinum</label>
                    </div>
                    <div></div>

                </div>
            </div>
        `;
    });

    } catch (error) {
        console.error("Error loading collections:", error);
        alert("❌ Fout bij laden collecties: " + error.message);
    }

}


/* ============================================================
   SAVE BUTTON
============================================================ */
document.getElementById("saveBtn").onclick = async () => {
    
    try {
        // 1. Huidige collections.json inladen
        const res = await fetch("includes/collections.json");
        if (!res.ok) {
            alert("❌ Fout: Kan collections.json niet laden (Status: " + res.status + ")");
            return;
        }
        
        const text = await res.text();
        console.log("Loaded collections.json");
        
        let db;
        try {
            db = JSON.parse(text);
        } catch (e) {
            console.error("JSON parse error:", e);
            console.error("Response text:", text);
            alert("❌ Collections.json is niet geldig JSON");
            return;
        }

        const newCollections = {};

        // 2. Door object itereren (niet array!)
        for (const name of Object.keys(db.collections)) {

            const col = db.collections[name];
            const ID = name.replace(/\s+/g, "_");

            let imagePath = col.image;

            // 3. Check of er een nieuwe foto is gekozen
            const fileInput = document.getElementById(`${ID}_image`);
            if (fileInput && fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append("file", fileInput.files[0]);

                // Upload naar upload.php
                const uploadRes = await fetch("includes/upload.php", {
                    method: "POST",
                    body: formData
                });

                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    imagePath = uploadData.path || uploadData.url; // Nieuwe URL opslaan
                }
            }

            // 4. Data opslaan in nieuwe JSON structuur
            newCollections[name] = {

                active: document.getElementById(`${ID}_active`).checked,
                mode: col.mode || 'miss', // Behoud mode property!

                title: document.getElementById(`${ID}_title`).value,
                description: document.getElementById(`${ID}_desc`).value,

                image: imagePath,

                prices: {
                    brons: Number(document.getElementById(`${ID}_brons`).value),
                    zilver: Number(document.getElementById(`${ID}_zilver`).value),
                    goud: Number(document.getElementById(`${ID}_goud`).value),
                    platinum: Number(document.getElementById(`${ID}_platinum`).value)
                },

                tiers: {
                    brons: document.getElementById(`${ID}_t_brons`).checked,
                    zilver: document.getElementById(`${ID}_t_zilver`).checked,
                    goud: document.getElementById(`${ID}_t_goud`).checked,
                    platinum: document.getElementById(`${ID}_t_platinum`).checked
                }
            };
        }

        // 5. Stuur nieuwe data naar admin-save.php
        console.log("Saving collections:", newCollections);
        
        const saveRes = await fetch("includes/admin-save.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collections: newCollections })
        });
        
        if (!saveRes.ok) {
            alert("❌ Server fout: " + saveRes.status);
            return;
        }
        
        const saveText = await saveRes.text();
        console.log("Save response:", saveText);
        
        let saveData;
        try {
            saveData = JSON.parse(saveText);
        } catch (e) {
            console.error("JSON parse error:", e);
            console.error("Response:", saveText);
            alert("❌ Ongeldige server response. Check console voor details.");
            return;
        }
        
        if (saveData.success) {
            alert("✅ Collecties succesvol opgeslagen!");
            location.reload();
        } else {
            alert("❌ Fout bij opslaan: " + (saveData.error || "Onbekende fout"));
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("❌ Er is een fout opgetreden: " + error.message);
    }
};

/* ============================================================
   LOAD BOOKINGS
============================================================ */
function loadBookings() {
    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const container = document.getElementById("bookingsList");
    container.innerHTML = "";

    if (bookings.length === 0) {
        container.innerHTML = "<p>Geen boekingen gevonden.</p>";
        return;
    }

    bookings.forEach(booking => {
        container.innerHTML += `
            <div class="booking-item">
                <p><strong>Naam:</strong> ${booking.name}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Datum:</strong> ${booking.date}</p>
                <p><strong>Tijd:</strong> ${booking.time}</p>
                <p><strong>Type:</strong> ${booking.type}</p>
                <p><strong>Timestamp:</strong> ${booking.timestamp}</p>
            </div>
        `;
    });
}

