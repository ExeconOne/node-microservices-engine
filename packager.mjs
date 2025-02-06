import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Read package.json to get the version
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;
let name = packageJson.name;

// Remove the "@archimedes/" prefix if it exists
if (name.startsWith('@archimedes/')) {
    name = name.replace('@archimedes/', '');
}

// Define the output ZIP file name
const outputZipName = `${name}_v${version}.zip`;

// Create a file to stream archive data to.
const output = fs.createWriteStream(path.join(distDir, outputZipName));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`Zipped ${archive.pointer()} total bytes.`);
    console.log(`Created ${path.join(distDir, outputZipName)}`);
});

// Handle errors
archive.on('error', (err) => {
    throw err;
});

// Specify the files and directories to include
const filesAndDirsToZip = [
    'engine',
    'loader',
    'index.mjs',
    'package.json', 
];

// Start the zipping process
archive.pipe(output);

filesAndDirsToZip.forEach((item) => {
    const itemPath = path.resolve(__dirname, item);
    if (fs.lstatSync(itemPath).isDirectory()) {
        archive.directory(itemPath, path.basename(item)); // Preserve folder structure
    } else {
        archive.file(itemPath, { name: path.basename(item) });
    }
});

archive.finalize();
