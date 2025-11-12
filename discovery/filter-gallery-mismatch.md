# Filter Count Display Mismatch Investigation

**Date:** November 12, 2025
**Issue:** Filter sidebar showed 15 tokens for "Background Color: #8000FF" but gallery displayed only 13 NFTs
**Status:** Resolved

## What Happened Before

Prior to this investigation, a separate filter count discrepancy issue was identified and resolved in an earlier session. That issue involved **malformed token validation**.

### Previous Issue: Malformed Token Validation

The collection contained 36 tokens with malformed names from an old buggy smart contract mixed with tokens from the new contract. These malformed tokens had:

**Control characters:**
- `\r`, `\n`, `\u001a`, `\u001b`, and other non-printable characters (`\x01` through `\x1F`)

**Invalid name formats:**
- `Retro NFT #,`
- `Retro NFT ##`
- `Retro NFT #!`
- `Retro NFT #$`
- And other variations that don't match the expected pattern `Retro NFT #(\d+)`

### Previous Symptoms

Word filter discrepancies:
- APEX filter: Sidebar showed "10" but only 7 NFTs displayed
- EPIC filter: Sidebar showed "1" but 2 NFTs displayed
- JUMP filter: Sidebar showed "2" but 3 NFTs displayed

**Root cause:**
- Traits API was counting ALL tokens including malformed ones
- List API was inconsistently including malformed tokens
- Result: Sidebar counts didn't match grid display counts

### Previous Fix

Implemented consistent malformed token validation in both APIs:

```javascript
const validTokenPattern = /^Retro NFT #(\d+)$/;
const cleanName = token.token_name?.replace(/[\x00-\x1F\x7F]/g, '') || '';
const isValid = validTokenPattern.test(cleanName);

if (!isValid) {
  // Skip this malformed token
  malformedTokens.push(token);
} else {
  validTokens.push(token);
}
```

This ensured both APIs consistently skipped all 36 malformed tokens when counting traits and displaying NFTs.

### Relevant Commits (Previous Session)

- Malformed token validation implementation
- Updated indexer URL from deprecated endpoint to `https://api.testnet.aptoslabs.com/v1/graphql`
- Comprehensive logging of all malformed tokens

## Root Cause Analysis (Current Session)

### Primary Issue: Aptos GraphQL Indexer Hard Limit

The Aptos GraphQL indexer enforces a hard limit of 100 records per request, regardless of the requested limit parameter. Both APIs were requesting 10,000 tokens but only receiving 100 records per call.

**Impact:**
- Traits API: Analyzed only first 100 tokens (most recent by timestamp)
- List API: Fetched only first 100 tokens when applying filters
- Result: Inconsistent trait counts vs displayed tokens

### Secondary Issue: Different Query Orderings

When analyzing only 100 tokens, the APIs used different ordering strategies:

- **Traits API:** `last_transaction_timestamp: desc` (most recent tokens first)
- **List API (rarity sort):** `token_name: asc` (alphabetical, control characters sort first)

This caused each API to analyze different subsets of the collection, leading to different trait counts for the same collection.

## Technical Details

### Collection Characteristics

- Total tokens: 133
- Valid tokens: 97
- Malformed tokens: 36 (containing control characters like `\x01` through `\x1F`)
- Tokens with #8000FF background: 15

### Pre-Fix Behavior

**Traits API:**
```
Fetched: 100 records (most recent)
Valid tokens analyzed: 97 (3 malformed)
#8000FF count: 15
```

**List API:**
```
Fetched: 100 records (alphabetically sorted)
Valid tokens analyzed: 64 (36 malformed, including all control character tokens)
#8000FF count: 13
```

The discrepancy occurred because:
1. Different orderings meant different 100-token subsets
2. The alphabetical sort included more malformed tokens (control characters sort before numbers)
3. Some #8000FF tokens existed in the first subset but not the second

## Solution Implemented

### Pagination Implementation

Implemented proper pagination loops in both APIs to fetch all tokens from the indexer in batches of 100.

**Traits API (`api/nft/collection/traits.js`):**
```javascript
const BATCH_SIZE = 100;
let allTokens = [];
let offset = 0;
let hasMore = true;

while (hasMore) {
  // Fetch batch with offset
  const batch = await fetchTokens(offset, BATCH_SIZE);
  allTokens = allTokens.concat(batch);

  if (batch.length < BATCH_SIZE) {
    hasMore = false;
  } else {
    offset += BATCH_SIZE;
  }

  // Safety limit
  if (offset >= 10000) break;
}
```

**List API (`api/nft/collection/list.js`):**
- Conditional pagination: Only paginate when filters/search are applied
- Without filters: Single page fetch for performance
- With filters: Full pagination to ensure accurate filtering across entire collection

### Post-Fix Behavior

**Both APIs:**
```
Fetched: 133 records (2 batches: 100 + 33)
Valid tokens analyzed: 97
#8000FF count: 15
```

Both APIs now analyze the complete dataset, producing consistent results.

## Performance Implications

### Current Performance (133 tokens)

- Batches required: 2
- Response time: ~130ms (65ms per request)
- User experience: Imperceptible delay

### Projected Performance (Larger Collections)

| Collection Size | Batches | Est. Time | Experience |
|----------------|---------|-----------|------------|
| 500 tokens | 5 | ~325ms | Fast |
| 1,000 tokens | 10 | ~650ms | Acceptable |
| 5,000 tokens | 50 | ~3.25s | Noticeable |
| 10,000 tokens | 100 | ~6.5s | Slow |

**Mitigation Strategy:**
For collections exceeding 1,000 tokens, parallel batch fetching should be implemented to reduce sequential request overhead.

## Validation

All critical logic verified to be identical across both APIs:

1. **Pagination:** Same batch size, loop logic, and safety limits
2. **Deduplication:** Identical `token_data_id` based deduplication
3. **Validation:** Same regex pattern `/^Retro NFT #(\d+)$/` for malformed token detection
4. **Parsing:** Identical `parseTokenDescription()` function for trait extraction
5. **Filtering:** Same validation and filtering rules applied to all tokens

## Files Modified

- `api/nft/collection/traits.js` - Added pagination loop (always fetches all tokens)
- `api/nft/collection/list.js` - Added conditional pagination (fetches all when filtering)

## Commits (Current Session)

- `9e61746` - Initial attempt: Increased limit from 100 to 10,000 (ineffective due to indexer limit)
- `c05245c` - Final fix: Implemented pagination to work around indexer limit
- `f27ec84` - Documentation: Added this technical summary

## Verification

The fix ensures:
1. Filter counts in sidebar match displayed token counts in gallery
2. Users can filter and view the entire collection, not just first 100 tokens
3. Both APIs analyze identical datasets regardless of collection size
4. Performance remains acceptable for current collection size (133 tokens)

## Future Optimizations

If collection grows beyond 1,000 tokens:
1. Implement parallel batch fetching (5-10x speedup)
2. Add server-side caching layer (Vercel KV or Redis)
3. Consider lazy loading for trait counts (fetch on-demand vs upfront)

## Summary

Two separate but related issues were resolved to fix filter count discrepancies:

**Issue 1 (Previous Session): Malformed Token Validation**
- Problem: 36 tokens with invalid names from buggy old contract
- Symptom: Word filters showed incorrect counts (APEX: 10 vs 7, EPIC: 1 vs 2, etc.)
- Solution: Consistent validation to skip malformed tokens in both APIs

**Issue 2 (Current Session): Pagination Implementation**
- Problem: Aptos indexer 100-record hard limit, different ordering strategies
- Symptom: Background Color #8000FF showed 15 vs 13
- Solution: Implemented pagination to fetch entire collection (133 tokens)

Both fixes ensure the Traits API and List API now analyze identical datasets and produce consistent filter counts across the entire application.
