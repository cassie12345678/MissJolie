const contactForm = document.getElementById("contactForm");
const contactError = document.getElementById("errorMessage");
const contactSuccess = document.getElementById("successMessage");
const contactSubmit = document.getElementById("submitBtn");

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        contactError.style.display = "none";
        contactSuccess.style.display = "none";
        contactSubmit.disabled = true;
        contactSubmit.textContent = "Bezig met verzenden...";

        try {
            const response = await fetch("includes/sendmail.php", {
                method: "POST",
                body: new FormData(contactForm)
            });

            const message = (await response.text()).trim();

            if (message === "SUCCESS") {
                window.location.href = "contact-verzonden.html";
                return;
            }

            throw new Error(message || "Er ging iets mis bij het verzenden.");
        } catch (error) {
            contactError.textContent = error.message || "Er ging iets mis bij het verzenden.";
            contactError.style.display = "block";
            contactSubmit.disabled = false;
            contactSubmit.textContent = "Verstuur bericht";
        }
    });
}
