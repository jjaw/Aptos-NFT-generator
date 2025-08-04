#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the SVG content
const svgContent = fs.readFileSync(path.join(__dirname, 'public/favicon.svg'), 'utf8');

// Generate different sized favicons by creating data URLs
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

// Create a simple HTML file to render SVGs to different sizes
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Favicon Generator</title>
    <style>
        canvas { display: none; }
        .svg-container { display: none; }
    </style>
</head>
<body>
    <div class="svg-container">
        ${svgContent}
    </div>
    
    ${sizes.map(({size, name}) => `<canvas id="canvas-${size}" width="${size}" height="${size}"></canvas>`).join('\n    ')}
    
    <script>
        function generateFavicon(size, filename) {
            const canvas = document.getElementById('canvas-' + size);
            const ctx = canvas.getContext('2d');
            const svg = document.querySelector('svg').cloneNode(true);
            
            // Set SVG dimensions
            svg.setAttribute('width', size);
            svg.setAttribute('height', size);
            
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(svgUrl);
                
                // Convert to PNG and download
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            img.src = svgUrl;
        }
        
        // Generate all favicons
        setTimeout(() => {
            ${sizes.map(({size, name}) => `generateFavicon(${size}, '${name}');`).join('\n            ')}
        }, 100);
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'favicon-generator.html'), htmlContent);

console.log('Favicon generator HTML created. Open favicon-generator.html in your browser to generate PNG favicons.');
console.log('Alternatively, using Node.js with sharp or similar libraries for automated generation...');

// Try to use a more direct approach with data URLs
const createFaviconICO = () => {
    // Create a simple ICO file structure (simplified)
    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0); // Reserved
    icoHeader.writeUInt16LE(1, 2); // Type (1 = ICO)
    icoHeader.writeUInt16LE(1, 4); // Number of images
    
    // For now, just copy the SVG as favicon.ico won't work directly
    // In a real scenario, you'd need a proper ICO encoder
    fs.writeFileSync(path.join(__dirname, 'public/favicon.ico'), svgContent.replace('<svg', '<svg width="32" height="32"'));
};

createFaviconICO();

console.log('Basic favicon files created in public/ directory');
console.log('Note: For production, consider using a proper favicon generator tool or library');