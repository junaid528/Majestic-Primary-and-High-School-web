document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // 🌟 DYNAMIC DESKTOP NAVBAR RESTORATION / INJECTION
    const navLeft = document.querySelector('.nav-left');
    if (navLeft) {
        // Check if CAMPUS FACILITIES already exists in this desktop navbar
        const hasFacilities = Array.from(navLeft.querySelectorAll('a')).some(a => {
            const txt = (a.textContent || '').toUpperCase();
            return txt.includes('CAMPUS FACILITIES') || txt.includes('FACILITIES');
        });

        if (!hasFacilities) {
            // Determine if active page is a facilities page
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            const isFacilitiesPage = [
                'campus-facilities.html', 'facilities.html', 'science-laboratory.html',
                'computer-laboratory.html', 'kids-playground.html', 'islamiyat-quran.html',
                'seminar-hall.html'
            ].includes(currentPath);

            const activeClass = isFacilitiesPage ? 'active' : '';

            // Build the standard CAMPUS FACILITIES dropdown node
            const li = document.createElement('li');
            li.className = `dropdown ${activeClass}`;
            li.innerHTML = `
                <a href="#">CAMPUS FACILITIES <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="campus-facilities.html">Campus Facilities (Main Page)</a></li>
                    <li><a href="science-laboratory.html">Science Laboratory</a></li>
                    <li><a href="computer-laboratory.html">Computer Laboratory</a></li>
                    <li><a href="kids-playground.html">Kids Playground</a></li>
                    <li><a href="islamiyat-quran.html">Islamiyat & Quran Classes</a></li>
                    <li><a href="seminar-hall.html">Seminar Hall</a></li>
                </ul>
            `;
            navLeft.appendChild(li);
        }
    }

    const hamburger = document.querySelector('.hamburger');
    if (!hamburger) return;

    // Accessibility attributes for hamburger
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('tabindex', '0');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');

    // Create the overlay if it doesn't exist
    let overlay = document.querySelector('.mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        body.appendChild(overlay);
    }

    // Always create a clean, fresh mobile drawer to avoid page duplication
    let navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.remove();
    }

    // Build the container
    navMenu = document.createElement('nav');
    navMenu.className = 'nav-menu';
    navMenu.id = 'mobile-nav-drawer';
    navMenu.setAttribute('aria-label', 'Mobile Navigation');
    navMenu.setAttribute('aria-hidden', 'true');
    body.appendChild(navMenu);

    // Dynamic Mobile-specific Navigation Structure (matches the exact prompt structure)
    const menuData = [
        { title: 'HOME', link: 'index.html' },
        {
            title: 'ABOUT',
            link: '#',
            dropdown: [
                { title: 'About the Institution', link: 'about.html' },
                { title: 'Vision & Core Values', link: 'vision-values.html' },
                { title: 'Guiding Philosophy', link: 'guiding-philosophy.html' },
                { title: 'Annual Insights Report', link: 'annual-report.html' }
            ]
        },
        {
            title: 'CHAIRMAN',
            link: 'chairman.html'
        },
        {
            title: 'GENERAL INFO',
            link: '#',
            dropdown: [
                { title: 'School Timings', link: 'school-timings.html' },
                { title: 'Parent Guidelines', link: 'parent-guidelines.html' },
                { title: 'Student Guidelines', link: 'student-guidelines.html' },
                { title: 'Safety & Security', link: 'safety-security.html' },
                { title: 'School Handbook / Downloads', link: 'handbook-downloads.html' }
            ]
        },
        {
            title: 'CAMPUS FACILITIES',
            link: '#',
            dropdown: [
                { title: 'Campus Facilities (Main Page)', link: 'campus-facilities.html' },
                { title: 'Science Laboratory', link: 'science-laboratory.html' },
                { title: 'Computer Laboratory', link: 'computer-laboratory.html' },
                { title: 'Kids Playground', link: 'kids-playground.html' },
                { title: 'Islamiyat & Quran Classes', link: 'islamiyat-quran.html' },
                { title: 'Seminar Hall', link: 'seminar-hall.html' }
            ]
        },
        {
            title: 'ADMISSIONS',
            link: 'admissions.html'
        },
        {
            title: 'ACADEMICS',
            link: '#',
            dropdown: [
                { title: 'Academic Programs', link: 'academics.html' },
                { title: 'Faculty & Mentors', link: 'faculty-mentors.html' }
            ]
        },
        {
            title: 'ACHIEVEMENTS',
            link: '#',
            dropdown: [
                { title: 'Academic Outcomes', link: 'academic-outcomes.html' },
                { title: 'Student Achievements', link: 'student-achievements.html' },
                { title: 'Excellence Gallery', link: 'excellence-gallery.html' }
            ]
        },
        { title: 'CONTACT', link: 'contact.html' },
        { title: 'LOGIN', link: 'login.html', isLogin: true }
    ];

    // Build Header Content
    const headerHtml = `
        <div class="mobile-drawer-header">
            <button class="mobile-close-btn" id="drawerClose" aria-label="Close Navigation Menu">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
            <div class="mobile-drawer-logo-container">
                <img src="assets/logo.png" alt="Majestic School Crest Logo" class="mobile-drawer-logo">
            </div>
            <h3 class="mobile-drawer-title">Majestic</h3>
            <p class="mobile-drawer-subtitle">Primary & High School</p>
            <div class="mobile-drawer-divider"></div>
        </div>
    `;

    // Process and generate the list recursively or sequentially
    let listHtml = '<ul class="mobile-menu-list" role="menubar">';
    menuData.forEach((item, index) => {
        if (item.dropdown) {
            const submenuId = `submenu-${index}`;
            listHtml += `
                <li class="dropdown" role="none">
                    <a href="#" class="menu-trigger" role="button" aria-haspopup="true" aria-expanded="false" aria-controls="${submenuId}" tabindex="0">
                        <span>${item.title}</span>
                        <i class="fas fa-chevron-down mobile-arrow" aria-hidden="true"></i>
                    </a>
                    <ul id="${submenuId}" class="dropdown-menu" role="menu" aria-label="${item.title} Submenu" style="max-height: 0px;">
                        ${item.dropdown.map(subItem => `
                            <li role="none">
                                <a href="${subItem.link}" role="menuitem" tabindex="-1">${subItem.title}</a>
                            </li>
                        `).join('')}
                    </ul>
                </li>
            `;
        } else {
            if (item.isLogin) {
                listHtml += `
                    <li class="mobile-login-container" role="none">
                        <a href="${item.link}" class="login-btn" role="menuitem" tabindex="0">${item.title}</a>
                    </li>
                `;
            } else {
                listHtml += `
                    <li role="none">
                        <a href="${item.link}" role="menuitem" tabindex="0">${item.title}</a>
                    </li>
                `;
            }
        }
    });
    listHtml += '</ul>';

    // Inject everything into navMenu
    navMenu.innerHTML = headerHtml + listHtml;

    const closeBtn = navMenu.querySelector('#drawerClose');
    const triggers = navMenu.querySelectorAll('.menu-trigger');
    const mobileDropdowns = navMenu.querySelectorAll('.dropdown');

    // Toggle menu state
    const toggleMenu = (forceClose = false) => {
        const isActive = navMenu.classList.contains('active');
        const shouldClose = forceClose || isActive;

        if (shouldClose) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            overlay.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            navMenu.setAttribute('aria-hidden', 'true');
            body.style.overflow = '';
            
            // Focus trap: Return focus to hamburger
            hamburger.focus();
        } else {
            hamburger.classList.add('active');
            navMenu.classList.add('active');
            overlay.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
            navMenu.setAttribute('aria-hidden', 'false');
            body.style.overflow = 'hidden';

            // Accessibility: Focus first focusable element inside drawer (close button)
            setTimeout(() => {
                closeBtn.focus();
            }, 100);
        }
    };

    // Click/keyboard triggers
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(true);
    });

    overlay.addEventListener('click', () => toggleMenu(true));

    // Handle ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            toggleMenu(true);
        }
    });

    // Accordion expand/collapse
    triggers.forEach(trigger => {
        const li = trigger.parentElement;
        const submenu = li.querySelector('.dropdown-menu');
        const arrow = trigger.querySelector('.mobile-arrow');

        const toggleDropdown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = li.classList.contains('open');

            // Close all other dropdowns
            mobileDropdowns.forEach(d => {
                if (d !== li) {
                    d.classList.remove('open');
                    const otherTrigger = d.querySelector('.menu-trigger');
                    const otherMenu = d.querySelector('.dropdown-menu');
                    const otherArrow = d.querySelector('.mobile-arrow');
                    
                    if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
                    if (otherMenu) {
                        otherMenu.style.maxHeight = '0px';
                        // Keep subitems out of tab order when closed
                        otherMenu.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
                    }
                    if (otherArrow) otherArrow.classList.remove('rotated');
                }
            });

            // Toggle current dropdown
            if (isOpen) {
                li.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                if (submenu) {
                    submenu.style.maxHeight = '0px';
                    submenu.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
                }
                if (arrow) arrow.classList.remove('rotated');
            } else {
                li.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                if (submenu) {
                    submenu.style.maxHeight = submenu.scrollHeight + 'px';
                    submenu.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '0'));
                }
                if (arrow) arrow.classList.add('rotated');
            }
        };

        trigger.addEventListener('click', toggleDropdown);
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown(e);
            }
        });
    });

    // Highlight current active tab page
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const allLinks = navMenu.querySelectorAll('a');
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
            let parentLi = link.closest('.dropdown');
            if (parentLi) {
                parentLi.classList.add('active');
                const pTrigger = parentLi.querySelector('.menu-trigger');
                const pSubmenu = parentLi.querySelector('.dropdown-menu');
                const pArrow = parentLi.querySelector('.mobile-arrow');
                
                // Keep the active dropdown expanded by default! This is great UX!
                parentLi.classList.add('open');
                if (pTrigger) pTrigger.setAttribute('aria-expanded', 'true');
                if (pSubmenu) {
                    // Let scrollHeight compute on next frame so dimensions exist
                    setTimeout(() => {
                        pSubmenu.style.maxHeight = pSubmenu.scrollHeight + 'px';
                    }, 200);
                    pSubmenu.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '0'));
                }
                if (pArrow) pArrow.classList.add('rotated');
            }
        }
    });

    // Handle tab keys for focus trap inside active drawer
    navMenu.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        // Get only visible/available items in drawer
        const focusableElements = Array.from(navMenu.querySelectorAll('button, a[tabindex="0"]')).filter(el => {
            // Check if element is deep hidden inside a closed dropdown
            const dropdownParent = el.closest('.dropdown-menu');
            if (dropdownParent) {
                return dropdownParent.style.maxHeight !== '0px';
            }
            return true;
        });
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    });

    // Auto close drawer on viewport resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && navMenu.classList.contains('active')) {
            toggleMenu(true);
        }
    });
});
