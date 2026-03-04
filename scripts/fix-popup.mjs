/**
 * Post-build script to fix popup.html location and paths.
 * Vite places it at dist/src/popup/popup.html — we move it to dist/popup.html
 * and fix asset paths to be relative.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const src = resolve(root, 'dist/src/popup/popup.html');
const dest = resolve(root, 'dist/popup.html');

if (existsSync(src)) {
    let html = readFileSync(src, 'utf-8');
    // Fix paths: ../../popup.js → ./popup.js, ../../popup.css → ./popup.css
    html = html.replace(/\.\.\/\.\.\//g, './');
    // Also fix absolute /popup.js → ./popup.js
    html = html.replace(/src="\/popup\./g, 'src="./popup.');
    html = html.replace(/href="\/popup\./g, 'href="./popup.');
    writeFileSync(dest, html);
    // Clean up
    unlinkSync(src);
    try { rmdirSync(resolve(root, 'dist/src/popup')); } catch { }
    try { rmdirSync(resolve(root, 'dist/src')); } catch { }
    console.log('✅ popup.html moved to dist/popup.html');
} else if (existsSync(dest)) {
    // Already at root, just fix paths
    let html = readFileSync(dest, 'utf-8');
    html = html.replace(/src="\/popup\./g, 'src="./popup.');
    html = html.replace(/href="\/popup\./g, 'href="./popup.');
    writeFileSync(dest, html);
    console.log('✅ Fixed paths in dist/popup.html');
} else {
    console.warn('⚠️ popup.html not found');
}
