import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageUrls = [
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fpickup_image_1771568072476.jpg?alt=media&token=6f76a196-05e6-490e-b634-0e60327c4ede',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fpickup_image_1771569007141.jpg?alt=media&token=800b7470-29f3-439d-b9cf-bba653387fe5',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fautobacs_image_1771569230956.jpg?alt=media&token=545bea34-7cd3-4e9d-98d9-8ad0fdb164b6',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fcruise_image_1771569282452.jpg?alt=media&token=353c33c4-d7aa-4c6c-94db-fc1ab21d5e74',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fdaikoku_pa_image_1771569189751.jpg?alt=media&token=e71583f2-5cb0-4a31-acdf-039fb8c2039d',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Frainbow_bridge_image_1771573051434.jpg?alt=media&token=9be38c52-83c9-4b55-aea9-48b3db1fbb54',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Ftokyo_tower_image_1771574138755.jpg?alt=media&token=26daa47d-c2e3-4d29-b7bf-34ec9d3d45d0',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fshibuya_image_1771574165419.jpg?alt=media&token=f9dca861-2d01-440a-972d-5d5456cb3c77',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fdrop_off_image_1771573452201.jpg?alt=media&token=f3633360-d469-451c-ac9e-c72e133e7ad9',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fumihotaru_hero_1771615259815.jpg?alt=media&token=d0b1401a-e1b2-4431-b529-97116cd8e668',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Fumihotaru_rx7_1771615259815.jpg?alt=media&token=eb5d485e-4631-4441-8cb6-f038df6e9c0e',
    'https://firebasestorage.googleapis.com/v0/b/daikoku-tour-booking.firebasestorage.app/o/site_assets%2Ftokyo_tower_supra_1771615259815.jpg?alt=media&token=91610b93-55e9-45b8-8c56-dbeda51cf104'
];

// Target directory in the public folder
const outputDir = path.join(__dirname, '../public/compressed_assets');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function downloadAndCompress() {
    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];

        // Extract filename logic considering the token parameter might be there
        let filenameMatch = url.match(/%2F([a-zA-Z0-9_]+\.jpg)/);
        let filename = filenameMatch ? filenameMatch[1] : `image_${i}.jpg`;

        const outputPath = path.join(outputDir, filename.replace('.jpg', '.webp'));

        console.log(`Downloading: ${filename}`);

        try {
            const response = await axios({
                url,
                responseType: 'arraybuffer'
            });

            const buffer = Buffer.from(response.data, 'binary');

            console.log(`Compressing ${filename} to WebP format...`);

            // Compress and convert to webp (best for web)
            await sharp(buffer)
                .resize({ width: 1200, withoutEnlargement: true }) // Reasonable max width for hero/sliders
                .webp({ quality: 80 }) // 80 quality is a good balance for webp
                .toFile(outputPath);

            console.log(`Successfully saved compressed image: ${outputPath}`);

        } catch (err) {
            console.error(`Error processing ${url}:`, err.message);
        }
    }
}

downloadAndCompress().then(() => console.log('All images processed!'));
