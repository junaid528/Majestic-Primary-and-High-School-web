document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    const hamburger = document.querySelector('.hamburger');
    if (!hamburger) return;

    let navMenu = document.querySelector('.nav-menu');

    // Dynamically assemble a unified mobile .nav-menu drawer if on a page with a split desktop navbar
    if (!navMenu) {
        const navLeft = document.querySelector('.nav-left');
        const navRight = document.querySelector('.nav-right');
        
        if (navLeft || navRight) {
            navMenu = document.createElement('ul');
            navMenu.className = 'nav-menu';
            
            if (navLeft) {
                Array.from(navLeft.children).forEach(child => {
                    const clone = child.cloneNode(true);
                    navMenu.appendChild(clone);
                });
            }
            if (navRight) {
                Array.from(navRight.children).forEach(child => {
                    const clone = child.cloneNode(true);
                    if (clone.querySelector('.login-btn')) {
                        clone.className = 'mobile-login-container';
                    }
                    navMenu.appendChild(clone);
                });
            }
        }
    }

    if (!navMenu) return;

    // Critical: Append navMenu directly to body to solve CSS stacking context bugs.
    // This allows the side drawer to cleanly float ABOVE the backdrop overlay on mobile.
    if (navMenu.parentElement !== body) {
        body.appendChild(navMenu);
    }

    // 1. Initialize Mobile Overlay and append to body
    let overlay = document.querySelector('.mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        body.appendChild(overlay);
    }

    // 2. Clear existing drawer header if any (prevent duplicates)
    const existingHeader = navMenu.querySelector('.mobile-drawer-header');
    if (existingHeader) existingHeader.remove();

    // 3. Create and Inject Mobile Header (Centered Logo & Premium Branding)
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-drawer-header';
    mobileHeader.innerHTML = `
        <div class="mobile-close-btn" id="drawerClose" aria-label="Close Menu">
            <i class="fas fa-times"></i>
        </div>
        <div class="mobile-drawer-logo-container">
            <img src="assets/logo.png" alt="Majestic School Logo" class="mobile-drawer-logo">
        </div>
        <h3 class="mobile-drawer-title">MAJESTIC</h3>
        <p class="mobile-drawer-subtitle">Primary & High School</p>
    `;
    navMenu.prepend(mobileHeader);

    const closeBtn = mobileHeader.querySelector('#drawerClose');

    // 4. Toggle Logic
    const toggleMenu = (forceClose = false) => {
        const isActive = navMenu.classList.contains('active');
        const shouldClose = forceClose || isActive;

        if (shouldClose) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            overlay.classList.remove('active');
            body.style.overflow = 'auto';
        } else {
            hamburger.classList.add('active');
            navMenu.classList.add('active');
            overlay.classList.add('active');
            body.style.overflow = 'hidden';
        }
    };

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(true);
    });

    overlay.addEventListener('click', () => toggleMenu(true));

    // 5. Dynamically restructure and bind mobile submenus & navigation links
    const mobileDropdowns = navMenu.querySelectorAll('.dropdown');
    mobileDropdowns.forEach(dropdown => {
        const mainLink = dropdown.querySelector(':scope > a');
        if (mainLink) {
            // Avoid duplicate mobile arrows if initialized multiple times
            if (mainLink.querySelector('.mobile-arrow')) return;

            // Remove any existing inline chevrons inside the main link on mobile to avoid duplication
            const innerChevrons = mainLink.querySelectorAll('.fa-chevron-down:not(.mobile-arrow)');
            innerChevrons.forEach(c => c.remove());

            // Create and append the premium dropdown arrow icon
            const arrowIcon = document.createElement('i');
            arrowIcon.className = 'fas fa-chevron-down mobile-arrow';
            mainLink.appendChild(arrowIcon);

            // Handle clicking the parent link to toggle dropdown on mobile
            mainLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isOpen = dropdown.classList.contains('open');

                // Accordion behavior: close other dropdowns and reset their arrows
                mobileDropdowns.forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('open');
                        const otherArrow = d.querySelector('.mobile-arrow');
                        if (otherArrow) otherArrow.classList.remove('rotated');
                    }
                });

                dropdown.classList.toggle('open', !isOpen);
                arrowIcon.classList.toggle('rotated', !isOpen);
            });
        }
    });

    // Make sure clicking any anchor link inside dropdown-menu navigates and closes the drawer
    const subMenuLinks = navMenu.querySelectorAll('.dropdown-menu a');
    subMenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Real page navigation! Close menu and let it navigate.
            toggleMenu(true);
        });
    });

    // Make sure clicking any direct menu links without dropdowns also navigates and closes the drawer
    const directLinks = navMenu.querySelectorAll(':scope > li:not(.dropdown) > a, :scope > .mobile-login-container a');
    directLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            toggleMenu(true);
        });
    });

    // 6. Active State Highlighter
    const activePath = window.location.pathname.split('/').pop() || 'index.html';
    const allLinks = document.querySelectorAll('.nav-left a, .nav-right a, .nav-menu a');
    allLinks.forEach(link => {
        if (link.getAttribute('href') === activePath) {
            link.parentElement.classList.add('active');
            link.classList.add('active');
            const parentDropdown = link.closest('.dropdown');
            if (parentDropdown) parentDropdown.classList.add('active');
        }
    });

    // 7. Auto-close on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && navMenu.classList.contains('active')) {
            toggleMenu(true);
        }
    });
});
