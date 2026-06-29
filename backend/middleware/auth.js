const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'majestic_super_secret_jwt_key_2026';

// Middleware to authorize any logged-in user with a valid session OR JWT token
const verifyToken = (req, res, next) => {
    // 1. High-priority JWT evaluation block: prioritize token if client sends it explicitly
    let authHeader = req.headers['authorization'];
    let token = authHeader;
    console.log(`[BACKEND_AUTH_DEBUG] Request URL: ${req.originalUrl || req.url}, Authorization Header:`, authHeader);
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    } else {
        token = req.headers['x-access-token'] || req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('[BACKEND_AUTH_DEBUG] JWT verified successfully. User:', decoded);
            req.user = decoded;
            return next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                console.warn('[BACKEND_AUTH_DEBUG] JWT expired:', err.message);
            } else {
                console.warn('[BACKEND_AUTH_DEBUG] JWT verification failed. Error:', err.name || 'Error', err.message, 'Token (truncated):', token.substring(0, 30));
            }
            return res.status(401).json({ error: 'Session expired or invalid security token.' });
        }
    }

    console.warn('[BACKEND_AUTH_DEBUG] Access denied. No token found in headers, x-access-token, or query.');
    return res.status(401).json({ error: 'Access denied. Please login to continue.' });
};

// Check if user has specific roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.warn('[BACKEND_AUTH_DEBUG] No req.user found in authorizeRoles middleware.');
            return res.status(401).json({ error: 'Authentication required.' });
        }
        
        // Normalize role names to support both space / admin structures
        const userRole = req.user.role || '';
        const mappedRoles = roles.map(r => r.toLowerCase().replace(/\s+/g, ''));
        const normalizedUserRole = userRole.toLowerCase().replace(/\s+/g, '');

        // Support exact match, mapped aliases, or 'admin' umbrella terms
        const isAdminUser = ['superadmin', 'staff', 'admin'].includes(normalizedUserRole);
        const requiresAdmin = mappedRoles.some(r => ['superadmin', 'staff', 'admin'].includes(r));

        const hasAccess = mappedRoles.includes(normalizedUserRole) || 
                          (isAdminUser && requiresAdmin) ||
                          (mappedRoles.includes('admin') && isAdminUser);

        console.log(`[BACKEND_AUTH_DEBUG] URL: ${req.originalUrl || req.url} | User role: '${userRole}' (normalized: '${normalizedUserRole}') | Required mapped: [${mappedRoles.join(', ')}] | hasAccess: ${hasAccess}`);

        if (!hasAccess) {
            console.warn(`[BACKEND_AUTH_DEBUG] Forbidden: ${userRole} is not authorized for this route.`);
            return res.status(403).json({ error: `Access denied. Role '${userRole}' is unauthorized.` });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    authorizeRoles,
    JWT_SECRET
};
