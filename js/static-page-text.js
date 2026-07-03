let staticPageStrings = null;
let staticPageLang = localStorage.getItem("lang") || "nl";

function applyStaticPageTexts() {
    if (!staticPageStrings) return;

    const langStrings = staticPageStrings[staticPageLang] || staticPageStrings.nl || {};

    document.documentElement.lang = staticPageLang;

    document.querySelectorAll("[data-text]").forEach((element) => {
        const key = element.getAttribute("data-text");
        const value = langStrings[key];
        if (!value) return;

        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.placeholder = value;
        } else if (element.tagName === "TITLE") {
            document.title = value;
        } else {
            element.textContent = value;
        }
    });

    document.querySelectorAll("[data-text-attr]").forEach((element) => {
        const definitions = element.getAttribute("data-text-attr");
        if (!definitions) return;

        definitions.split(";").forEach((definition) => {
            const [attributeName, key] = definition.split(":").map((part) => part && part.trim());
            if (!attributeName || !key || !langStrings[key]) return;
            element.setAttribute(attributeName, langStrings[key]);
        });
    });
}

(async function initStaticPageTexts() {
    staticPageStrings = await fetch("data/strings.json").then((response) => response.json());
    window.strings = staticPageStrings;
    applyStaticPageTexts();
    window.dispatchEvent(new CustomEvent("langchange", {
        detail: { lang: staticPageLang }
    }));
})();

window.addEventListener("langchange", (event) => {
    staticPageLang = event?.detail?.lang || localStorage.getItem("lang") || "nl";
    applyStaticPageTexts();
});
