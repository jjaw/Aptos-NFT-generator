# Filter Count Discrepancy Investigation - FINAL

## Issue Summary
**Reported Problem:** Filter sidebar shows counts that don't match the number of NFTs displayed when filters are clicked.

**Specific Example:** "APEX shows 10 in the filter bar, but when clicking it only 9 NFTs appear"

**Date:** 2025-11-11
**Status:** ✅ Root cause identified - Actual counting bug

---

## ROOT CAUSE: Traits API Overcounts by 1

### The Real Issue

After analyzing actual API responses, the issue is **NOT** a UX design problem. There is an **actual discrepancy** in the data:

- **Traits API Response:** "APEX: 10" ← Claims 10 tokens have APEX
- **List API Response:** "total": 9 ← Returns 9 tokens with APEX
- **All 9 tokens DO contain APEX** - filtering logic is correct

**This is a data processing bug, not a UX issue.**

---

## Evidence: Actual API Data Analysis

### Traits API Response
```json
"Words": {
  "APEX": 10,  ← Says 10 tokens have APEX
  ...
}
```

### List API Response (Filtering by APEX only)
```json
{
  "items": [
    {"Words": "APEX WARP HYPE"},
    {"Words": "SYNC APEX BEAM"},
    {"Words": "IRIS BYTE APEX"},
    {"Words": "GLOW APEX WARP"},
    {"Words": "WAVE APEX XRAY"},
    {"Words": "APEX PACE UNIT"},
    {"Words": "APEX NOVA RAVE"},
    {"Words": "APEX SYNC TECH"},
    {"Words": "KEEP APEX PURE"}
  ],
  "total": 9  ← Only 9 tokens returned
}
```

**All 9 tokens contain "APEX"** - the filtering logic is working correctly. But where is the 10th token that traits API counted?

---

## Possible Root Causes

### Theory 1: Duplicate Token Record in GraphQL (Most Likely)

The Aptos indexer GraphQL query returns a duplicate token record:

**What happens:**
```
GraphQL Response:
  - Token A: "APEX WARP HYPE"
  - Token B: "SYNC APEX BEAM"
  - ...
  - Token I: "KEEP APEX PURE"
  - Token A (duplicate): "APEX WARP HYPE"  ← Same token, different record!

Traits API Processing:
  - Iterates through all records
  - Counts "APEX" in Token A → +1
  - Counts "APEX" in duplicate Token A → +1
  - Total: 10

List API Processing:
  - Filters all records
  - Both Token A records match filter
  - But when returned, only unique records shown
  - OR: One duplicate is filtered out somehow
  - Result: 9 unique tokens displayed
```

**Evidence:**
- Multiple tokens in list response have `tokenId: "0"` due to name parsing failures:
  - "Retro NFT #\r"
  - "Retro NFT #\u001a"
  - "Retro NFT #\u001b"
  - "Retro NFT #$"
- These are DIFFERENT tokens (different word combinations)
- But suggests data quality issues in the indexer

### Theory 2: Inconsistent Description Parsing

One token's description might:
- Parse successfully in traits API → "APEX" counted
- Fail to parse in list API → not matched by filter
- Result: Traits counts 10, List shows 9

**Why this is less likely:**
- Both APIs use identical `parseTokenDescription()` function
- Regex is the same: `/words: (.+)$/`
- Should produce consistent results

### Theory 3: Race Condition (Unlikely)

Two API calls see different blockchain state:
- Traits API sees 10 tokens with APEX
- List API sees 9 tokens with APEX (one was burned/transferred?)

**Why this is unlikely:**
- User reported no new mints in days
- Collection is stable
- Would need a burn/transfer between API calls (milliseconds apart)

---

## Code Analysis

### Traits API Counting (api/nft/collection/traits.js:74-98)

```javascript
// Line 74-98: Process each token to extract and count traits
tokens.forEach(token => {
  const attributes = parseTokenDescription(token.description || '');

  // Count individual words from word combinations
  if (attributes.wordCombination) {
    const individualWords = attributes.wordCombination.split(' ');
    individualWords.forEach(word => {
      if (word.trim()) {
        traitCounts['Words'][word.trim()] = (traitCounts['Words'][word.trim()] || 0) + 1;
        // ↑ If tokens array has duplicates, this counts them multiple times
      }
    });
  }
});
```

**Key Issue:** No deduplication. If `tokens` array contains duplicate records, they're all counted.

**GraphQL Query (lines 25-42):**
```javascript
current_token_datas_v2(
  where: {
    collection_id: { _eq: $collection_id }
  }
  limit: 10000
)
```

**No `distinct` or `group by` clause** - relies on indexer to return unique tokens.

---

### List API Filtering (api/nft/collection/list.js:183-220)

```javascript
// Line 183-201: Apply search filter (if applicable)
if (q.trim()) {
  const searchTerm = q.trim().toLowerCase();
  filteredTokens = filteredTokens.filter(token => {
    const wordsAttribute = token.attributes.find(attr => attr.trait_type === 'Words');
    const wordMatch = wordsAttribute ?
      wordsAttribute.value.split(' ').some(word => word.toLowerCase().includes(searchTerm)) :
      false;
    return nameMatch || idMatch || wordMatch;
  });
}

// Line 204-220: Apply trait filters
if (Object.keys(traitFilters).length > 0) {
  filteredTokens = filteredTokens.filter(token => {
    return Object.entries(traitFilters).every(([traitType, values]) => {
      if (traitType === 'Words') {
        const tokenValue = token.attributes.find(attr => attr.trait_type === traitType)?.value;
        if (!tokenValue) return false;
        const tokenWords = tokenValue.split(' ').map(w => w.trim());
        return values.some(selectedWord => tokenWords.includes(selectedWord));
        // ↑ Correctly checks if word exists in combination
      }
      // ...
    });
  });
}

// Line 228-229: Apply pagination
const paginatedTokens = filteredTokens.slice(offsetNum, offsetNum + limitNum);
```

**Filtering logic is correct** - properly splits words and checks inclusion.

**But:** If `tokens` array from GraphQL has duplicates, they'd both appear in `filteredTokens`. However, response shows only 9 unique word combinations, suggesting:
- Either no duplicates in GraphQL response, OR
- Duplicates are somehow filtered out before returning

---

## Description Parsing (Both APIs)

Both APIs use identical parsing logic:

```javascript
function parseTokenDescription(description) {
  if (!description) return {};

  const bgMatch = description.match(/(#[A-Fa-f0-9]{6}) background/);
  const shapeMatch = description.match(/background, (\w+) shape/);
  const wordsMatch = description.match(/words: (.+)$/);

  return {
    backgroundColor: bgMatch ? bgMatch[1] : null,
    shape: shapeMatch ? shapeMatch[1] : null,
    wordCombination: wordsMatch ? wordsMatch[1].trim() : null
  };
}
```

**Logic is identical** - same function duplicated in both files. Should produce consistent results.

---

## Additional Evidence: Malformed Token IDs

Looking at the list API response, multiple tokens have `tokenId: "0"`:

```json
{"tokenId": "0", "name": "Retro NFT #\r", "Words": "APEX WARP HYPE"},
{"tokenId": "0", "name": "Retro NFT #\u001a", "Words": "SYNC APEX BEAM"},
{"tokenId": "0", "name": "Retro NFT #\u001b", "Words": "IRIS BYTE APEX"},
{"tokenId": "0", "name": "Retro NFT #$", "Words": "GLOW APEX WARP"}
```

These are **4 different tokens** (different word combinations) but all parsed as `tokenId: "0"`.

**Parsing Logic (list.js:146):**
```javascript
const tokenIdMatch = token.token_name?.match(/Retro NFT #(\d+)/);
const tokenId = tokenIdMatch ? tokenIdMatch[1] : '0';
```

**Issue:**
- Regex expects: `"Retro NFT #123"`
- Indexer returns: `"Retro NFT #\r"` (control characters instead of numbers)
- Regex fails → defaults to `'0'`

**This suggests data quality issues in the Aptos indexer.**

---

## How to Confirm the Root Cause

### Add Logging to Both APIs

**In `api/nft/collection/traits.js` (after line 64):**
```javascript
const tokens = data.data?.current_token_datas_v2 || [];
console.log('===== TRAITS API DEBUG =====');
console.log('Total tokens fetched from GraphQL:', tokens.length);

// Count unique token_data_ids
const uniqueIds = new Set(tokens.map(t => t.token_data_id || t.token_name));
console.log('Unique token IDs:', uniqueIds.size);
console.log('Duplicates?', tokens.length !== uniqueIds.size);

// Log tokens containing APEX
const apexTokens = tokens.filter(t => {
  const parsed = parseTokenDescription(t.description);
  return parsed.wordCombination?.includes('APEX');
});
console.log('Tokens with APEX in description:', apexTokens.length);
console.log('APEX tokens:', apexTokens.map(t => ({
  name: t.token_name,
  words: parseTokenDescription(t.description).wordCombination
})));
```

**In `api/nft/collection/list.js` (after line 135):**
```javascript
const tokens = data.data?.current_token_datas_v2 || [];
console.log('===== LIST API DEBUG =====');
console.log('Total tokens fetched from GraphQL:', tokens.length);

// After filtering (line 220)
console.log('Tokens after filtering for APEX:', filteredTokens.length);
console.log('Filtered tokens:', filteredTokens.map(t => ({
  tokenId: t.tokenId,
  words: t.attributes.find(a => a.trait_type === 'Words')?.value
})));
```

Then trigger the filter and check the logs to see:
1. Are both APIs fetching the same number of tokens from GraphQL?
2. Does the GraphQL response have duplicate `token_data_id` values?
3. Which specific tokens are being counted/filtered?

---

## My Investigation Journey (What I Got Wrong)

### Attempt 1: Cache Timing Theory ❌
**Thought:** Traits API and List API have different cache lifecycles causing mismatches.

**Why Wrong:** No new NFTs minted in days → cache would have refreshed hundreds of times. Can't explain persistent discrepancy.

### Attempt 2: UX Design Issue ❌
**Thought:** Sidebar shows global counts, user has multiple filters active (Shape=Infinity AND Words=APEX), so 10 vs 4 is expected.

**Why Wrong:** When I got actual data, it showed ONLY Words=APEX filter active, and the discrepancy was 10 vs 9, not 10 vs 4.

### Attempt 3: Actual Data Analysis ✅
**Realized:** After seeing actual API responses:
- Traits says 10
- List returns 9 (all with APEX)
- This is an actual 1-token counting bug

**Root Cause:** Most likely duplicate token record in Aptos indexer GraphQL response.

---

## Summary

### The Core Issue
**Traits API counts 10 tokens with "APEX", but List API only returns 9 tokens with "APEX".**

### It IS a Bug
- NOT a UX design choice
- NOT a cache timing issue
- IS an actual data processing discrepancy

### Most Likely Cause
**Duplicate token record in Aptos indexer GraphQL response:**
- Traits API counts it twice
- List API somehow filters it to one (or doesn't return duplicate)
- Result: 10 vs 9 discrepancy

### Secondary Issue
**Malformed token names with control characters:**
- Token names like "Retro NFT #\r" instead of "Retro NFT #123"
- Causes tokenId parsing failures
- Multiple distinct tokens assigned tokenId: "0"
- Suggests underlying data quality issues in indexer

---

## Impact Assessment

### Issue 1: Count Discrepancy (Traits 10 vs List 9)
- **Severity:** Medium (actual bug)
- **User Impact:** Confusing and misleading
- **Functional Impact:** Users expect 10 results, see 9
- **Data Integrity:** Suggests duplicate records or parsing inconsistency

### Issue 2: Malformed Token IDs
- **Severity:** Medium (data quality)
- **User Impact:** Weird names displayed ("Retro NFT #\r")
- **Functional Impact:** Multiple tokens with same parsed ID
- **Root Cause:** Aptos indexer or contract data issues

---

## Recommendations (Not Implemented)

### For Issue 1: Count Discrepancy

**Option A: Add Deduplication** (Safest)
```javascript
// In traits.js, deduplicate before counting
const uniqueTokens = Array.from(
  new Map(tokens.map(t => [t.token_data_id, t])).values()
);
// Then count traits from uniqueTokens only
```

**Option B: Add Logging First** (Diagnostic)
- Add console.log statements to see actual data
- Confirm whether duplicates exist in GraphQL response
- Then fix based on findings

**Option C: Use token_data_id as Primary Key** (Proper)
- Always deduplicate by `token_data_id`
- Don't rely on token names
- Ensures consistency across APIs

### For Issue 2: Malformed Token IDs

**Option A: Robust Parsing**
```javascript
// Strip control characters before parsing
const cleanName = token.token_name?.replace(/[\x00-\x1F\x7F]/g, '');
const tokenIdMatch = cleanName?.match(/Retro NFT #(\d+)/);
```

**Option B: Use token_data_id** (Best)
```javascript
// Use GraphQL's token_data_id as unique identifier
const tokenId = token.token_data_id?.split('::').pop();
```

**Option C: Investigate Source**
- Check smart contract code
- See why token names have control characters
- Fix at mint time

---

## Files Involved

### Backend
- `api/nft/collection/traits.js` - Overcounts by 1 (likely due to duplicates)
- `api/nft/collection/list.js` - Returns correct filtered count, has tokenId parsing bug

### Frontend
- `frontend/components/gallery/FilterSidebar.tsx` - Displays incorrect counts from API
- `frontend/components/gallery/Gallery.tsx` - Uses list API (which is correct)

### External
- Aptos GraphQL Indexer - Possibly returning duplicate token records
- Smart Contract - Possibly storing malformed token names

---

## Next Steps to Debug

1. **Add logging to both APIs** as shown above
2. **Check Vercel logs** or run locally to see console output
3. **Confirm whether duplicates exist** in GraphQL response
4. **Implement deduplication** if duplicates confirmed
5. **Fix tokenId parsing** to handle control characters
6. **Consider using token_data_id** as primary identifier

---

## Conclusion

**This is an actual counting bug, not a UX or cache issue.**

The traits API is counting 10 tokens with "APEX" while the list API only finds 9. Most likely cause is a duplicate token record in the Aptos indexer GraphQL response that:
- Gets counted twice in traits API
- Appears only once (or not at all) in list API results

Additionally, token names contain control characters causing tokenId parsing failures, suggesting underlying data quality issues with the Aptos indexer or smart contract.

**Verification needed:** Add logging to confirm duplicate token records in GraphQL response.

---

## Investigation Methodology

1. ✅ Initial architecture review → wrong conclusion (cache timing)
2. ✅ Saw UX with multiple filters → wrong conclusion (design issue)
3. ✅ Got actual API data for single filter → correct diagnosis!
4. ✅ Analyzed both responses line by line
5. ✅ Identified exact discrepancy: 10 vs 9
6. ✅ Verified all 9 returned tokens DO contain APEX
7. ✅ Concluded: traits overcounts by 1
8. ✅ Hypothesized: duplicate records in GraphQL
9. ⏳ Pending: Add logging to confirm hypothesis

**Result:** Actual data processing bug - traits API overcounts, likely due to duplicate token records from Aptos indexer.
