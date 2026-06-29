/* 
   🌟 MAJESTIC PRIMARY & HIGH SCHOOL, MYSORE
   🏫 CAMPUS FACILITIES INTERACTION ENGINE
   ✨ Purpose: Unified dynamic engine handling high-performance stats counters, 
               scroll transitions, interactive lightboxes, collapsible accordion FAQs,
               and fluid click ripples.
*/

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 📊 1. DYNAMIC STATISTICS COUNTER ANIMATOR
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const animateCounter = (el) => {
        const target = parseInt(el.getAttribute('data-target'), 10);
        if (isNaN(target)) return;
        
        let start = 0;
        const duration = 1800; // Total duration in ms
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out quad formula
            const easeProgress = progress * (2 - progress);
            const currentValue = Math.floor(easeProgress * target);
            
            el.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                el.textContent = target; // Ensure exact final value
            }
        };
        
        requestAnimationFrame(updateCounter);
    };

    const counterObserverOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, counterObserverOptions);

    statNumbers.forEach(num => counterObserver.observe(num));


    // ==========================================
    // ⚙️ 2. DYNAMIC COLLAPSIBLE ACCORDION FAQS
    // ==========================================
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const targetId = trigger.getAttribute('aria-controls');
            const targetContent = document.getElementById(targetId);
            
            // To collapse other accordion items (Single-Active behavior)
            const parentGroup = trigger.closest('.faq-accordion-group');
            if (parentGroup) {
                const siblingTriggers = parentGroup.querySelectorAll('.faq-trigger');
                siblingTriggers.forEach(sibling => {
                    if (sibling !== trigger) {
                        sibling.setAttribute('aria-expanded', 'false');
                        const siblingContent = document.getElementById(sibling.getAttribute('aria-controls'));
                        if (siblingContent) {
                            siblingContent.style.maxHeight = null;
                        }
                    }
                });
            }

            // Toggle active trigger state
            trigger.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
            
            if (targetContent) {
                if (!isExpanded) {
                    // Open accordion smoothly
                    targetContent.style.maxHeight = targetContent.scrollHeight + 'px';
                } else {
                    // Close accordion smoothly
                    targetContent.style.maxHeight = null;
                }
            }
        });

        // Keyboard navigation accessibility
        trigger.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                trigger.click();
            }
        });
    });


    // ==========================================
    // 🖼️ 3. INTERACTIVE LIGHTBOX GALLERY OVERLAY
    // ==========================================
    const galleryItems = document.querySelectorAll('.gallery-lightbox-item');
    
    if (galleryItems.length > 0) {
        // Build dynamic lightbox elements in DOM
        const overlay = document.createElement('div');
        overlay.className = 'facilities-lightbox-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Facility Image Preview');
        
        overlay.innerHTML = `
            <div class="facilities-lightbox-image-wrapper">
                <button class="facilities-lightbox-close" aria-label="Close Preview">&times;</button>
                <img class="facilities-lightbox-img" src="" alt="Campus Facility Preview">
            </div>
            <div class="facilities-lightbox-caption"></div>
        `;
        document.body.appendChild(overlay);

        const lightboxImg = overlay.querySelector('.facilities-lightbox-img');
        const lightboxCaption = overlay.querySelector('.facilities-lightbox-caption');
        const closeButton = overlay.querySelector('.facilities-lightbox-close');

        galleryItems.forEach(item => {
            const link = item.querySelector('a');
            const img = item.querySelector('img');
            
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const fullSrc = link.getAttribute('href');
                    const desc = img ? img.getAttribute('alt') : 'Majestic School Campus';
                    
                    lightboxImg.src = fullSrc;
                    lightboxCaption.textContent = desc;
                    
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Lock main scroll
                    closeButton.focus();
                });
            }
        });

        const dismissLightbox = () => {
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Unlock scroll
        };

        closeButton.addEventListener('click', dismissLightbox);
        
        // Close on background / wrapper overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('facilities-lightbox-image-wrapper')) {
                dismissLightbox();
            }
        });

        // Close on Escape keypress
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                dismissLightbox();
            }
        });
    }


    // ==========================================
    // 🌊 4. INTERACTIVE BUTTON CLICK RIPPLES
    // ==========================================
    const rippleButtons = document.querySelectorAll('.btn-ripple');
    
    rippleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Find current coordinates relative to button bounds
            const bounds = this.getBoundingClientRect();
            const posX = e.clientX - bounds.left;
            const posY = e.clientY - bounds.top;
            
            // Create dynamic ripple span
            const rippleSpan = document.createElement('span');
            rippleSpan.className = 'ripple-effect-span';
            rippleSpan.style.left = `${posX}px`;
            rippleSpan.style.top = `${posY}px`;
            
            this.appendChild(rippleSpan);
            
            // Remove ripple after transition completion
            setTimeout(() => {
                rippleSpan.remove();
            }, 600);
        });
    });


    // ==========================================
    // 🎨 5. INTERSECTION SCROLL TRANSITIONS
    // ==========================================
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const animationObserverOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('animated-active');
                
                // If it is a stagger layout wrapper, cascade children delays
                if (el.getAttribute('data-animate') === 'stagger') {
                    el.classList.add('stagger-active');
                    const children = el.querySelectorAll('.stagger-child');
                    children.forEach((child, index) => {
                        child.style.transitionDelay = `${index * 120}ms`;
                    });
                }
                
                observer.unobserve(el);
            }
        });
    }, animationObserverOptions);

    animatedElements.forEach(el => animationObserver.observe(el));

});
