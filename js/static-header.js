const staticMenuToggle = document.getElementById("menuToggle");
const staticMainNav = document.getElementById("mainNav");
const staticLangToggle = document.getElementById("langToggle");

if (staticMenuToggle && staticMainNav) {
    staticMenuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        staticMenuToggle.classList.toggle("active");
        staticMainNav.classList.toggle("active");
        if (staticLangToggle) staticLangToggle.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
        if (!staticMenuToggle.contains(e.target) && !staticMainNav.contains(e.target)) {
            staticMenuToggle.classList.remove("active");
            staticMainNav.classList.remove("active");
        }
    });

    staticMainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            staticMenuToggle.classList.remove("active");
            staticMainNav.classList.remove("active");
        });
    });
}

if (staticLangToggle) {
    const langBtn = staticLangToggle.querySelector(".lang-btn");
    const langOptions = staticLangToggle.querySelectorAll(".lang-option");
    let currentLang = localStorage.getItem("lang") || "nl";

    if (langBtn) {
        langBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            staticLangToggle.classList.toggle("active");
            if (staticMenuToggle) staticMenuToggle.classList.remove("active");
            if (staticMainNav) staticMainNav.classList.remove("active");
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
            staticLangToggle.classList.remove("active");

            window.dispatchEvent(new CustomEvent("langchange", {
                detail: { lang: currentLang }
            }));
        });
    });

    document.addEventListener("click", (e) => {
        if (!staticLangToggle.contains(e.target)) {
            staticLangToggle.classList.remove("active");
        }
    });

    const currentOption = staticLangToggle.querySelector(`[data-lang="${currentLang}"]`);
    if (currentOption) {
        currentOption.classList.add("active");
    }
}
