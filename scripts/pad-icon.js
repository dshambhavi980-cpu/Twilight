const sharp = require('sharp');
sharp('public/twilight.png')
  .resize(1024, 1024, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toFile('public/icon_square.png')
  .then(() => console.log('Image padded to square successfully'))
  .catch(err => console.error(err));
