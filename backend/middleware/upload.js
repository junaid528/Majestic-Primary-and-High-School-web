const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure root and subfolders exist
const rootUploads = path.join(__dirname, '..', '..', 'uploads');
const folders = ['photos', 'aadhaar', 'tc', 'marks'];

folders.forEach(folder => {
    const dir = path.join(rootUploads, folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure custom storage resolver based on file input name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'photos'; // Fallback
        if (file.fieldname === 'student_photo') folder = 'photos';
        else if (file.fieldname === 'aadhaar_card') folder = 'aadhaar';
        else if (file.fieldname === 'transfer_certificate') folder = 'tc';
        else if (file.fieldname === 'marks_card') folder = 'marks';
        
        cb(null, path.join(rootUploads, folder));
    },
    filename: (req, file, cb) => {
        // Safe filename format: Timestamp-safe_original_name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizeName}`);
    }
});

// Enforce safe file formats (Image and PDF files only)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF documents are allowed.'), false);
    }
};

// Define complete upload instance with 5MB size limit
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB Limit
    }
});

// Combined Fields configuration for the Admission form uploads
const admissionsUpload = upload.fields([
    { name: 'student_photo', maxCount: 1 },
    { name: 'aadhaar_card', maxCount: 1 },
    { name: 'transfer_certificate', maxCount: 1 },
    { name: 'marks_card', maxCount: 1 }
]);

module.exports = {
    upload,
    admissionsUpload
};
