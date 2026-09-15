(() => {
    const base = 'https://cdn.jsdelivr.net/gh/mysterymadness/jellyfin-addons@main/version-menu/src/';

    if (!document.querySelector('link[data-version-menu-style]')) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = `${base}addon.css`;
        style.dataset.versionMenuStyle = 'true';
        document.head.appendChild(style);
    }

    if (!window.__versionMenuLoaded) {
        window.__versionMenuLoaded = true;

        const script = document.createElement('script');
        script.src = `${base}addon.js`;
        script.async = true;
        document.head.appendChild(script);
    }
})();
