(() => {
    'use strict';

    const SELECTOR = '.selectSource.detailTrackSelect';
    const MENU_CLASS = 'version-menu';
    const OPTION_CLASS = 'version-menu-option';

    let activeSelect = null;
    let activeMenu = null;

    function closeMenu() {
        activeMenu?.remove();
        activeMenu = null;

        activeSelect?.classList.remove('version-menu-open');
        activeSelect = null;
    }

    function positionMenu(select, menu) {
        const rect = select.getBoundingClientRect();
        const gap = 4;
        const padding = 8;
        const top = rect.bottom + gap;
        const availableHeight = Math.max(
            120,
            window.innerHeight - top - padding
        );

        let left = rect.left;

        if (left + rect.width > window.innerWidth - padding) {
            left = window.innerWidth - rect.width - padding;
        }

        left = Math.max(padding, left);

        menu.style.width = `${rect.width}px`;
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.maxHeight = `${Math.min(500, availableHeight)}px`;
    }

    function selectOption(select, index) {
        select.selectedIndex = index;

        select.dispatchEvent(new Event('input', {
            bubbles: true
        }));

        select.dispatchEvent(new Event('change', {
            bubbles: true
        }));

        closeMenu();
    }

    function openMenu(select) {
        closeMenu();

        const menu = document.createElement('div');
        menu.className = MENU_CLASS;
        menu.setAttribute('role', 'listbox');

        Array.from(select.options).forEach((option, index) => {
            const item = document.createElement('div');

            item.className = OPTION_CLASS;
            item.textContent = option.textContent;
            item.setAttribute('role', 'option');
            item.setAttribute(
                'aria-selected',
                index === select.selectedIndex ? 'true' : 'false'
            );

            if (index === select.selectedIndex) {
                item.classList.add('selected');
            }

            item.addEventListener('mousedown', event => {
                event.preventDefault();
                event.stopPropagation();
                selectOption(select, index);
            });

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        activeSelect = select;
        activeMenu = menu;

        select.classList.add('version-menu-open');

        positionMenu(select, menu);

        menu.children[select.selectedIndex]?.scrollIntoView({
            block: 'nearest'
        });
    }

    function initialize() {
        document.querySelectorAll(SELECTOR).forEach(select => {
            if (select.dataset.versionMenuInitialized) {
                return;
            }

            select.dataset.versionMenuInitialized = 'true';

            select.addEventListener('mousedown', event => {
                event.preventDefault();
                event.stopPropagation();

                if (activeSelect === select && activeMenu) {
                    closeMenu();
                    return;
                }

                openMenu(select);
            });
        });
    }

    initialize();

    new MutationObserver(initialize).observe(document.body, {
        childList: true,
        subtree: true
    });

    document.addEventListener('mousedown', event => {
        if (!activeMenu) {
            return;
        }

        if (
            !activeMenu.contains(event.target) &&
            event.target !== activeSelect
        ) {
            closeMenu();
        }
    });

    window.addEventListener('scroll', event => {
        if (!activeMenu) {
            return;
        }

        if (
            event.target === activeMenu ||
            activeMenu.contains(event.target)
        ) {
            return;
        }

        closeMenu();
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    window.addEventListener('resize', closeMenu);
})();
