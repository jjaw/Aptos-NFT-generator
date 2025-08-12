# NFT Explorer Display - Complete Implementation Guide

## Overview

This document chronicles the complete journey of solving NFT image display issues in blockchain explorers, from initial broken display to working HTTP metadata endpoints.

**Problem**: NFTs showed default Aptos avatars instead of custom retro SVG images in wallet explorers
**Solution**: Migrated from data URI metadata format to industry-standard HTTP metadata endpoints

---

## The Problem

### Initial State
- NFT generation API was working: `https://www.aptosnft.com/api/nft/generate`
- Smart contract was successfully minting NFTs
- **Issue**: Wallet explorers displayed default Aptos avatars instead of custom images

### What We Discovered
NFT explorers require specific metadata formats and URL structures to properly display custom images. The data URI approach had several limitations that prevented proper image loading.

---

## Investigation Journey

### 1. API Deployment Issues (First Attempt)

**Problem**: Initial API calls returned 404 errors
```bash
curl "https://www.aptosnft.com/api/nft/generate?bg=FF0080&shape=Circle&words=NEON+WAVE+GLOW"
# Result: 404 Not Found
```

**Root Cause**: TypeScript ES modules weren't compatible with Vercel's runtime
**Solution**: Converted from TypeScript to JavaScript CommonJS format

```javascript
// Fixed format - api/nft/generate.js
module.exports = (req, res) => {
  // API logic here
};
```

### 2. HEAD Request Support (Explorer Compatibility)

**Problem**: NFT explorers couldn't verify images due to 405 Method Not Allowed
**Root Cause**: Explorers use HEAD requests to verify image availability
**Solution**: Added HEAD request support

```javascript
// Allow GET and HEAD requests (HEAD is used by NFT explorers)
if (req.method !== 'GET' && req.method !== 'HEAD') {
  return res.status(405).json({ error: 'Method not allowed' });
}

// For HEAD requests, only send headers
if (req.method === 'HEAD') {
  return res.status(200).end();
}
```

### 3. URL Encoding Issues

**Problem**: Spaces in word combinations caused parsing problems
**Example**: "NEON WAVE GLOW" wasn't properly handled in URLs

**Solutions Attempted**:
1. Smart contract URL encoding functions
2. Double URL decoding in API endpoints

```javascript
// Handle URL decoding for words parameter (may be double-encoded from data URI)
let decodedWords = typeof words === 'string' ? words : String(words);
// Handle double-encoded URLs (%2520 -> %20 -> space)
decodedWords = decodeURIComponent(decodedWords.replace(/%2520/g, '%20'));
```

### 4. Data URI Parsing Problems (Critical Discovery)

**Problem**: JSON metadata was truncated in data URIs
**Example**: `{"name":"Retro NFT"` (cut off after name field)

**Root Cause**: Data URIs have parsing limitations for complex JSON structures
**Evidence**: Browser console showed incomplete metadata parsing

---

## The Solution: HTTP Metadata Endpoints

### Industry Standard Approach
Instead of embedding metadata in data URIs, we implemented proper HTTP endpoints that return JSON metadata.

### Implementation

#### 1. HTTP Metadata API Endpoint
Created `/api/nft/metadata.js` (query parameter version):
```javascript
module.exports = (req, res) => {
  const { id } = req.query;
  const tokenId = parseInt(id);
  
  const metadata = generateMetadata(tokenId);
  
  const nftMetadata = {
    name: `Retro NFT #${tokenId}`,
    description: `A unique retro 80s NFT with ${metadata.backgroundColor} background...`,
    image: imageUrl,
    attributes: [
      { trait_type: "Background Color", value: metadata.backgroundColor },
      { trait_type: "Shape", value: metadata.shape },
      { trait_type: "Words", value: metadata.wordCombination }
    ]
  };
  
  return res.status(200).json(nftMetadata);
};
```

#### 2. Alternative Path Parameter Endpoint
Created `/api/nft/metadata/[id].js` for RESTful URL structure:
```
https://www.aptosnft.com/api/nft/metadata/29
```

#### 3. Smart Contract Update
Updated contract to generate HTTP URLs instead of data URIs:

```move
// NEW: HTTP metadata endpoint approach
fun create_token_uri(_name: String, _description: String, metadata: NFTMetadata): String {
    let token_uri = string::utf8(b"https://www.aptosnft.com/api/nft/metadata?id=");
    let token_id_str = to_string(metadata.token_id);
    string::append(&mut token_uri, token_id_str);
    token_uri
}
```

---

## What Worked vs What Didn't

### ❌ What Didn't Work

#### 1. Data URI Metadata Format
```move
// This approach failed in explorers
let token_uri = string::utf8(b"data:application/json,{\"name\":\"...\"}");
```
**Issues**:
- JSON parsing truncation
- URL encoding complications
- Limited explorer support
- Complex escape character handling

#### 2. TypeScript API Deployment
```typescript
// This didn't work with Vercel
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // TypeScript ES modules caused 404 errors
}
```

#### 3. Simple URL Encoding in Smart Contract
```move
// Attempted but insufficient
fun url_encode_spaces(text: String): String {
    // Basic space encoding wasn't enough for data URIs
}
```

### ✅ What Worked

#### 1. JavaScript CommonJS API Format
```javascript
// This works reliably with Vercel
module.exports = (req, res) => {
  // Proper serverless function format
};
```

#### 2. HTTP Metadata Endpoints
```
https://www.aptosnft.com/api/nft/metadata?id=29
```
**Benefits**:
- Industry standard format
- Proper JSON response headers
- No encoding issues
- Explorer compatibility
- Proper CORS support

#### 3. HEAD Request Support
```javascript
if (req.method === 'HEAD') {
  return res.status(200).end();
}
```

#### 4. Proper Content Headers
```javascript
res.setHeader('Content-Type', 'application/json');
res.setHeader('Cache-Control', 'public, max-age=31536000');
res.setHeader('Access-Control-Allow-Origin', '*');
```

---

## Technical Architecture

### Final Working Flow
1. **Smart Contract**: Generates HTTP metadata URL (`https://www.aptosnft.com/api/nft/metadata?id=29`)
2. **Explorer Request**: Fetches JSON metadata from HTTP endpoint
3. **Image URL**: Metadata contains properly encoded image URL
4. **Image Request**: Explorer fetches SVG from image generation API
5. **Display**: Custom retro NFT images appear in wallet

### URL Structure
```
Token URI: https://www.aptosnft.com/api/nft/metadata?id=29
↓
Metadata JSON: {
  "name": "Retro NFT #29",
  "image": "https://www.aptosnft.com/api/nft/generate?bg=FF0080&shape=Star&words=GRID%20IRIS%20FLOW"
}
↓
SVG Image: Custom retro-themed NFT image
```

---

## Key Lessons Learned

### 1. Industry Standards Matter
- Data URIs are not well-supported by NFT explorers
- HTTP metadata endpoints are the industry standard
- Following established patterns ensures compatibility

### 2. Explorer Requirements
- Explorers need HEAD request support for image verification
- Proper Content-Type headers are critical
- CORS headers enable cross-origin access

### 3. URL Encoding Complexity
- Data URIs require complex escape character handling
- HTTP endpoints eliminate encoding issues
- URL parameters are more reliable than embedded JSON

### 4. Deployment Environment Constraints
- Vercel has specific requirements for serverless functions
- JavaScript CommonJS is more reliable than TypeScript ES modules
- Environment variables must be properly configured

### 5. Testing Is Critical
- Test actual explorer behavior, not just API responses
- Verify image display in real wallet environments
- Check both metadata and image URL chains

---

## Verification Steps

### Testing the Complete Chain
```bash
# 1. Test metadata endpoint
curl "https://www.aptosnft.com/api/nft/metadata?id=29"

# 2. Extract image URL from response
# 3. Test image generation
curl "https://www.aptosnft.com/api/nft/generate?bg=FF0080&shape=Star&words=GRID%20IRIS%20FLOW"

# 4. Verify in actual wallet explorer
```

### Success Indicators
- ✅ Metadata endpoint returns proper JSON
- ✅ Image URL generates SVG content
- ✅ NFT displays custom image in explorer
- ✅ No default Aptos avatars

---

## Future Considerations

### Maintenance
- Monitor API endpoint performance
- Track explorer compatibility changes
- Maintain image generation service uptime

### Enhancements
- Consider IPFS for decentralized metadata storage
- Implement metadata caching for performance
- Add more comprehensive error handling

### Scalability
- Monitor API rate limits
- Consider CDN for image serving
- Plan for increased traffic

---

## Conclusion

The key to successful NFT explorer display was understanding that **explorers expect industry-standard HTTP metadata endpoints**, not embedded data URIs. By implementing proper HTTP APIs with correct headers and following established patterns, we achieved full compatibility with NFT explorers.

**Critical Success Factors**:
1. HTTP metadata endpoints instead of data URIs
2. Proper Content-Type and CORS headers
3. HEAD request support for image verification
4. JavaScript CommonJS format for Vercel deployment
5. Systematic testing of the complete metadata → image chain

This implementation provides a robust foundation for NFT metadata serving that follows industry standards and ensures compatibility across different wallet and explorer environments.