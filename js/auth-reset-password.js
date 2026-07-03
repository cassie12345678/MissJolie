/* ============================================================
   WACHTWOORD RESET JAVASCRIPT
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

const form = document.getElementById('resetPasswordForm');
const errorMsg = document.getElementById('errorMessage');
const successMsg = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');

// Haal token uit URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    errorMsg.textContent = 'Ongeldige reset link';
    errorMsg.style.display = 'block';
    form.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Reset messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    
    // Validatie
    if (password !== confirmPassword) {
        errorMsg.textContent = 'Wachtwoorden komen niet overeen';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (password.length < 8) {
        errorMsg.textContent = 'Wachtwoord moet minimaal 8 karakters zijn';
        errorMsg.style.display = 'block';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Bezig...';
    
    try {
        const response = await fetch('includes/auth-reset-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, new_password: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMsg.textContent = data.message + ' - Je wordt doorgestuurd naar login...';
            successMsg.style.display = 'block';
            form.style.display = 'none';
            
            // Redirect naar login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorMsg.textContent = data.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Wachtwoord wijzigen';
        }
    } catch (error) {
        console.error('Reset password error:', error);
        errorMsg.textContent = 'Er ging iets fout. Probeer het later opnieuw.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Wachtwoord wijzigen';
    }
});
