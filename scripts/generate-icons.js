const sharp = require('sharp');
const toIco = require('to-ico');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'src-tauri', 'icons');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Generate PNGs at required sizes
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, name));
    console.log(`Created ${name} (${size}x${size})`);
  }

  // Generate .ico (multi-resolution Windows icon)
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const pngFrames = await Promise.all(
    icoSizes.map((size) =>
      sharp(svgBuffer).resize(size, size).png().toBuffer()
    )
  );
  const icoBuffer = await toIco(pngFrames);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon.ico'), icoBuffer);
  console.log('Created icon.ico (multi-res: 16,24,32,48,64,128,256)');

  console.log('\nAll icons generated!');
  console.log('Note: icon.icns must be generated on macOS. The existing .icns is preserved.');
}

generateIcons().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
