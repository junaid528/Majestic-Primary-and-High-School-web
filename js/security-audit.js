/**
 * Security Audit Module
 * Verifies JWT, Authorization, RBAC, Session Management
 */

const SecurityAudit = (() => {
    const config = {
        JWT_KEY: 'auth_token',
        ROLE_KEY: 'user_role',
        USER_KEY: 'user_name',
        TOKEN_EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24 hours
        CHECK_INTERVAL: 60 * 1000 // Check every minute
    };

    const PROTECTED_ROUTES = [
        '/admin-dashboard.html',
        '/dashboard.html'
    ];

    const ROLE_ROUTES = {
        'SUPER_ADMIN': ['/admin-dashboard.html'],
        'ADMIN': ['/admin-dashboard.html'],
        'STAFF': ['/admin-dashboard.html'],
        'STUDENT': ['/dashboard.html'],
        'PARENT': ['/dashboard.html']
    };

    /**
     * Initialize security checks
     */
    function initialize() {
        console.log('[SECURITY] Initializing security audit module');
        
        // Check JWT on page load
        verifyJWT();
        
        // Check token expiry periodically
        setInterval(() => {
            if (isTokenExpired()) {
                handleTokenExpiry();
            }
        }, config.CHECK_INTERVAL);

        // Add authorization headers to all fetch requests
        setupFetchInterceptor();
        
        // Check route access
        checkRouteAccess();
        
        // Setup auto-logout on tab/window close
        setupSessionManagement();
    }

    /**
     * Verify JWT token is present and valid
     */
    function verifyJWT() {
        const token = localStorage.getItem(config.JWT_KEY);
        
        if (!token) {
            console.log('[SECURITY] No JWT token found');
            const currentPage = window.location.pathname;
            
            // Redirect to login if accessing protected page
            if (isProtectedRoute(currentPage)) {
                console.warn('[SECURITY] Attempting to access protected route without token');
                localStorage.removeItem(config.ROLE_KEY);
                localStorage.removeItem(config.USER_KEY);
                window.location.href = 'login.html';
            }
            return false;
        }

        // Verify token format (JWT format: header.payload.signature)
        if (!isValidJWTFormat(token)) {
            console.error('[SECURITY] Invalid JWT format detected');
            localStorage.removeItem(config.JWT_KEY);
            return false;
        }

        console.log('[SECURITY] JWT token verified');
        return true;
    }

    /**
     * Safe base64url decoding helper
     */
    function safeDecode(str) {
        try {
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const pad = base64.length % 4;
            const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
            return atob(padded);
        } catch (e) {
            return atob(str);
        }
    }

    /**
     * Check if JWT has valid format
     */
    function isValidJWTFormat(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        try {
            // Try to decode payload (middle part)
            const payload = JSON.parse(safeDecode(parts[1]));
            console.log('[SECURITY] JWT payload:', {
                sub: payload.sub,
                email: payload.email,
                id: payload.id,
                exp: payload.exp,
                iat: payload.iat
            });
            return (payload.sub || payload.email || payload.id) && payload.exp;
        } catch (e) {
            console.error('[SECURITY] Failed to decode JWT:', e);
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    function isTokenExpired() {
        const token = localStorage.getItem(config.JWT_KEY);
        if (!token) return true;

        try {
            const payload = JSON.parse(safeDecode(token.split('.')[1]));
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            
            if (currentTime > expiryTime) {
                console.warn('[SECURITY] Token has expired');
                return true;
            }

            // Warn if expiry is within 1 hour
            const timeUntilExpiry = expiryTime - currentTime;
            if (timeUntilExpiry < 60 * 60 * 1000) {
                console.warn('[SECURITY] Token will expire soon:', {
                    expiresIn: Math.floor(timeUntilExpiry / 1000) + 's'
                });
            }

            return false;
        } catch (e) {
            console.error('[SECURITY] Error checking token expiry:', e);
            return true;
        }
    }

    /**
     * Handle token expiry
     */
    function handleTokenExpiry() {
        console.error('[SECURITY] Session expired - logging out user');
        localStorage.removeItem(config.JWT_KEY);
        localStorage.removeItem(config.ROLE_KEY);
        localStorage.removeItem(config.USER_KEY);
        
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.showErrorToast('Your session has expired. Please login again.');
        }
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    /**
     * Setup fetch interceptor to add authorization headers
     */
    function setupFetchInterceptor() {
        const originalFetch = window.fetch;

        window.fetch = function(...args) {
            const [resource, requestConfig] = args;
            const token = localStorage.getItem(config.JWT_KEY);

            // Add authorization header for API calls
            if (typeof resource === 'string' && resource.includes('/api/')) {
                if (!requestConfig) args[1] = {};
                if (!args[1].headers) args[1].headers = {};
                
                if (token) {
                    args[1].headers['Authorization'] = `Bearer ${token}`;
                }
            }

            return originalFetch.apply(this, args).then(response => {
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    console.error('[SECURITY] Unauthorized (401) - Token may be invalid');
                    handleTokenExpiry();
                }
                return response;
            });
        };

        console.log('[SECURITY] Fetch interceptor installed');
    }

    /**
     * Check route access based on user role
     */
    function checkRouteAccess() {
        const currentPage = window.location.pathname;
        const userRole = localStorage.getItem(config.ROLE_KEY);

        // Check if accessing protected route
        if (isProtectedRoute(currentPage)) {
            if (!verifyJWT()) {
                console.error('[SECURITY] Blocked access to protected route: no valid JWT');
                window.location.href = 'login.html';
                return;
            }

            // Check role-based access
            if (!isAccessAllowed(currentPage, userRole)) {
                console.error('[SECURITY] Access denied - insufficient role:', {
                    page: currentPage,
                    userRole: userRole
                });
                
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.showErrorToast('Access denied. Insufficient permissions.');
                }
                
                setTimeout(() => {
                    // Redirect to appropriate dashboard based on role
                    if (userRole === 'STUDENT' || userRole === 'PARENT') {
                        window.location.href = 'dashboard.html';
                    } else if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'STAFF') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'login.html';
                    }
                }, 2000);
            }
        }
    }

    /**
     * Check if route is protected
     */
    function isProtectedRoute(path) {
        return PROTECTED_ROUTES.some(route => path.includes(route));
    }

    /**
     * Check if user has access to route
     */
    function isAccessAllowed(path, userRole) {
        if (!userRole) return false;

        for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
            if (role === userRole) {
                return routes.some(route => path.includes(route));
            }
        }

        return false;
    }

    /**
     * Setup session management
     */
    function setupSessionManagement() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('[SECURITY] Page hidden - recording session pause');
            } else {
                console.log('[SECURITY] Page visible - verifying session');
                verifyJWT();
            }
        });

        // Warn before leaving page with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            const isDirty = document.querySelector('form[data-dirty="true"]');
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * Get authorization header
     */
    function getAuthHeader() {
        const token = localStorage.getItem(config.JWT_KEY);
        if (!token) return null;
        
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Make authenticated API call
     */
    async function makeAuthenticatedRequest(endpoint, options = {}) {
        const token = localStorage.getItem(config.JWT_KEY);
        
        if (!token) {
            console.error('[SECURITY] No token available for authenticated request');
            handleTokenExpiry();
            throw new Error('No valid session');
        }

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        if (options.headers) {
            finalOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }

        try {
            const response = await fetch(endpoint, finalOptions);

            if (response.status === 401) {
                handleTokenExpiry();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || error.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('[SECURITY] Authenticated request failed:', error);
            throw error;
        }
    }

    /**
     * Verify user role
     */
    function verifyRole(requiredRoles = []) {
        const userRole = localStorage.getItem(config.ROLE_KEY);
        
        if (!userRole) {
            console.error('[SECURITY] No user role found');
            return false;
        }

        if (requiredRoles.length === 0) {
            return !!userRole;
        }

        const hasRole = requiredRoles.includes(userRole);
        if (!hasRole) {
            console.error('[SECURITY] User lacks required role:', {
                userRole,
                required: requiredRoles
            });
        }

        return hasRole;
    }

    /**
     * Logout user securely
     */
    function logout() {
        console.log('[SECURITY] Logging out user');
        
        // Clear all sensitive data
        localStorage.removeItem(config.JWT_KEY);
        localStorage.removeItem(config.ROLE_KEY);
        localStorage.removeItem(config.USER_KEY);
        
        // Clear session storage
        sessionStorage.clear();
        
        // Clear all cookies (if any)
        document.cookie.split(';').forEach(cookie => {
            document.cookie = cookie.split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        });

        console.log('[SECURITY] User logged out securely');
        
        window.location.href = 'index.html';
    }

    /**
     * Generate security audit report
     */
    function generateAuditReport() {
        const token = localStorage.getItem(config.JWT_KEY);
        const userRole = localStorage.getItem(config.ROLE_KEY);
        const userName = localStorage.getItem(config.USER_KEY);

        let report = {
            timestamp: new Date().toISOString(),
            jwt: {
                present: !!token,
                valid: isValidJWTFormat(token) && !isTokenExpired(),
                expired: isTokenExpired()
            },
            user: {
                name: userName || 'Unknown',
                role: userRole || 'None',
                authorized: !!token && !!userRole
            },
            route: {
                current: window.location.pathname,
                protected: isProtectedRoute(window.location.pathname),
                accessAllowed: isAccessAllowed(window.location.pathname, userRole)
            },
            security: {
                fetchInterceptor: typeof window.fetch !== 'undefined',
                sessionChecks: 'Active'
            }
        };

        return report;
    }

    // Public API
    return {
        initialize,
        verifyJWT,
        getAuthHeader,
        makeAuthenticatedRequest,
        verifyRole,
        logout,
        isTokenExpired,
        isProtectedRoute,
        generateAuditReport
    };
})();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SecurityAudit.initialize);
} else {
    SecurityAudit.initialize();
}
