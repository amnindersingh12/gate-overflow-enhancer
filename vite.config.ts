import { defineConfig } from 'vite';
import { resolve } from 'path';

const entry = process.env.BUILD_ENTRY || 'all';

// Chrome MV3 content scripts cannot use ES modules (import/export).
// We build each entry separately: content as IIFE, service-worker as ESM, popup as its own.
function getConfig() {
    if (entry === 'content') {
        return defineConfig({
            build: {
                outDir: 'dist',
                emptyOutDir: false,
                lib: {
                    entry: resolve(__dirname, 'src/content/index.ts'),
                    name: 'GOEnhancer',
                    formats: ['iife'],
                    fileName: () => 'content.js',
                },
                target: 'chrome120',
                minify: false,
                sourcemap: false,
            },
        });
    }

    if (entry === 'service-worker') {
        return defineConfig({
            build: {
                outDir: 'dist',
                emptyOutDir: false,
                rollupOptions: {
                    input: resolve(__dirname, 'src/background/service-worker.ts'),
                    output: {
                        entryFileNames: 'service-worker.js',
                        format: 'es',
                    },
                },
                target: 'chrome120',
                minify: false,
                sourcemap: false,
            },
        });
    }

    if (entry === 'popup') {
        return defineConfig({
            build: {
                outDir: 'dist',
                emptyOutDir: false,
                rollupOptions: {
                    input: resolve(__dirname, 'src/popup/popup.html'),
                    output: {
                        entryFileNames: 'popup.js',
                        assetFileNames: '[name].[ext]',
                        format: 'es',
                    },
                },
                target: 'chrome120',
                minify: false,
                sourcemap: false,
            },
        });
    }

    // Default: build all sequentially (handled by npm script)
    return defineConfig({});
}

export default getConfig();
