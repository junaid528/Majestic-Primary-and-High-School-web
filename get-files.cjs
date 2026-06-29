const fs = require('fs');
const path = require('path');

const root = __dirname;
const results = [];

function getFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(root, fullPath);
        if (relativePath.startsWith('.git') || relativePath === 'get-files.cjs' || relativePath === 'node_modules' || relativePath === 'package-lock.json') {
            continue;
        }
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getFiles(fullPath);
        } else {
            const ext = path.extname(item).toLowerCase();
            let type = 'Unknown';
            if (ext === '.html') type = 'HTML File';
            else if (ext === '.css') type = 'CSS Stylesheet';
            else if (ext === '.js') type = 'JavaScript File';
            else if (ext === '.json') type = 'JSON Configuration/Data';
            else if (ext === '.py') type = 'Python File';
            else if (ext === '.md') type = 'Markdown Documentation';
            else if (ext === '.txt') type = 'Plain Text/Requirements';
            else if (ext === '.png') type = 'PNG Image';
            else if (ext === '.jpg' || ext === '.jpeg') type = 'JPEG Image';
            else if (ext === '.pdf') type = 'PDF Document';
            else if (ext === '.mp4') type = 'MP4 Video';
            else if (ext === '.example') type = 'Example Environment Config';
            else if (item.startsWith('.')) type = 'Hidden Configuration File';
            else type = 'Binary/Source File';

            results.push({
                name: item,
                path: relativePath,
                type: type,
                size: stat.size
            });
        }
    }
}

getFiles(root);
console.log(JSON.stringify(results, null, 2));
