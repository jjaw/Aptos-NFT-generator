# NFT Image Display Issue in Wallets

## Problem Statement
Users reported that NFTs are not displaying custom generated images in their wallets. Instead of the expected dynamically generated retro-style SVG images, wallets show default Aptos avatars.

## Root Cause Analysis

### Expected Behavior
The NFT smart contract generates metadata with image URLs pointing to a Vercel API endpoint:
```
https://www.aptosnft.com/api/nft/generate?bg=FF0080&shape=Circle&words=NEON WAVE GLOW
```

This URL should return a custom SVG image based on the NFT's attributes (background color, shape, and word combination).

### Actual Issue
The API endpoint `/api/nft/generate` returns **404 NOT_FOUND** errors instead of SVG images, causing wallets to fall back to default Aptos avatars.

## Technical Investigation

### Smart Contract Analysis ✅
- **Token URI Generation**: Working correctly
- **Image URL Format**: Proper structure with query parameters
- **Metadata Structure**: Valid JSON with image field pointing to API
- **URL Encoding Issue**: Words contain spaces (e.g., "NEON WAVE GLOW") which need proper encoding

### API Endpoint Issues ❌
The main problem is the Vercel serverless function deployment:

1. **File Structure**: `/api/nft/generate.ts` exists with proper code
2. **Vercel Configuration**: `vercel.json` correctly references the function
3. **Deployment Status**: Functions deploy but return 404 errors
4. **Function Format**: Multiple formats attempted

## Attempted Solutions

### 1. TypeScript Conversion ❌
**What we tried**: 
- Converted `generate.js` to `generate.ts`
- Added `@vercel/node` types
- Updated `vercel.json` to reference `.ts` file

**Result**: Still 404 errors

### 2. Web API Format ❌
**What we tried**:
```typescript
export function GET(request: Request) {
  const url = new URL(request.url);
  // ...
  return new Response(svg, { headers: {...} });
}
```

**Result**: TypeScript compilation errors, still 404 after fixes

### 3. Node.js Handler Format (Current) ⏳
**What we tried**:
```typescript
export default function handler(req: any, res: any) {
  const { bg, shape, words } = req.query;
  // ...
  return res.send(svg);
}
```

**Status**: Currently deploying

### 4. URL Encoding Improvements ✅
**What we fixed**:
- Added proper URL decoding for words parameter
- Handle both `%20` and `+` encodings for spaces
- Ensure SVG generation works with decoded text

## Current Status

### Working Components ✅
- Smart contract generates correct token URIs
- API function logic generates proper SVG images
- Local testing of API function works
- Frontend NFT minting and preview works
- Vercel project builds successfully

### Failing Components ❌
- Vercel serverless function deployment returns 404
- NFT images not loading in wallets
- API endpoint not accessible via HTTP requests

## Next Steps

1. **Deploy Current Fix**: Wait for Node.js handler format deployment to complete
2. **Test API Endpoint**: Verify `curl` request returns SVG instead of 404
3. **Mint Test NFT**: Create new NFT and check wallet display
4. **Debug Further**: If still failing, investigate:
   - Vercel function logs
   - Alternative deployment methods
   - Static image fallbacks

## API Testing Commands

```bash
# Test the API endpoint
curl "https://www.aptosnft.com/api/nft/generate?bg=FF0080&shape=Circle&words=NEON+WAVE+GLOW"

# Expected result: SVG content
# Actual result: "The page could not be found NOT_FOUND"
```

## Code Files Modified

- `api/nft/generate.ts` - Main API function (multiple format attempts)
- `vercel.json` - Deployment configuration
- `package.json` - Added @vercel/node dependency

## Deployment History

1. Initial JS file with ES modules
2. TypeScript conversion with Vercel types
3. Web API format conversion
4. Node.js handler format (current)

Each deployment builds successfully but the API endpoint remains inaccessible.