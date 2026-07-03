const linksPageStrings = {
    nl: {
        page_title: "Mijn Links | Miss Jolie",
        hero_title: "Mijn Links",
        hero_subtitle: "Al mijn belangrijkste kanalen, communities en contactopties op een plek.",
        tg_main_title: "Telegram: Miss Jolie",
        tg_main_meta: "@Jolie71991",
        tg_secret_title: "Telegram: Jolie's Stoute Geheimpje",
        tg_secret_meta: "Open community",
        tg_private_title: "Telegram: Miss Jolie Private Channel",
        tg_private_meta: "Private updates",
        tg_vip_title: "Telegram VIP",
        tg_vip_meta: "Exclusieve VIP toegang",
        f2f_miss_title: "F2F: Miss Jolie",
        f2f_miss_meta: "Face-to-face profiel",
        f2f_mistress_title: "F2F: Meesteres Jolie",
        f2f_mistress_meta: "Dominante kant",
        fancentro_title: "Fancentro: Miss Jolie",
        fancentro_meta: "Fans en exclusieve content",
        kinky_title: "Kinky: Miss Jolie",
        kinky_meta: "Advertentie en profiel",
        fetlife_title: "FetLife: Meesteres Jolie",
        fetlife_meta: "Fetish community",
        sexjobs_miss_title: "SexJobs: Miss Jolie",
        sexjobs_miss_meta: "Cam en telefoonsex",
        sexjobs_mistress_title: "SexJobs: Meesteres Jolie",
        sexjobs_mistress_meta: "Dominant profiel",
        whatsapp_title: "WhatsApp: Miss Jolie",
        whatsapp_meta: "Direct contact"
    },
    en: {
        page_title: "My Links | Miss Jolie",
        hero_title: "My Links",
        hero_subtitle: "All my main channels, communities and contact options in one place.",
        tg_main_title: "Telegram: Miss Jolie",
        tg_main_meta: "@Jolie71991",
        tg_secret_title: "Telegram: Jolie's Naughty Little Secret",
        tg_secret_meta: "Open community",
        tg_private_title: "Telegram: Miss Jolie Private Channel",
        tg_private_meta: "Private updates",
        tg_vip_title: "Telegram VIP",
        tg_vip_meta: "Exclusive VIP access",
        f2f_miss_title: "F2F: Miss Jolie",
        f2f_miss_meta: "Face-to-face profile",
        f2f_mistress_title: "F2F: Mistress Jolie",
        f2f_mistress_meta: "Dominant side",
        fancentro_title: "Fancentro: Miss Jolie",
        fancentro_meta: "Fans and exclusive content",
        kinky_title: "Kinky: Miss Jolie",
        kinky_meta: "Ad and profile",
        fetlife_title: "FetLife: Mistress Jolie",
        fetlife_meta: "Fetish community",
        sexjobs_miss_title: "SexJobs: Miss Jolie",
        sexjobs_miss_meta: "Cam and phone sex",
        sexjobs_mistress_title: "SexJobs: Mistress Jolie",
        sexjobs_mistress_meta: "Dominant profile",
        whatsapp_title: "WhatsApp: Miss Jolie",
        whatsapp_meta: "Direct contact"
    },
    fr: {
        page_title: "Mes Liens | Miss Jolie",
        hero_title: "Mes Liens",
        hero_subtitle: "Tous mes principaux canaux, communautes et options de contact en un seul endroit.",
        tg_main_title: "Telegram: Miss Jolie",
        tg_main_meta: "@Jolie71991",
        tg_secret_title: "Telegram: Le Secret Coquin de Jolie",
        tg_secret_meta: "Communaute ouverte",
        tg_private_title: "Telegram: Chaine Privee de Miss Jolie",
        tg_private_meta: "Mises a jour privees",
        tg_vip_title: "Telegram VIP",
        tg_vip_meta: "Acces VIP exclusif",
        f2f_miss_title: "F2F: Miss Jolie",
        f2f_miss_meta: "Profil face-a-face",
        f2f_mistress_title: "F2F: Maitresse Jolie",
        f2f_mistress_meta: "Cote dominante",
        fancentro_title: "Fancentro: Miss Jolie",
        fancentro_meta: "Fans et contenu exclusif",
        kinky_title: "Kinky: Miss Jolie",
        kinky_meta: "Annonce et profil",
        fetlife_title: "FetLife: Maitresse Jolie",
        fetlife_meta: "Communaute fetish",
        sexjobs_miss_title: "SexJobs: Miss Jolie",
        sexjobs_miss_meta: "Cam et telephone rose",
        sexjobs_mistress_title: "SexJobs: Maitresse Jolie",
        sexjobs_mistress_meta: "Profil dominant",
        whatsapp_title: "WhatsApp: Miss Jolie",
        whatsapp_meta: "Contact direct"
    },
    de: {
        page_title: "Meine Links | Miss Jolie",
        hero_title: "Meine Links",
        hero_subtitle: "Alle meine wichtigsten Kanaele, Communities und Kontaktmoeglichkeiten an einem Ort.",
        tg_main_title: "Telegram: Miss Jolie",
        tg_main_meta: "@Jolie71991",
        tg_secret_title: "Telegram: Jolies schmutziges Geheimnis",
        tg_secret_meta: "Offene Community",
        tg_private_title: "Telegram: Miss Jolie Privatkanal",
        tg_private_meta: "Private Updates",
        tg_vip_title: "Telegram VIP",
        tg_vip_meta: "Exklusiver VIP Zugang",
        f2f_miss_title: "F2F: Miss Jolie",
        f2f_miss_meta: "Face-to-face Profil",
        f2f_mistress_title: "F2F: Herrin Jolie",
        f2f_mistress_meta: "Dominante Seite",
        fancentro_title: "Fancentro: Miss Jolie",
        fancentro_meta: "Fans und exklusive Inhalte",
        kinky_title: "Kinky: Miss Jolie",
        kinky_meta: "Anzeige und Profil",
        fetlife_title: "FetLife: Herrin Jolie",
        fetlife_meta: "Fetisch Community",
        sexjobs_miss_title: "SexJobs: Miss Jolie",
        sexjobs_miss_meta: "Cam und Telefonsex",
        sexjobs_mistress_title: "SexJobs: Herrin Jolie",
        sexjobs_mistress_meta: "Dominantes Profil",
        whatsapp_title: "WhatsApp: Miss Jolie",
        whatsapp_meta: "Direkter Kontakt"
    }
};

let linksPageLang = localStorage.getItem("lang") || "nl";

function applyLinksPageTexts() {
    const langStrings = linksPageStrings[linksPageLang] || linksPageStrings.nl;
    document.documentElement.lang = linksPageLang;

    document.querySelectorAll("[data-link-text]").forEach((element) => {
        const key = element.getAttribute("data-link-text");
        const value = langStrings[key];
        if (!value) return;

        if (element.tagName === "TITLE") {
            document.title = value;
        } else {
            element.textContent = value;
        }
    });
}

applyLinksPageTexts();

window.addEventListener("langchange", (event) => {
    linksPageLang = event?.detail?.lang || localStorage.getItem("lang") || "nl";
    applyLinksPageTexts();
});
