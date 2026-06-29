// load-scripts.js — Single source of truth for all script dependencies
// Include this ONE file at the top of every HTML page inside <head>
// It dynamically appends all required scripts in the correct order

(function() {
    const path = window.location.pathname;
    const scriptsToLoad = [];

    // Determine scripts to load based on the current page
    if (path.includes('admin-dashboard.html')) {
        scriptsToLoad.push('/js/error-handler.js');
        scriptsToLoad.push('/js/api-config.js');
        scriptsToLoad.push('/js/dashboard.js');
    } else if (path.includes('dashboard.html')) {
        scriptsToLoad.push('/js/error-handler.js');
        scriptsToLoad.push('/js/api-config.js');
        scriptsToLoad.push('/js/security-audit.js');
    } else if (path.includes('admissions.html')) {
        scriptsToLoad.push('/js/error-handler.js');
        scriptsToLoad.push('/js/api-config.js');
        scriptsToLoad.push('/js/main.js');
        scriptsToLoad.push('/js/navigation.js');
        scriptsToLoad.push('https://unpkg.com/aos@2.3.1/dist/aos.js');
    } else if (path.includes('contact.html')) {
        scriptsToLoad.push('/js/error-handler.js');
        scriptsToLoad.push('/js/api-config.js');
        scriptsToLoad.push('/js/main.js');
        scriptsToLoad.push('/js/navigation.js');
        scriptsToLoad.push('https://unpkg.com/aos@2.3.1/dist/aos.js');
    } else if (
        path.includes('login.html') || 
        path.includes('admin-login.html') || 
        path.includes('register.html') || 
        path.includes('registration.html') || 
        path.includes('forgot-password.html') || 
        path.includes('reset-password.html') ||
        path.includes('signup.html')
    ) {
        scriptsToLoad.push('/js/api-config.js');
    } else {
        // Public informational pages
        scriptsToLoad.push('/js/main.js');
        scriptsToLoad.push('/js/navigation.js');
        scriptsToLoad.push('https://unpkg.com/aos@2.3.1/dist/aos.js');
    }

    // Load scripts sequentially to preserve dependencies
    function loadNextScript(index) {
        if (index >= scriptsToLoad.length) return;
        const src = scriptsToLoad[index];
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onload = () => loadNextScript(index + 1);
        s.onerror = () => {
            console.error(`[Loader] Failed to load script: ${src}`);
            loadNextScript(index + 1);
        };
        document.head.appendChild(s);
    }

    loadNextScript(0);

    // Inject shared partials (e.g., reauth modal) on DOM content loaded
    document.addEventListener('DOMContentLoaded', () => {
        const pathLower = path.toLowerCase();
        // Only inject reauth modal on pages that are administrative dashboards
        if (pathLower.includes('admin-dashboard.html')) {
            if (!document.getElementById('reauthSecurityModal')) {
                fetch('/partials/reauth-modal.html')
                    .then(r => {
                        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                        return r.text();
                    })
                    .then(html => {
                        const container = document.createElement('div');
                        container.innerHTML = html.trim();
                        const modalElement = container.firstElementChild || container;
                        document.body.appendChild(modalElement);
                        console.log('[Loader] Shared reauthSecurityModal successfully injected.');
                    })
                    .catch(err => {
                        console.error('[Loader] Failed to inject shared reauth modal:', err);
                    });
            }
        }
    });
})();
