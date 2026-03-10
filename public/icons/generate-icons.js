#!/usr/bin/env node

/**
 * Icon generation script for Aurum PWA
 * Generates PNG icons from SVG using sharp (if available) or fallback to placeholder PNGs
 *
 * Usage: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const ICON_DIR = __dirname;
const SVG_FILE = path.join(ICON_DIR, 'icon.svg');

console.log('Aurum PWA Icon Generator');
console.log('========================\n');

// Try to use sharp if available
try {
  const sharp = require('sharp');

  const sizes = [192, 512];

  sizes.forEach((size) => {
    const outputFile = path.join(ICON_DIR, `icon-${size}.png`);

    sharp(SVG_FILE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 5, g: 8, b: 16, alpha: 1 }
      })
      .png()
      .toFile(outputFile)
      .then(() => {
        console.log(`✓ Generated: icon-${size}.png`);
      })
      .catch((err) => {
        console.error(`✗ Failed to generate icon-${size}.png:`, err.message);
      });
  });

} catch (err) {
  console.log('Note: sharp not installed. Using placeholder PNG icons.\n');
  console.log('To generate high-quality icons, install sharp:\n');
  console.log('  npm install --save-dev sharp\n');
  console.log('Then run: node generate-icons.js\n');

  // Generate minimal valid PNG placeholders
  // 1x1 transparent PNG base64
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  [192, 512].forEach((size) => {
    const outputFile = path.join(ICON_DIR, `icon-${size}.png`);
    try {
      fs.writeFileSync(outputFile, minimalPng);
      console.log(`✓ Created placeholder: icon-${size}.png (run 'npm install --save-dev sharp' for proper icons)`);
    } catch (err) {
      console.error(`✗ Failed to create icon-${size}.png:`, err.message);
    }
  });
}

console.log('\n✓ Icon generation complete!');
