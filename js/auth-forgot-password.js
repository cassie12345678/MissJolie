/* ============================================================
   WACHTWOORD VERGETEN JAVASCRIPT
============================================================ */

// Language dropdown
const langToggle = document.getElementById("langToggle");
if (langToggle) {
    const langBtn = langToggle.querySelector(".lang-btn");
    const langOptions = langToggle.querySelectorAll(".lang-option");
    
    if (langBtn) {
        langBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            langToggle.classList.toggle("active");
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

const form = document.getElementById('forgotPasswordForm');
const errorMsg = document.getElementById('errorMessage');
const successMsg = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    // Reset messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Bezig...';
    
    try {
        const response = await fetch('includes/auth-forgot-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMsg.textContent = data.message;
            successMsg.style.display = 'block';
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset link versturen';
        } else {
            errorMsg.textContent = data.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset link versturen';
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        errorMsg.textContent = 'Er ging iets fout. Probeer het later opnieuw.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset link versturen';
    }
});
