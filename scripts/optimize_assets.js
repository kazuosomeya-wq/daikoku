import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('./src/assets');

async function processImages() {
    console.log("Optimizing images in src/assets...");
    const files = fs.readdirSync(assetsDir);

    for (const file of files) {
        if (file.match(/\.(jpg|jpeg|png)$/i) && !file.includes('-opt')) {
            const ext = path.extname(file);
            const basename = path.basename(file, ext);
            const inputPath = path.join(assetsDir, file);
            const outputPath = path.join(assetsDir, `${basename}.webp`);

            console.log(`Processing: ${file}`);

            try {
                // Resize if too large, convert to webp with good compression
                await sharp(inputPath)
                    .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
                    .webp({ quality: 80, effort: 6 })
                    .toFile(outputPath);

                console.log(`✅ Saved as ${basename}.webp`);

                // Compare sizes
                const oldSize = fs.statSync(inputPath).size / 1024;
                const newSize = fs.statSync(outputPath).size / 1024;
                console.log(`   Size: ${oldSize.toFixed(1)}KB -> ${newSize.toFixed(1)}KB`);

            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error);
            }
        }
    }
    console.log("Done optimization!");
}

processImages();
