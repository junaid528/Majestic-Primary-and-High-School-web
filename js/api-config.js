/**
 * Majestic Primary and High School Mysore - ERP API Configuration Utility
 * Handles routing of API endpoints across local dev servers and hosting containers.
 */

(function() {
    window.apiUrl = function(path) {
        if (!path) return '';
        // Ensure path starts with a slash
        const cleanPath = path.startsWith('/') ? path : '/' + path;

        // Send all local API calls to the Node backend dynamically on the same origin.
        if (cleanPath.startsWith('/api')) {
            const resolved = window.location.origin + cleanPath;
            console.log('[API CONFIG] Resolved API URL:', cleanPath, '->', resolved);
            return resolved;
        }

        // For non-API local links, keep the current origin.
        return cleanPath;
    };
    console.log('[API CONFIG] System routing utility loaded. API URL helper configured.');
})();
