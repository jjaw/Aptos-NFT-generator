# Filter Count Display Mismatch Investigation

**Date:** November 12, 2025
**Issue:** Filter sidebar showed 15 tokens for "Background Color: #8000FF" but gallery displayed only 13 NFTs
**Status:** Resolved

## Root Cause Analysis

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

## Commits

- `9e61746` - Initial attempt: Increased limit from 100 to 10,000 (ineffective due to indexer limit)
- `c05245c` - Final fix: Implemented pagination to work around indexer limit

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
