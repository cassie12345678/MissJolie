let bioStrings = null;
let bioLang = localStorage.getItem("lang") || "nl";
let bioMode = localStorage.getItem("mode") || "miss";

function setContent(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function renderBio() {
    if (!bioStrings) return;

    const text = bioStrings[bioLang] || bioStrings.nl;
    const isMistress = bioMode === "mistress";

    document.title = text.page_title_bio || "Miss Jolie - Info";
    setContent("bioTitle", isMistress ? text.bio_title_mistress : text.bio_title_miss);
    setContent("bioSubtitle", isMistress ? text.bio_subtitle_mistress : text.bio_subtitle_miss);
    setContent("bioText1", text.bio_text_miss_p1);
    setContent("bioText2", text.bio_text_miss_p2);
    setContent("bioText3", text.bio_text_miss_p3);
    setContent("bioText4", text.bio_text_miss_p4);
    setContent("bioText5", text.bio_text_miss_p5);
}

window.addEventListener("langchange", (event) => {
    bioLang = event.detail?.lang || localStorage.getItem("lang") || "nl";
    renderBio();
});

window.addEventListener("modechange", (event) => {
    bioMode = event.detail?.mode || localStorage.getItem("mode") || "miss";
    renderBio();
});

(async function initBio() {
    bioStrings = await fetch("data/strings.json").then((response) => response.json());
    renderBio();
})();
