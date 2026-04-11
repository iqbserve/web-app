import fs from 'node:fs';
import path from 'node:path';

const srcDir = 'src';
const destDir = 'dist';

const copyRecursiveSync = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        // Only copy non-MTS/TS files that are not in the app directory (tsc handles the app directory)
        // Actually, we can copy everything except .ts files. tsc will overwrite the .js files from app/ if it compiles them.
        // To be safe, let's skip the 'app' directory entirely since tsc handles it.
        const normalizedSrc = src.replace(/\\/g, '/');
        if (!normalizedSrc.startsWith('src/app/') && !(normalizedSrc.endsWith('.mts') || normalizedSrc.endsWith('.ts'))) {
            fs.copyFileSync(src, dest);
        }
    }
};

copyRecursiveSync(srcDir, destDir);
console.log('Static assets copied successfully.');
