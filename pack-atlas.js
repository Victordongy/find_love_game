// pack-atlas.js - Remove empty space from sprites using texture packing
const fs = require('fs');
const path = require('path');
const { packAsync } = require('free-tex-packer-core');

(async () => {
  console.log('Packing sprites to remove empty space...');

  // Create build directory if it doesn't exist
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }

  // Pack girl sprite with animation frames
  console.log('Processing girl animation spritesheet...');
  const girlImages = [{
    path: 'girl_animate_sheet.png',
    contents: fs.readFileSync('assets/images/girl_animate_sheet.png')
  }];

  const girlFiles = await packAsync(girlImages, {
    textureName: 'girl',
    exporter: 'Phaser3',   // Phaser 3 JSON format
    allowTrim: true,       // REMOVE TRANSPARENT BORDERS (this is the key!)
    trimMode: 'trim',      // keep original source size in metadata
    padding: 2,            // small padding between sprites
    extrude: 1,            // helps prevent texture bleeding
    width: 2048,           // larger texture size for animation sheet
    height: 2048,
    fixedSize: false       // allow smaller textures
  });

  for (const f of girlFiles) {
    const outputPath = path.join('build', f.name);
    fs.writeFileSync(outputPath, f.buffer);
    console.log(`Created: ${outputPath}`);
  }

  // Pack boy sprite
  console.log('Processing boy.png...');
  const boyImages = [{
    path: 'boy.png',
    contents: fs.readFileSync('assets/images/boy.png')
  }];

  const boyFiles = await packAsync(boyImages, {
    textureName: 'boy',
    exporter: 'Phaser3',
    allowTrim: true,       // REMOVE TRANSPARENT BORDERS
    trimMode: 'trim',
    padding: 2,
    extrude: 1,
    width: 2048,           // increased to handle large sprite
    height: 2048,
    fixedSize: false
  });

  for (const f of boyFiles) {
    const outputPath = path.join('build', f.name);
    fs.writeFileSync(outputPath, f.buffer);
    console.log(`Created: ${outputPath}`);
  }

  console.log('✅ Sprite packing complete! Empty space removed.');
  console.log('Generated files in build/ directory:');
  console.log('- girl.png (trimmed animation atlas)');
  console.log('- girl.json (metadata with frame data)');
  console.log('- boy.png (trimmed)');
  console.log('- boy.json (metadata)');
})().catch(console.error);