(() => {
    "use strict";

    const CONFIG = window.JELLYFIN_EXTERNAL_LINKS_CONFIG;
    const PROJECT_BASE = window.JELLYFIN_CUSTOM_BASE || document.currentScript?.src || "";

    if (!CONFIG || !Array.isArray(CONFIG.providers)) {
        console.error("[External Links] Missing provider config.");
        return;
    }

    const DEBUG = Boolean(CONFIG.debug);
    const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
    const PROCESSED_ATTR = "data-jellyfin-external-links-processed";
    const DEFAULT_LOGO_HEIGHT = Number(CONFIG.defaultLogoHeight) || 25;
    const FALLBACK_LOGO_WIDTH = Number(CONFIG.fallbackLogoWidth) || 145;
    const imageSizeCache = new Map();

    function log(...args) {
        if (DEBUG) {
            console.log("[External Links]", ...args);
        }
    }

    function warn(...args) {
        console.warn("[External Links]", ...args);
    }

    function absoluteUrl(path) {
        return new URL(path, PROJECT_BASE).href;
    }

    function normalizeHostname(hostname) {
        return hostname.toLowerCase().replace(/^www\./, "");
    }

    function normalizeUrl(url) {
        return url.replace(/[),.;\]]+$/g, "");
    }

    function providerForUrl(url) {
        let parsed;

        try {
            parsed = new URL(url);
        } catch {
            return null;
        }

        const hostname = normalizeHostname(parsed.hostname);

        return CONFIG.providers.find((provider) => {
            return provider.domains.some((domain) => {
                const normalizedDomain = normalizeHostname(domain);
                return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
            });
        }) || null;
    }

    function findDetailRoot() {
        return document.querySelector(".detailPagePrimaryContainer")
            || document.querySelector(".itemDetailPage")
            || document.querySelector("[data-type='Movie']")
            || document.querySelector("main")
            || document.body;
    }

    function findDescription(root) {
        return root.querySelector(".overview")
            || root.querySelector(".itemOverview")
            || root.querySelector(".detailSectionContent")
            || root.querySelector(".readOnlyContent")
            || null;
    }

    function findExternalLinksContainer(root) {
        return root.querySelector(".itemExternalLinks")
            || document.querySelector(".itemExternalLinks")
            || createExternalLinksContainer(root);
    }

    function createExternalLinksContainer(root) {
        const container = document.createElement("div");
        container.className = "itemExternalLinks focuscontainer-x jellyfin-custom-external-links";

        const anchor = findDescription(root);
        if (anchor?.parentElement) {
            anchor.parentElement.insertBefore(container, anchor.nextSibling);
        } else {
            root.appendChild(container);
        }

        return container;
    }

    function collectProviderUrls(description) {
        const text = description.textContent || "";
        const matches = text.match(URL_PATTERN) || [];
        const links = [];

        for (const rawUrl of matches) {
            const url = normalizeUrl(rawUrl);
            const provider = providerForUrl(url);

            if (provider) {
                links.push({ provider, url });
            }
        }

        return links;
    }

    function removeProviderUrlsFromText(node) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        for (const textNode of textNodes) {
            textNode.nodeValue = textNode.nodeValue.replace(URL_PATTERN, (rawUrl) => {
                const url = normalizeUrl(rawUrl);
                return providerForUrl(url) ? "" : rawUrl;
            });
        }

        node.normalize();
    }

    function externalLinkExists(container, url) {
        return Boolean(container.querySelector(`a[href="${CSS.escape(url)}"]`));
    }

    function findTemplateLink(container) {
        return container.querySelector("a[href]")
            || document.querySelector(".itemExternalLinks a[href]");
    }

    function numberToPx(value, fallback) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return `${value}px`;
        }

        if (typeof value === "string" && value.trim()) {
            return value;
        }

        return `${fallback}px`;
    }

    function providerLogoHeight(provider) {
        return Number(provider.logoHeight) || DEFAULT_LOGO_HEIGHT;
    }

    function providerLogoWidth(provider) {
        return provider.logoWidth || provider.width || null;
    }

    function applyLogoSize(link, provider, assetUrl) {
        const height = providerLogoHeight(provider);
        const configuredWidth = providerLogoWidth(provider);

        link.style.setProperty("--provider-logo-height", numberToPx(provider.logoHeight, height));

        if (configuredWidth) {
            link.style.setProperty("--provider-logo-width", numberToPx(configuredWidth, FALLBACK_LOGO_WIDTH));
            log("Using configured logo width", provider.displayName, configuredWidth);
            return;
        }

        link.style.setProperty("--provider-logo-width", `${FALLBACK_LOGO_WIDTH}px`);
        log("Temporarily using fallback logo width", provider.displayName, FALLBACK_LOGO_WIDTH);
        detectLogoWidth(assetUrl, height)
            .then((width) => {
                link.style.setProperty("--provider-logo-width", `${width}px`);
                log("Detected logo width", provider.displayName, width);
            })
            .catch((error) => {
                warn(
                    "Using fallback logo width because automatic sizing failed.",
                    provider.displayName,
                    `${FALLBACK_LOGO_WIDTH}px`,
                    error
                );
            });
    }

    function detectLogoWidth(assetUrl, height) {
        const cacheKey = `${assetUrl}|${height}`;

        if (imageSizeCache.has(cacheKey)) {
            return imageSizeCache.get(cacheKey);
        }

        const promise = new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                if (!image.naturalWidth || !image.naturalHeight) {
                    reject(new Error("Image has no natural size."));
                    return;
                }

                resolve(Math.round((image.naturalWidth / image.naturalHeight) * height));
            };

            image.onerror = () => reject(new Error(`Failed to load logo: ${assetUrl}`));
            image.src = assetUrl;
        });

        imageSizeCache.set(cacheKey, promise);
        return promise;
    }

    function createProviderLink(container, provider, url) {
        const template = findTemplateLink(container);
        const link = template ? template.cloneNode(true) : document.createElement("a");
        const assetUrl = absoluteUrl(provider.asset);

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = provider.displayName;
        link.title = provider.displayName;
        link.dataset.providerKey = provider.key;
        link.classList.add("jellyfin-provider-link");
        link.style.setProperty("--provider-logo", `url("${assetUrl}")`);
        applyLogoSize(link, provider, assetUrl);

        return link;
    }

    function containerHasLinks(container) {
        return Boolean(container.querySelector("a[href]"));
    }

    function appendProviderLink(container, link) {
        if (containerHasLinks(container)) {
            container.appendChild(document.createTextNode(", "));
        }

        container.appendChild(link);
    }

    function addProviderLinks(root, links) {
        const container = findExternalLinksContainer(root);

        for (const { provider, url } of links) {
            if (externalLinkExists(container, url)) {
                continue;
            }

            appendProviderLink(container, createProviderLink(container, provider, url));
            log("Added provider link", provider.displayName, url);
        }
    }

    function processDetailPage() {
        const root = findDetailRoot();
        const description = findDescription(root);

        if (!description || description.getAttribute(PROCESSED_ATTR) === location.href) {
            return;
        }

        const links = collectProviderUrls(description);

        if (links.length === 0) {
            description.setAttribute(PROCESSED_ATTR, location.href);
            return;
        }

        addProviderLinks(root, links);
        removeProviderUrlsFromText(description);
        description.setAttribute(PROCESSED_ATTR, location.href);
    }

    let pending = 0;

    function scheduleProcess() {
        window.clearTimeout(pending);
        pending = window.setTimeout(processDetailPage, 250);
    }

    scheduleProcess();

    const observer = new MutationObserver(scheduleProcess);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    window.addEventListener("hashchange", scheduleProcess);
    window.addEventListener("popstate", scheduleProcess);
})();
