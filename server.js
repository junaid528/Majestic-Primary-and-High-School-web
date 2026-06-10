const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

dotenv.config();

// Initialize express app
const app = express();
app.set('trust proxy', 1); // Trust the first proxy (reverse proxy/load balancer)
const PORT = process.env.PORT || 3000;

// 🛡️ SECURITY MIDDLEWARE
// Helmet secures headers, with settings relaxed for sandboxed iframe previews
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS protection
app.use(cors());

// Rate Limiting to prevent brute-force attacks on APIs
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per 15 mins for heavy dashboard usage
    message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', apiLimiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express session setup with secret key
app.use(session({
    secret: process.env.SESSION_SECRET || 'majestic_session_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true in extreme production-only HTTPS environments
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Initialize database
const db = require('./backend/config/db');
db.initializeDatabase();

// Pre-generate Fee Structure PDF to disk (ensures reliability)
const pregenerateFeeStructurePDF = async () => {
    try {
        let srcPath = path.join(__dirname, 'Fee Structure.pdf');
        if (!fs.existsSync(srcPath)) {
            srcPath = path.join(__dirname, 'assets', 'Fee Structure.pdf');
        }
        const destPath = path.join(__dirname, 'assets', 'fee-structure-2026.pdf');
        
        // Ensure assets directory exists
        const dirPath = path.dirname(destPath);
        if (!fs.existsSync(dirPath)){
            fs.mkdirSync(dirPath, { recursive: true });
        }

        if (fs.existsSync(srcPath)) {
            const stats = fs.statSync(srcPath);
            if (stats.isFile() && stats.size > 1024) {
                console.log(`Copying high-quality fee structure PDF form file...`);
                fs.copyFileSync(srcPath, destPath);
                return;
            }
        }

        console.log('Pre-generating premium fee structure PDF on disk...');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 850]);
        const { width, height } = page.getSize();
        
        const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const primaryColor = rgb(15 / 255, 31 / 255, 63 / 255);
        const accentColor = rgb(250 / 255, 204 / 255, 21 / 255);
        const darkColor = rgb(15 / 255, 23 / 255, 42 / 255);
        const lightGray = rgb(248 / 255, 250 / 255, 252 / 255);
        const borderGray = rgb(226 / 255, 232 / 255, 240 / 255);
        const textMuted = rgb(100 / 255, 116 / 255, 139 / 255);

        page.drawRectangle({
            x: 0,
            y: height - 130,
            width: width,
            height: 130,
            color: primaryColor,
        });

        page.drawRectangle({
            x: 0,
            y: height - 135,
            width: width,
            height: 5,
            color: accentColor,
        });

        page.drawText('MAJESTIC PRIMARY & HIGH SCHOOL', {
            x: 40,
            y: height - 55,
            size: 16,
            font: fontBold,
            color: accentColor,
        });

        page.drawText('Official Academic Fee Structure & Installments Plan', {
            x: 40,
            y: height - 75,
            size: 11,
            font: fontSans,
            color: rgb(255 / 255, 255 / 255, 255 / 255),
        });

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(destPath, Buffer.from(pdfBytes));
        console.log('Fee structure PDF components successfully compiled!');
    } catch (err) {
        console.error('Failed to pre-generate fee structure PDF:', err);
    }
};

// Start PDF Generation on boot
pregenerateFeeStructurePDF();

// Serve assets of Fee structure
app.get('/assets/fee-structure-2026.pdf', (req, res) => {
    const filePath = path.join(__dirname, 'assets', 'fee-structure-2026.pdf');
    if (fs.existsSync(filePath)) {
        if (req.query.download === 'true') {
            return res.download(filePath, 'Majestic-Fee-Structure-2026.pdf');
        }
        res.setHeader('Content-Type', 'application/pdf');
        return res.sendFile(filePath);
    } else {
        return res.status(404).send('Fee structure PDF is currently compiling. Please reload in a moment.');
    }
});

// Serve Client Uploaded attachments static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔌 MOUNT CENTRAL REST API ROUTER
const apiRouter = require('./backend/routes/api');
app.use('/api', apiRouter);

// Serve static UI assets from root
app.use(express.static(path.join(__dirname, ''), {
    extensions: ['html', 'htm'],
    index: 'index.html'
}));

// Route handler for friendly names (e.g., /dashboard, /about)
app.get('/:page', (req, res, next) => {
    const page = req.params.page;

    if (page.startsWith('api') || page.includes('.') || ['assets', 'css', 'js', 'node_modules', 'uploads', 'backend'].includes(page)) {
        return next();
    }

    const filePath = path.join(__dirname, `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            next();
        }
    });
});

// START EXPRESS WEB CONTAINER ORCHESTRATION
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 MAJESTIC backend active at http://0.0.0.0:${PORT}`);
    console.log(`=======================================================`);
});
