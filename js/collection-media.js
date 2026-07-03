const collectionMedia = (() => {
    const DEFAULT_COLLECTION_IMAGE = "images/photos/lingerie-goud.jpg";
    const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

    function normalizeAssetPath(assetPath) {
        if (!assetPath) return DEFAULT_COLLECTION_IMAGE;

        return assetPath
            .replace(/^(\.\.\/)+/, "")
            .replace(/\\/g, "/");
    }

    function getActiveCollectionTiers(collection) {
        return Object.keys(collection?.tiers || {}).filter((tier) => collection.tiers[tier]);
    }

    function createImageVariants(assetPath) {
        const normalizedPath = normalizeAssetPath(assetPath);
        const match = normalizedPath.match(/\.(jpg|jpeg|png|webp)$/i);

        if (!match) {
            return [normalizedPath];
        }

        const basePath = normalizedPath.slice(0, -match[0].length);
        return [normalizedPath, ...IMAGE_EXTENSIONS.map((extension) => `${basePath}${extension}`)];
    }

    function getCollectionImageCandidates(collection, preferredTier) {
        const tiers = getActiveCollectionTiers(collection);
        const orderedTiers = preferredTier
            ? [preferredTier, ...tiers.filter((tier) => tier !== preferredTier)]
            : tiers;
        const rawCandidates = [
            ...orderedTiers.map((tier) => collection?.images && collection.images[tier]),
            collection?.image,
            DEFAULT_COLLECTION_IMAGE
        ].filter(Boolean);
        const seen = new Set();

        return rawCandidates
            .flatMap(createImageVariants)
            .filter((candidate) => {
                if (seen.has(candidate)) {
                    return false;
                }

                seen.add(candidate);
                return true;
            });
    }

    function applyCollectionImage(img, collection, preferredTier, altText = "") {
        if (!img || !collection) return;

        const candidates = getCollectionImageCandidates(collection, preferredTier);
        let candidateIndex = 0;

        img.alt = altText || img.alt || "";
        img.dataset.imageTier = preferredTier || "";

        img.onload = () => {
            img.dataset.resolvedSrc = img.getAttribute("src") || DEFAULT_COLLECTION_IMAGE;
        };

        img.onerror = () => {
            candidateIndex += 1;

            if (candidateIndex >= candidates.length) {
                img.onerror = null;
                img.setAttribute("src", DEFAULT_COLLECTION_IMAGE);
                img.dataset.resolvedSrc = DEFAULT_COLLECTION_IMAGE;
                return;
            }

            img.setAttribute("src", candidates[candidateIndex]);
        };

        img.setAttribute("src", candidates[0] || DEFAULT_COLLECTION_IMAGE);
    }

    function getRenderedCollectionImage(card, collection, preferredTier) {
        const image = card.querySelector(".product-card-media img");

        if (image) {
            return image.dataset.resolvedSrc || image.getAttribute("src") || DEFAULT_COLLECTION_IMAGE;
        }

        return getCollectionImageCandidates(collection, preferredTier)[0] || DEFAULT_COLLECTION_IMAGE;
    }

    return {
        DEFAULT_COLLECTION_IMAGE,
        normalizeAssetPath,
        getActiveCollectionTiers,
        getCollectionImageCandidates,
        applyCollectionImage,
        getRenderedCollectionImage
    };
})();

window.collectionMedia = collectionMedia;
