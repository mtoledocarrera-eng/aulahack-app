/**
 * Generate minimal PWA icons for 360Hacks
 * Creates icon-192.png and icon-512.png in /public
 * 
 * Uses an embedded base64-encoded SVG → PNG conversion via sharp or
 * falls back to creating an HTML file to manually convert.
 */

const fs = require('fs');
const path = require('path');

// SVG icon template
function createSVG(size) {
    const fontSize360 = Math.floor(size * 0.28);
    const fontSizeHacks = Math.floor(size * 0.14);
    const radius = Math.floor(size * 0.2);
    const arcRadius = Math.floor(size * 0.22);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <circle cx="${size / 2}" cy="${size * 0.38}" r="${arcRadius}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="${Math.floor(size * 0.02)}" stroke-dasharray="${Math.floor(arcRadius * 2 * Math.PI * 0.9)} ${Math.floor(arcRadius * 2 * Math.PI * 0.1)}"/>
  <text x="${size / 2}" y="${size * 0.42}" text-anchor="middle" fill="white" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${fontSize360}">360</text>
  <text x="${size / 2}" y="${size * 0.66}" text-anchor="middle" fill="white" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${fontSizeHacks}">HACKS</text>
</svg>`;
}

const publicDir = path.join(__dirname, '..', 'public');

// Save as SVG first (works as PWA icon in most browsers)
// Then try to convert to PNG if sharp is available

const sizes = [192, 512];

for (const size of sizes) {
    const svg = createSVG(size);
    const svgPath = path.join(publicDir, `icon-${size}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`✅ Created icon-${size}.svg`);
}

// Also create a helper HTML to convert to PNG manually if needed
const helperHTML = `<!DOCTYPE html>
<html><head><title>Icon Converter</title></head>
<body style="background:#1a1a2e;color:white;font-family:Arial;padding:2rem;">
<h1>360Hacks Icon Generator</h1>
<p>Right-click each icon → "Save image as..." to save as PNG</p>
<div style="display:flex;gap:2rem;align-items:start;margin-top:2rem;">
${sizes.map(size => `
  <div>
    <h3>${size}×${size}</h3>
    <canvas id="c${size}" width="${size}" height="${size}"></canvas>
    <br><a id="dl${size}" style="color:#60a5fa;cursor:pointer;">⬇ Download PNG</a>
  </div>
`).join('')}
</div>
<script>
function draw(id, s) {
  var c = document.getElementById(id);
  var x = c.getContext('2d');
  var g = x.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, '#2563eb');
  g.addColorStop(1, '#1d4ed8');
  x.fillStyle = g;
  x.beginPath();
  x.roundRect(0, 0, s, s, s * 0.2);
  x.fill();
  x.fillStyle = 'white';
  x.font = 'bold ' + Math.floor(s * 0.28) + 'px Arial';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('360', s / 2, s * 0.38);
  x.font = 'bold ' + Math.floor(s * 0.14) + 'px Arial';
  x.fillText('HACKS', s / 2, s * 0.62);
  x.strokeStyle = 'rgba(255,255,255,0.3)';
  x.lineWidth = s * 0.02;
  x.beginPath();
  x.arc(s / 2, s * 0.38, s * 0.22, 0, Math.PI * 1.8);
  x.stroke();
}
draw('c512', 512);
draw('c192', 192);

document.getElementById('dl512').onclick = function() {
  var a = document.createElement('a');
  a.download = 'icon-512.png';
  a.href = document.getElementById('c512').toDataURL('image/png');
  a.click();
};
document.getElementById('dl192').onclick = function() {
  var a = document.createElement('a');
  a.download = 'icon-192.png';
  a.href = document.getElementById('c192').toDataURL('image/png');
  a.click();
};
</script>
</body></html>`;

fs.writeFileSync(path.join(publicDir, 'icon-generator.html'), helperHTML);
console.log('✅ Created icon-generator.html (open in browser to download PNGs)');

console.log('\\n📌 Next steps:');
console.log('1. Update manifest.json to use .svg icons (works in most browsers)');
console.log('2. OR open public/icon-generator.html in browser to download PNGs');
