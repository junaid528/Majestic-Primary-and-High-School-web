// main.js - Scroll Animations & Global Effects

document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in');

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => observer.observe(el));

    // Counter Animation for Stats
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const updateCount = () => {
                        const target = +counter.getAttribute('data-target');
                        const count = +counter.getAttribute('data-count') || 0;
                        const speed = 2000; // Total duration in ms
                        const increment = target / (speed / 16); // 60fps

                        if (count < target) {
                            const nextCount = count + increment;
                            counter.setAttribute('data-count', nextCount);
                            counter.innerText = Math.ceil(nextCount) + (counter.getAttribute('data-target') === '100' ? '%' : '+');
                            setTimeout(updateCount, 16);
                        } else {
                            counter.innerText = target + (counter.getAttribute('data-target') === '100' ? '%' : '+');
                        }
                    };
                    updateCount();
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats-grid');
    if (statsSection) statsObserver.observe(statsSection);

    // Navbar scroll effect
    const navbar = document.querySelector('.main-navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            if (navbar) navbar.classList.add('scrolled');
        } else {
            if (navbar) navbar.classList.remove('scrolled');
        }
    });



    /* --- Image Slider (Carousel) Logic --- */
    const sliderTrack = document.querySelector('.slider-track');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const dots = document.querySelectorAll('.dot');

    if (sliderTrack && slides.length > 0) {
        let currentIndex = 0;
        const totalSlides = slides.length;
        let slideInterval;

        const updateSlider = () => {
            // Move track based on the current slide index
            sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Update slides active state
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentIndex);
            });

            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        };

        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlider();
        };

        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlider();
        };

        const startAutoPlay = () => {
            slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
        };

        const stopAutoPlay = () => {
            clearInterval(slideInterval);
        };

        // Event Listeners for Next & Previous
        const handleNext = () => {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        };

        const handlePrev = () => {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        };

        if (nextBtn) nextBtn.addEventListener('click', handleNext);
        if (prevBtn) prevBtn.addEventListener('click', handlePrev);

        // Target individual slide arrows if they exist
        const slideNextArrows = document.querySelectorAll('.slide-arrow.right');
        const slidePrevArrows = document.querySelectorAll('.slide-arrow.left');

        slideNextArrows.forEach(arrow => arrow.addEventListener('click', handleNext));
        slidePrevArrows.forEach(arrow => arrow.addEventListener('click', handlePrev));

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentIndex = parseInt(e.target.getAttribute('data-index'));
                updateSlider();
                stopAutoPlay();
                startAutoPlay();
            });
        });

        // Initialize AutoPlay
        startAutoPlay();

        // Pause on hover
        sliderTrack.addEventListener('mouseenter', stopAutoPlay);
        sliderTrack.addEventListener('mouseleave', startAutoPlay);

        // Touch support for mobile (optional but recommended)
        let touchStartX = 0;
        sliderTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            stopAutoPlay();
        });

        sliderTrack.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchStartX - touchEndX > 50) {
                nextSlide();
            } else if (touchEndX - touchStartX > 50) {
                prevSlide();
            }
            startAutoPlay();
        });
    }

    // Scroll progress bar calculation
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const winScroll = window.scrollY || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (height > 0) {
                const scrolled = (winScroll / height) * 100;
                progressBar.style.width = scrolled + '%';
            }
        });
    }
});
