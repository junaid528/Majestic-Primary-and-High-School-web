const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
require('dotenv').config();

const db = require('./backend/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database on Startup
db.initializeDatabase()
    .then(() => {
        console.log('✓ Database initialized successfully (PostgreSQL or JSON Local Fallback).');
    })
    .catch(err => {
        console.error('✗ Database initialization failed:', err);
    });

// Security & Request Parsing Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

// Use helmet with relaxed settings to prevent blocking inline scripts/styles in development & previews
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'majestic_primary_high_school_session_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true if running on HTTPS in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Log Incoming Requests for Audit and Debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Mount Centralized Backend REST API Routes
app.use('/api', require('./backend/routes/api.js'));

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Static Frontend Assets with HTML extension-resolving fallback
app.use(express.static(__dirname, {
    extensions: ['html'],
    index: 'index.html'
}));

// Catch-all to serve index.html for undefined frontend routes (Single Page Router Support if needed)
app.get('*', (req, res, next) => {
    // Avoid capturing API requests
    if (req.path.startsWith('/api')) {
        return next();
    }
    const indexFile = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
    } else {
        res.status(404).send('Page not found');
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Server Error]:', err.stack || err.message || err);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'An unexpected internal server error occurred.'
    });
});

// Bind and Listen to Port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================================`);
    console.log(`  🚀 Majestic Primary & High School Portal Server is running`);
    console.log(`  🌐 URL: http://localhost:${PORT}`);
    console.log(`  📂 Root Directory: ${__dirname}`);
    console.log(`  ⏰ Local Time: ${new Date().toISOString()}`);
    console.log(`=============================================================`);
});
