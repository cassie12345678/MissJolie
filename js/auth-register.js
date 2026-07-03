/* ============================================================
   REGISTRATIE JAVASCRIPT
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

const form = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMessage');
const successMsg = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
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
    submitBtn.textContent = 'Account aanmaken...';
    
    try {
        const response = await fetch('includes/auth-register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Sla user data op in localStorage
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userPurchases', JSON.stringify([]));
            localStorage.setItem('userCollections', JSON.stringify([]));
            
            successMsg.textContent = data.message + ' - Je wordt doorgestuurd...';
            successMsg.style.display = 'block';
            
            // Redirect naar account pagina
            setTimeout(() => {
                window.location.href = 'account.html';
            }, 1500);
        } else {
            errorMsg.textContent = data.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Account aanmaken';
        }
    } catch (error) {
        console.error('Registratie error:', error);
        errorMsg.textContent = 'Er ging iets fout. Probeer het later opnieuw.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Account aanmaken';
    }
});

// Check of user al ingelogd is
if (localStorage.getItem('loggedIn') === 'true') {
    window.location.href = 'account.html';
}
