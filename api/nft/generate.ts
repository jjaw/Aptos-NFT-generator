// Vercel API Route for NFT Image Generation
// URL: https://www.aptosnft.com/api/nft/generate

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract parameters from query string
  const { bg, shape, words } = req.query;
  
  // Handle URL decoding for words parameter (spaces may come as + or %20)
  const decodedWords = typeof words === 'string' ? decodeURIComponent(words.replace(/\+/g, ' ')) : words;

  // Validate required parameters
  if (!bg || !shape || !words) {
    return res.status(400).json({ 
      error: 'Missing required parameters: bg, shape, words' 
    });
  }

  // Generate SVG based on shape
  const getShapeSVG = (shapeName) => {
    const shapes = {
      'Circle': '<circle cx="200" cy="200" r="60" fill="white" opacity="0.9"/>',
      'Square': '<rect x="140" y="140" width="120" height="120" fill="white" opacity="0.9"/>',
      'Triangle': '<polygon points="200,140 260,260 140,260" fill="white" opacity="0.9"/>',
      'Diamond': '<polygon points="200,140 260,200 200,260 140,200" fill="white" opacity="0.9"/>',
      'Star': '<polygon points="200,140 210,170 240,170 220,190 230,220 200,200 170,220 180,190 160,170 190,170" fill="white" opacity="0.9"/>',
      'Pentagon': '<polygon points="200,140 230,160 220,200 180,200 170,160" fill="white" opacity="0.9"/>',
      'Hexagon': '<polygon points="200,140 230,160 230,200 200,220 170,200 170,160" fill="white" opacity="0.9"/>',
      'Octagon': '<polygon points="180,145 220,145 235,160 235,200 220,215 180,215 165,200 165,160" fill="white" opacity="0.9"/>',
      'Cross': '<polygon points="185,140 215,140 215,170 245,170 245,200 215,200 215,230 185,230 185,200 155,200 155,170 185,170" fill="white" opacity="0.9"/>',
      'Heart': '<path d="M200,160 C190,150 175,150 170,165 C165,180 185,200 200,220 C215,200 235,180 230,165 C225,150 210,150 200,160" fill="white" opacity="0.9"/>',
      'Arrow': '<polygon points="200,140 230,170 215,170 215,230 185,230 185,170 170,170" fill="white" opacity="0.9"/>',
      'Spiral': '<path d="M200,140 Q230,140 230,170 Q230,200 200,200 Q170,200 170,170 Q170,155 185,155 Q200,155 200,170" stroke="white" stroke-width="6" fill="none" opacity="0.9"/>',
      'Infinity': '<path d="M170,190 Q185,175 200,190 Q215,205 230,190 Q215,175 200,190 Q185,205 170,190" stroke="white" stroke-width="6" fill="none" opacity="0.9"/>'
    };
    
    return shapes[shapeName] || shapes['Circle']; // Default to circle if shape not found
  };

  // Generate the SVG
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="#${bg}"/>
    ${getShapeSVG(shape)}
    <rect x="50" y="320" width="300" height="40" rx="5" fill="black" opacity="0.7"/>
    <text x="200" y="345" text-anchor="middle" fill="white" font-family="monospace" font-size="16" font-weight="bold">${decodedWords}</text>
  </svg>`;

  // Set headers for SVG response
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for NFT wallets

  // Return the SVG
  return res.send(svg);
}