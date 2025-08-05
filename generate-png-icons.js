#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple PNG creation using Canvas API in Node.js
// Since we don't have canvas installed, we'll create a data URL approach

function createSimplePNG(size) {
    // Create a minimal PNG data URL that browsers can handle
    // This creates a simple colored square as a fallback
    const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ff6b9d"/>
      <stop offset="50%" style="stop-color:#c471ed"/>
      <stop offset="100%" style="stop-color:#12c2e9"/>
    </radialGradient>
    <radialGradient id="diamond" cx="50%" cy="50%" r="30%">
      <stop offset="0%" style="stop-color:#ffd700"/>
      <stop offset="100%" style="stop-color:#ff6b9d"/>
    </radialGradient>
  </defs>
  
  <circle cx="${size/2}" cy="${size/2}" r="${size/2-3}" fill="url(#bg)" stroke="#000" stroke-width="3"/>
  
  <polygon points="${size/2},${size*0.25} ${size*0.75},${size/2} ${size/2},${size*0.75} ${size*0.25},${size/2}" 
           fill="url(#diamond)" stroke="#000" stroke-width="2"/>
  
  <polygon points="${size/2},${size*0.35} ${size*0.65},${size/2} ${size/2},${size*0.65} ${size*0.35},${size/2}" 
           fill="rgba(255,255,255,0.8)"/>
  
  <circle cx="${size*0.42}" cy="${size*0.42}" r="${size*0.06}" fill="rgba(255,255,255,0.6)"/>
</svg>`;
    
    return canvas;
}

// Generate the SVG icons
const icon192 = createSimplePNG(192);
const icon180 = createSimplePNG(180);

// Write the files
fs.writeFileSync(path.join(__dirname, 'public', 'icon-192.svg'), icon192);
fs.writeFileSync(path.join(__dirname, 'public', 'apple-touch-icon.svg'), icon180);

// Create proper data URLs for PNG fallback
const png192DataUrl = `data:image/svg+xml;base64,${Buffer.from(icon192).toString('base64')}`;
const png180DataUrl = `data:image/svg+xml;base64,${Buffer.from(icon180).toString('base64')}`;

console.log('Generated SVG icons for PNG fallback:');
console.log('- public/icon-192.svg');
console.log('- public/apple-touch-icon.svg');
console.log('\nTo use as data URLs in manifest:');
console.log('192x192:', png192DataUrl.substring(0, 100) + '...');
console.log('180x180:', png180DataUrl.substring(0, 100) + '...');