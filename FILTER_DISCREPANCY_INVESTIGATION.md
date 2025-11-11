# Filter Count Discrepancy Investigation - CORRECTED

## Issue Summary
**Reported Problem:** Filter sidebar shows counts that don't match the number of NFTs displayed when filters are clicked.

**Example:** "APEX shows 10 in the filter bar, but when I click on it I only see 4"

**Date:** 2025-11-11
**Status:** ✅ Root cause identified

---

## ROOT CAUSE: Sidebar Shows Global Counts, Not Filtered Counts

### The Real Issue

The filter sidebar displays **global trait counts** (across entire collection), but users expect **dynamic counts** (filtered by other active selections).

**Current Behavior:**
- Sidebar: "APEX: 10" ← Count across **entire collection**
- Grid: 4 NFTs shown ← Tokens matching **all active filters** (Shape=Infinity AND Words=APEX)

**Expected Behavior:**
- When Shape=Infinity is selected, Words counts should update to show: "Of the Infinity-shaped tokens, how many have APEX?" → 4
- Instead, it continues showing: "In total collection, how many have APEX?" → 10

---

## Evidence: Actual API Data Analysis

### User's Query
```json
"traitFilters": {
  "Shape": ["Infinity"],
  "Words": ["APEX"]
}
```
**User has TWO filters active simultaneously.**

### Traits API Response
```json
"Words": {
  "APEX": 10,  ← Global count (entire collection)
  ...
}
```

### List API Response (Filtered)
```json
{
  "items": [
    {"attributes": [...], "Words": "APEX WARP HYPE"},      // Infinity + APEX ✓
    {"attributes": [...], "Words": "SYNC APEX BEAM"},      // Infinity + APEX ✓
    {"attributes": [...], "Words": "IRIS BYTE APEX"},      // Infinity + APEX ✓
    {"attributes": [...], "Words": "APEX NOVA RAVE"}       // Infinity + APEX ✓
  ],
  "total": 4  ← Filtered count (Infinity AND APEX)
}
```

**Analysis:**
- Total tokens with "APEX" anywhere: **10** (sidebar shows this)
- Tokens with BOTH Infinity shape AND APEX: **4** (grid shows this)
- **Both numbers are correct!** But the UX is confusing.

---

## Why This Is Confusing

### User Mental Model (Expected):
```
Step 1: Select Shape=Infinity
  → Sidebar updates to show counts within Infinity-shaped tokens only
  → "APEX: 4" (4 of the Infinity tokens contain APEX)

Step 2: Click APEX
  → Grid shows 4 tokens (matches expectation ✓)
```

### Actual System Behavior:
```
Step 1: Select Shape=Infinity
  → Sidebar DOES NOT update
  → "APEX: 10" (still showing global count)

Step 2: Click APEX
  → Grid shows 4 tokens
  → User confused: "Why does sidebar say 10 but only 4 appear?" ❌
```

---

## Code Analysis

### Traits API (api/nft/collection/traits.js)

**Query:** Fetches ALL tokens, no filter awareness
```javascript
// Line 25-37: GraphQL query with NO WHERE clause for filters
current_token_datas_v2(
  where: {
    collection_id: { _eq: $collection_id }
    // ← No other filters applied!
  }
  limit: 10000
)
```

**Counting:** Counts across entire collection
```javascript
// Lines 90-98: Counts individual words from ALL tokens
tokens.forEach(token => {
  const individualWords = attributes.wordCombination.split(' ');
  individualWords.forEach(word => {
    traitCounts['Words'][word] = (traitCounts['Words'][word] || 0) + 1;
  });
});
```

**Result:** Always returns global counts, regardless of active filters.

---

### List API (api/nft/collection/list.js)

**Filtering:** Applies ALL selected filters
```javascript
// Lines 204-220: Post-processing filters
filteredTokens = filteredTokens.filter(token => {
  return Object.entries(traitFilters).every(([traitType, values]) => {
    // Check if token matches THIS trait filter
    if (traitType === 'Words') {
      const tokenWords = tokenValue.split(' ');
      return values.some(selectedWord => tokenWords.includes(selectedWord));
    } else {
      return tokenValue && values.includes(tokenValue);
    }
  });
});
```

**Result:** Returns only tokens matching **ALL** active filters (AND logic).

---

### Frontend: Sidebar Component (frontend/components/gallery/FilterSidebar.tsx)

**Query:** Independent from main list query
```javascript
// Line 23-38
const { data: traitsData } = useQuery({
  queryKey: ['collection-traits'], // ← No dependency on active filters!
  queryFn: async () => {
    const response = await fetch('/api/nft/collection/traits');
    return response.json();
  },
  staleTime: 5 * 60 * 1000,
});
```

**Display:** Shows raw counts from API
```javascript
// Lines 121-143: Renders counts without filtering
{Object.entries(values).map(([value, count]) => (
  <span className="text-xs text-gray-500">{count}</span>
  // ← Displays global count directly
))}
```

**No Logic To:**
- Pass active filters to traits API
- Filter counts client-side based on other selections
- Update counts when other filters change

---

## Common UX Patterns in NFT Marketplaces

### Pattern 1: Dynamic Filtering (OpenSea, Blur)
- Sidebar counts **update** when filters are applied
- Shows: "Of tokens matching current filters, how many have trait X?"
- Requires re-querying or client-side recalculation

### Pattern 2: Static Counts with Indicators (LooksRare)
- Sidebar shows global counts (like current implementation)
- **BUT:** Grays out or shows "(0)" for combinations that yield no results
- Adds tooltip: "Showing X of Y total with this trait"

### Pattern 3: Nested Counts (Rarible)
- Shows both numbers: "APEX (10 total, 4 in current selection)"

### Current Implementation: Static Global Counts
- Simplest to implement (no complex recalculation)
- Fastest performance (single traits query)
- **But:** Most confusing UX

---

## Test Case: Reproduce The Issue

### Setup
```
Collection has:
- 10 tokens with "APEX" word
  - 4 are Infinity shaped
  - 6 are other shapes (Circle, Square, etc.)
```

### Steps
1. Navigate to `/gallery`
2. Click "Infinity" in Shape filter
3. Observe sidebar: "APEX: 10"
4. Click "APEX" in Words filter
5. Observe grid: 4 tokens displayed

### Result
- Sidebar: APEX: 10
- Grid: 4 tokens
- Discrepancy: 10 vs 4

### Root Cause
- Sidebar shows: tokens with APEX (entire collection) = 10
- Grid shows: tokens with (Infinity AND APEX) = 4

---

## Additional Issue: Malformed Token IDs

### Data Shows Multiple Tokens with tokenId: "0"

From the API response:
```json
{"tokenId": "0", "name": "Retro NFT #\r"},       // Control char \r
{"tokenId": "0", "name": "Retro NFT #\u001a"},   // Control char \u001a
{"tokenId": "0", "name": "Retro NFT #\u001b"},   // Control char \u001b
{"tokenId": "42", "name": "Retro NFT #42"}       // Correct ✓
```

### Cause: Token Name Parsing Failure

**Code:** `api/nft/collection/list.js:146`
```javascript
const tokenIdMatch = token.token_name?.match(/Retro NFT #(\d+)/);
const tokenId = tokenIdMatch ? tokenIdMatch[1] : '0';
```

**Issue:**
- Regex expects: `"Retro NFT #123"`
- Indexer returns: `"Retro NFT #\r"` (with control characters)
- Regex fails to match → defaults to tokenId `'0'`

**Impact:**
- Multiple distinct tokens get mapped to same tokenId
- Potential for incorrect deduplication if implemented
- Confusing for users seeing "Retro NFT #\r" as name

**Root Cause:**
- Aptos indexer data quality issue, OR
- Smart contract storing token names with control characters, OR
- Encoding issues in data pipeline

---

## Why My Initial Investigation Was Wrong

### What I Initially Thought
Cache timing mismatch between traits API and list API causing count differences.

### Why That Was Wrong
- No new NFTs minted in days → cache would have refreshed hundreds of times
- Cache timing can't explain **persistent** discrepancies
- Cache theory would cause **random** mismatches, not consistent ones

### What Actually Happened
- I didn't have actual data to analyze
- Made assumptions based on architecture review
- Jumped to conclusions about caching without testing

### Lesson Learned
**Always get actual data before diagnosing.** Without seeing the real API responses, I was just guessing.

---

## Summary

### The Core Issue
**Sidebar displays global trait counts, but applies filters cumulatively (AND logic) when showing results.**

### It's Not A Bug, It's A UX Design Choice
- The code is working **as designed**
- Trait counts are correctly calculated for entire collection
- Filtering correctly applies AND logic across all selected traits
- **But:** User expectations don't match the design

### Two Separate Issues
1. **Filter Count Confusion** - Global vs filtered counts (UX design issue)
2. **Malformed Token IDs** - Parsing failure due to control characters in names (data quality issue)

---

## Impact Assessment

### Issue 1: Filter Count Confusion
- **Severity:** Medium (UX confusion)
- **User Impact:** Confusing, but not broken
- **Functional Impact:** Filtering works correctly
- **Data Integrity:** No issues

### Issue 2: Malformed Token IDs
- **Severity:** Medium (data quality)
- **User Impact:** Weird token names displayed
- **Functional Impact:** Potential issues if tokenId is used as unique key
- **Data Integrity:** Multiple tokens with same parsed ID

---

## Recommendations (Not Implemented)

### For Issue 1: Filter Count Confusion

**Option A: Dynamic Filtering** (Best UX, more complex)
- Pass active filters to traits API
- Recalculate counts based on current selections
- Update sidebar when any filter changes

**Option B: Visual Indicators** (Good compromise)
- Keep global counts
- Add "(X available)" next to count when filters active
- Example: "APEX: 10 (4 available with current filters)"

**Option C: Tooltips** (Minimal change)
- Add tooltip: "Total across collection"
- Add note: "Counts may differ when multiple filters applied"

**Option D: Client-Side Calculation** (Performance impact)
- Fetch all tokens once
- Calculate filtered counts client-side as filters change
- Trade-off: More memory, better UX

### For Issue 2: Malformed Token IDs

**Option A: Robust Parsing** (Quick fix)
- Strip control characters before regex matching
- Try alternative extraction methods
- Better fallback than always using '0'

**Option B: Use token_data_id** (Proper fix)
- Use `token_data_id` from GraphQL as unique identifier
- Don't rely on parsing token names
- Guaranteed unique by Aptos indexer

**Option C: Fix At Source** (Best long-term)
- Investigate why token names have control characters
- Fix smart contract or minting process
- Update existing tokens if possible

---

## Files Involved

### Backend
- `api/nft/collection/traits.js` - Returns global counts (not filter-aware)
- `api/nft/collection/list.js` - Applies filters with AND logic, has tokenId parsing bug

### Frontend
- `frontend/components/gallery/FilterSidebar.tsx` - Displays global counts without context
- `frontend/components/gallery/Gallery.tsx` - Manages filter state

### External
- Aptos GraphQL Indexer - Source of token data (possibly with quality issues)

---

## Conclusion

**The "discrepancy" is not a bug - it's a UX design where global counts don't update based on active filters.**

When a user selects multiple filters:
- Sidebar shows: "How many tokens in total have this trait?" (global)
- Grid shows: "How many tokens match ALL selected filters?" (filtered)

Both numbers are mathematically correct, but the user experience is confusing because there's no indication that sidebar counts are global rather than dynamically filtered.

**Additionally:** Token ID parsing has issues with control characters in token names, causing multiple tokens to be mapped to ID "0".

---

## Investigation Methodology

1. ✅ Initial architecture review (led to wrong conclusion)
2. ✅ Requested actual API data from user
3. ✅ Analyzed real API responses showing both filters active
4. ✅ Traced through filtering logic with actual data
5. ✅ Identified UX design pattern mismatch
6. ✅ Discovered secondary tokenId parsing issue
7. ✅ Compared to common NFT marketplace patterns

**Result:** UX design issue + data quality issue, NOT cache timing or logic bug.
